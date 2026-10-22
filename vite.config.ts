import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { handleCardReplacement } from './src/server/cardReplacementHandler';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const accountId = env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'china-supplier-directory';
  const prefix = env.R2_PREFIX || process.env.R2_PREFIX || 'china-supplier-directory/';

  const s3Client =
    accountId && accessKeyId && secretAccessKey
      ? new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        })
      : null;

  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  const setupMiddlewares = (server: any) => {
    // 1. Direct secure card replacement API
    server.middlewares.use('/api/supplier/replace-card', async (req: any, res: any) => {
      await handleCardReplacement(req, res, {
        s3Client,
        bucketName,
        supabase,
      });
    });

    // 2. Legacy / generic R2 upload API
    server.middlewares.use('/api/r2/upload', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      if (!s3Client) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'R2 storage credentials not configured' }));
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const { filename, contentType, base64Data, side } = body;

        if (!base64Data) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'base64Data is required' }));
          return;
        }

        // Extract binary buffer from data URL or raw base64
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

        // Generate signed GET URL valid for 7 days
        const signedUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          }),
          { expiresIn: 60 * 60 * 24 * 7 }
        );

        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            url: signedUrl,
            storageKey: key,
          })
        );
      } catch (err: any) {
        console.error('R2 upload failed:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Upload failed' }));
      }
    });
  };

  return {
    plugins: [
      react(),
      {
        name: 'r2-upload-api',
        configureServer(server) {
          setupMiddlewares(server);
        },
        configurePreviewServer(server) {
          setupMiddlewares(server);
        },
      },
    ],
    server: {
      port: 3300,
      open: false,
    },
    preview: {
      port: 3300,
    },
  };
});
