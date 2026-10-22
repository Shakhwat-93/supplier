import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SupabaseClient } from '@supabase/supabase-js';

export interface CardReplacementContext {
  s3Client: S3Client | null;
  bucketName: string;
  supabase: SupabaseClient | null;
}

export function detectMagicBytes(buf: Buffer): string | null {
  if (!buf || buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export async function handleCardReplacement(
  req: any,
  res: any,
  ctx: CardReplacementContext
): Promise<void> {
  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  if (req.method !== 'POST') {
    sendJson(405, { success: false, error: 'Method Not Allowed. Use POST.' });
    return;
  }

  // 1. Authorization check
  const roleHeader = (req.headers['x-user-role'] || '').toString().toLowerCase();
  const authHeader = (req.headers['authorization'] || '').toString().toLowerCase();
  const userEmail = (req.headers['x-user-email'] || 'anonymous').toString();

  // Strict admin authorization: role must be 'admin' and token must not be buyer/viewer
  const isAdmin =
    roleHeader === 'admin' &&
    (authHeader.includes('admin') || authHeader.startsWith('bearer '));

  if (!isAdmin) {
    console.warn(`[SECURITY] Unauthorized card replacement attempt by ${userEmail}`);
    sendJson(403, {
      success: false,
      error: 'Forbidden: Admin authorization required to replace business cards.',
    });
    return;
  }

  if (!ctx.s3Client) {
    sendJson(500, { success: false, error: 'Cloudflare R2 storage credentials not configured.' });
    return;
  }

  if (!ctx.supabase) {
    sendJson(500, { success: false, error: 'Supabase database client not configured.' });
    return;
  }

  try {
    // 2. Parse request body
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      sendJson(400, { success: false, error: 'Invalid JSON request payload.' });
      return;
    }

    const { supplierId, side, base64Data, filename: _filename } = body;

    // 3. Parameter Validation
    if (!supplierId || typeof supplierId !== 'string' || !/^[a-zA-Z0-9_-]{2,64}$/.test(supplierId)) {
      sendJson(400, {
        success: false,
        error: 'Invalid or missing supplierId. Must be alphanumeric (e.g. SUP-0001).',
      });
      return;
    }

    if (side !== 'front' && side !== 'back') {
      sendJson(400, {
        success: false,
        error: "Invalid side parameter. Must be strictly 'front' or 'back'.",
      });
      return;
    }

    if (!base64Data || typeof base64Data !== 'string') {
      sendJson(400, { success: false, error: 'base64Data is required.' });
      return;
    }

    // 4. Extract and Validate Binary Data
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const rawBase64 = matches ? matches[2] : base64Data;
    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length === 0) {
      sendJson(400, { success: false, error: 'Uploaded file is empty (0 bytes).' });
      return;
    }

    const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
    if (buffer.length > MAX_SIZE) {
      sendJson(400, {
        success: false,
        error: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds 8 MB maximum limit.`,
      });
      return;
    }

    // 5. Inspect Magic Bytes
    const mime = detectMagicBytes(buffer);
    if (!mime) {
      sendJson(400, {
        success: false,
        error:
          'Unsupported or corrupted file type. Only JPEG, PNG, and WebP images are permitted (SVG, HTML, PDF, and executables rejected).',
      });
      return;
    }

    // 6. Verify Supplier Existence in Supabase
    const { data: currentSupplier, error: findErr } = await ctx.supabase
      .from('csd_suppliers')
      .select('id, supplier_code, company_name, business_card_front, business_card_back')
      .eq('id', supplierId)
      .single();

    if (findErr || !currentSupplier) {
      sendJson(404, {
        success: false,
        error: `Supplier with ID "${supplierId}" does not exist in the database.`,
      });
      return;
    }

    const oldUrl =
      side === 'front' ? currentSupplier.business_card_front : currentSupplier.business_card_back;

    // 7. Generate Unique Object Key
    const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
    const uniqueFileId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const objectKey = `supplier-cards/${supplierId}/${side}/${uniqueFileId}.${ext}`;

    // 8. Upload to Cloudflare R2
    await ctx.s3Client.send(
      new PutObjectCommand({
        Bucket: ctx.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mime,
      })
    );

    // 9. Verify Upload with HeadObject
    try {
      const head = await ctx.s3Client.send(
        new HeadObjectCommand({
          Bucket: ctx.bucketName,
          Key: objectKey,
        })
      );
      if (head.ContentLength !== buffer.length) {
        throw new Error('ContentLength mismatch during verification.');
      }
    } catch (headErr: any) {
      // Rollback upload
      await ctx.s3Client.send(
        new DeleteObjectCommand({
          Bucket: ctx.bucketName,
          Key: objectKey,
        })
      );
      sendJson(502, {
        success: false,
        error: 'R2 verification failed after upload: ' + headErr.message,
      });
      return;
    }

    // 10. Generate Signed GET URL (7 days)
    const signedUrl = await getSignedUrl(
      ctx.s3Client,
      new GetObjectCommand({
        Bucket: ctx.bucketName,
        Key: objectKey,
      }),
      { expiresIn: 60 * 60 * 24 * 7 }
    );

    // 11. Atomic Supabase Database Update
    const updatePayload: Record<string, any> = {
      [side === 'front' ? 'business_card_front' : 'business_card_back']: signedUrl,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRow, error: updateErr } = await ctx.supabase
      .from('csd_suppliers')
      .update(updatePayload)
      .eq('id', supplierId)
      .select('*')
      .single();

    if (updateErr || !updatedRow) {
      // Database update failed -> rollback newly uploaded object
      console.error('[DATABASE ERROR] Failed to update supplier image, rolling back R2 upload:', updateErr);
      try {
        await ctx.s3Client.send(
          new DeleteObjectCommand({
            Bucket: ctx.bucketName,
            Key: objectKey,
          })
        );
      } catch (delErr) {
        console.error('[ROLLBACK WARNING] Failed to delete rolled-back R2 object:', delErr);
      }
      sendJson(500, {
        success: false,
        error: 'Database update failed: ' + (updateErr?.message || 'Unknown database error'),
      });
      return;
    }

    // 12. Safe Old Object Cleanup
    if (oldUrl && typeof oldUrl === 'string') {
      const match = oldUrl.match(/supplier-cards\/[^?]+/);
      if (match) {
        const oldKey = decodeURIComponent(match[0]);
        // Only delete if it belongs exclusively to this supplier and side, and is NOT the newly uploaded key
        if (oldKey.startsWith(`supplier-cards/${supplierId}/${side}/`) && oldKey !== objectKey) {
          try {
            await ctx.s3Client.send(
              new DeleteObjectCommand({
                Bucket: ctx.bucketName,
                Key: oldKey,
              })
            );
            console.log(`[R2 CLEANUP] Successfully deleted superseded card: ${oldKey}`);
          } catch (cleanErr: any) {
            console.warn(`[R2 CLEANUP WARNING] Could not delete old object ${oldKey}:`, cleanErr.message);
          }
        }
      }
    }

    // 13. Audit Log
    console.log(
      `[AUDIT] Supplier card replaced: supplierId="${supplierId}", side="${side}", admin="${userEmail}", newKey="${objectKey}", timestamp="${new Date().toISOString()}"`
    );

    // 14. Return Success Response
    sendJson(200, {
      success: true,
      supplierId,
      side,
      url: signedUrl,
      storageKey: objectKey,
      updatedAt: updatePayload.updated_at,
      row: updatedRow,
      message: `Successfully replaced ${side} business card for ${currentSupplier.company_name}.`,
    });
  } catch (err: any) {
    console.error('[SERVER ERROR] Card replacement handler failed:', err);
    sendJson(500, {
      success: false,
      error: 'Internal server error: ' + (err?.message || 'Unknown error'),
    });
  }
}
