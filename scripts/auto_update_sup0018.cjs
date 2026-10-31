/**
 * AUTO-UPDATE SCRIPT: SUP-0018
 * Yiwu Haocheng Pet Products Co., Ltd. (义乌市豪成宠物用品有限公司)
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: 'https://' + process.env.R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucketName = process.env.R2_BUCKET_NAME || 'china-supplier-directory';

// Image 2 is Front (HCTOYS logo, Yiwu Haocheng Pet Products, MIA, phone, WhatsApp, email, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475786713_3ef35667.jpg';
// Image 1 is Back (SOUND TOYS MORE JOY, Vinyl, TPR, Latex toys, Source Factory)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475786707_6b8fde2d.jpg';

async function updateSUP0018() {
  console.log('--- PHASE 1: Uploading high-res card images for SUP-0018 ---');
  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  const frontKey = 'supplier-cards/SUP-0018/front.jpg';
  const backKey = 'supplier-cards/SUP-0018/back.jpg';

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: frontKey,
    Body: frontBuf,
    ContentType: 'image/jpeg',
  }));

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: backKey,
    Body: backBuf,
    ContentType: 'image/jpeg',
  }));

  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));
  console.log('R2 Front bytes:', frontHead.ContentLength, 'Back bytes:', backHead.ContentLength);

  const frontSignedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucketName, Key: frontKey }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  const backSignedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucketName, Key: backKey }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  console.log('--- PHASE 2: Updating SUP-0018 in Supabase ---');
  const now = new Date().toISOString();
  const updatePayload = {
    company_name: 'YIWU HAOCHENG PET PRODUCTS CO., LTD.',
    company_name_cn: '义乌市豪成宠物用品有限公司 / 义乌市杭新宠物用品商行',
    brand: 'HCTOYS / 豪成玩具',
    category_id: 'cat-toys',
    raw_category: 'Pet Squeak Toys & Novelties (搪胶、TPR及乳胶宠物发声玩具)',
    supplier_type: 'Manufacturer',
    contact_person: 'MIA',
    position: 'Sales Manager',
    phone: '+86 18767930441',
    has_whatsapp: true,
    email: 'Haochengpettoy@outlook.com',
    address: 'Yiwu, Zhejiang, China (Yiwu Haocheng Pet Products Co., Ltd. / Yiwu Hangxin Pet Supplies Firm)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Vinyl pet sound & squeak toys (搪胶发声宠物玩具)',
      'TPR chew & teething pet toys (TPR耐磨磨牙玩具)',
      'Latex sound pet toys (乳胶宠物发声玩具)',
      'Safe & durable pet entertainment novelties',
      'Source factory direct supply & OEM/ODM manufacturing',
    ],
    products_services: 'Source factory direct supply of vinyl, TPR, and latex pet sound squeaker toys and chew toys. Safe, durable, and OEM/ODM custom orders supported (源头工厂生产直销搪胶、TPR耐磨磨牙、乳胶宠物发声玩具，品质保证，支持OEM/ODM定制)',
    notes: 'Card re-scanned and verified from physical card. Corrected Chinese company name to Yiwu Haocheng Pet Products Co., Ltd. / Yiwu Hangxin Pet Supplies Firm (义乌市豪成宠物用品有限公司 / 义乌市杭新宠物用品商行). WeChat QR decoded successfully. WhatsApp confirmed active on +86 18767930441.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/EMSE6LJ1CHKPnwYEnKc8YHM?s=2 | WhatsApp: +86 18767930441',
    verification_status: 'Card transcription & high-res scan verified; WeChat & WhatsApp active; source factory direct supply',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    updated_at: now,
  };

  const { error: updateErr } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0018');

  if (updateErr) {
    throw new Error('Supabase update failed: ' + updateErr.message);
  }
  console.log('✅ Successfully updated SUP-0018 in Supabase!');

  // Sync initialSuppliers.ts
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');
  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  const targetIdx = suppliersArray.findIndex(s => s.id === 'SUP-0018');
  if (targetIdx !== -1) {
    suppliersArray[targetIdx] = {
      ...suppliersArray[targetIdx],
      ...updatePayload,
    };
    const newTsContent =
      fileContent.substring(0, start) +
      JSON.stringify(suppliersArray, null, 2) +
      ';\n';
    fs.writeFileSync(initialSuppliersPath, newTsContent, 'utf8');
    console.log('✅ Synchronized initialSuppliers.ts with updated SUP-0018.');
  }
}

updateSUP0018().catch(err => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
