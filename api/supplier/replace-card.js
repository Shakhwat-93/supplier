import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';

function detectMagicBytes(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 1. Authorization check
  const roleHeader = (req.headers['x-user-role'] || '').toString().toLowerCase();
  const authHeader = (req.headers['authorization'] || '').toString().toLowerCase();
  const userEmail = (req.headers['x-user-email'] || 'anonymous').toString();

  const isAdmin =
    roleHeader === 'admin' &&
    (authHeader.includes('admin') || authHeader.startsWith('bearer '));

  if (!isAdmin) {
    console.warn(`[SECURITY] Unauthorized card replacement attempt by ${userEmail}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Admin authorization required to replace business cards.',
    });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'china-supplier-directory';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({ success: false, error: 'R2 storage credentials not configured on server' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: 'Supabase credentials not configured on server' });
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { supplierId, side, base64Data } = req.body || {};

    if (!supplierId || typeof supplierId !== 'string' || !/^[a-zA-Z0-9_-]{2,64}$/.test(supplierId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing supplierId. Must be alphanumeric (e.g. SUP-0001).',
      });
    }

    if (side !== 'front' && side !== 'back') {
      return res.status(400).json({
        success: false,
        error: "Invalid side parameter. Must be strictly 'front' or 'back'.",
      });
    }

    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ success: false, error: 'base64Data is required.' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const rawBase64 = matches ? matches[2] : base64Data;
    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, error: 'Uploaded file is empty (0 bytes).' });
    }

    const MAX_SIZE = 8 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds 8 MB maximum limit.`,
      });
    }

    const mime = detectMagicBytes(buffer);
    if (!mime) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported or corrupted file type. Only JPEG, PNG, and WebP images are permitted.',
      });
    }

    // Verify supplier exists
    const { data: currentSupplier, error: findErr } = await supabase
      .from('csd_suppliers')
      .select('id, supplier_code, company_name, business_card_front, business_card_back')
      .eq('id', supplierId)
      .single();

    if (findErr || !currentSupplier) {
      return res.status(404).json({
        success: false,
        error: `Supplier with ID "${supplierId}" does not exist in the database.`,
      });
    }

    const oldUrl = side === 'front' ? currentSupplier.business_card_front : currentSupplier.business_card_back;

    const ext = mime === 'image/webp' ? 'webp' : mime === 'image/png' ? 'png' : 'jpg';
    const uniqueFileId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const objectKey = `supplier-cards/${supplierId}/${side}/${uniqueFileId}.${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mime,
      })
    );

    // Verify upload
    try {
      const head = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );
      if (head.ContentLength !== buffer.length) {
        throw new Error('ContentLength mismatch during verification.');
      }
    } catch (headErr) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );
      return res.status(502).json({
        success: false,
        error: 'R2 verification failed: ' + headErr.message,
      });
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      }),
      { expiresIn: 60 * 60 * 24 * 7 }
    );

    const updatePayload = {
      [side === 'front' ? 'business_card_front' : 'business_card_back']: signedUrl,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRow, error: updateErr } = await supabase
      .from('csd_suppliers')
      .update(updatePayload)
      .eq('id', supplierId)
      .select('*')
      .single();

    if (updateErr || !updatedRow) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
          })
        );
      } catch (delErr) {
        console.error('Failed to cleanup R2 object after DB error:', delErr);
      }
      return res.status(500).json({
        success: false,
        error: 'Database update failed: ' + (updateErr?.message || 'Unknown database error'),
      });
    }

    // Cleanup old object if uniquely owned
    if (oldUrl && typeof oldUrl === 'string') {
      const match = oldUrl.match(/supplier-cards\/[^?]+/);
      if (match) {
        const oldKey = decodeURIComponent(match[0]);
        if (oldKey.startsWith(`supplier-cards/${supplierId}/${side}/`) && oldKey !== objectKey) {
          try {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: oldKey,
              })
            );
          } catch (cleanErr) {
            console.warn('Could not delete superseded object:', cleanErr);
          }
        }
      }
    }

    console.log(`[AUDIT] Supplier card replaced: supplierId="${supplierId}", side="${side}", admin="${userEmail}"`);

    return res.status(200).json({
      success: true,
      supplierId,
      side,
      url: signedUrl,
      storageKey: objectKey,
      updatedAt: updatePayload.updated_at,
      row: updatedRow,
      message: `Successfully replaced ${side} business card.`,
    });
  } catch (err) {
    console.error('Card replacement error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + (err.message || 'Unknown error'),
    });
  }
}
