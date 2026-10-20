import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { filename, contentType, base64Data, side } = req.body || {};

    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || 'china-supplier-directory';
    const prefix = process.env.R2_PREFIX || 'china-supplier-directory/';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return res.status(500).json({ error: 'R2 storage credentials not configured on server' });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
    const mime = contentType || (matches ? matches[1] : 'image/jpeg');

    const safeName = (filename || 'card.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${prefix}cards/${Date.now()}-${side || 'front'}-${safeName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mime,
      })
    );

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
      { expiresIn: 60 * 60 * 24 * 7 }
    );

    return res.status(200).json({
      success: true,
      url: signedUrl,
      storageKey: key,
    });
  } catch (err) {
    console.error('R2 upload failed:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
}
