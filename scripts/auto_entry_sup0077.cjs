/**
 * AUTO-ENTRY SCRIPT: SUP-0077
 * Zhejiang Dongyang Qianghui Umbrella Co., Ltd. (浙江东阳市强辉伞业有限公司)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucketName = process.env.R2_BUCKET_NAME || 'china-supplier-directory';

// Image 1 is Front (浙江东阳市强辉伞业有限公司, 金海滨, 13566739430, 义乌二区F区10587店, 厂址: 东阳市江北开发区, QQ: 377856715)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475812187_d732173f.jpg';
// Image 2 is Back (4 bank accounts, 欢迎定做各类广告伞、外贸伞、礼品伞等)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475812198_1a47ed74.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0077');
  console.log('====================================================\n');

  if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
    throw new Error('Source business card images not found.');
  }

  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  const frontHash = crypto.createHash('sha256').update(frontBuf).digest('hex');
  const backHash = crypto.createHash('sha256').update(backBuf).digest('hex');

  console.log('[Source Files Verified]');
  console.log(`Front: ${frontBuf.length} bytes, SHA-256: ${frontHash}`);
  console.log(`Back:  ${backBuf.length} bytes, SHA-256: ${backHash}\n`);

  // 1. Pre-check DB to ensure SUP-0077 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0077');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0077 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0077/front.jpg';
  const backKey = 'supplier-cards/SUP-0077/back.jpg';

  console.log(`Uploading Front image -> ${frontKey}`);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: frontKey,
      Body: frontBuf,
      ContentType: 'image/jpeg',
    })
  );

  console.log(`Uploading Back image -> ${backKey}`);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: backKey,
      Body: backBuf,
      ContentType: 'image/jpeg',
    })
  );

  // 3. Verify R2 objects via HeadObject
  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));

  if (frontHead.ContentLength !== frontBuf.length || backHead.ContentLength !== backBuf.length) {
    throw new Error('Size mismatch detected during R2 object verification!');
  }
  console.log('✅ Cloudflare R2 upload and byte verification succeeded!\n');

  // 4. Generate 7-day presigned URLs
  console.log('--- PHASE 2: Presigned URL Generation ---');
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

  console.log('Front Signed URL generated.');
  console.log('Back Signed URL generated.\n');

  // 5. Verify GET accessibility
  console.log('--- PHASE 3: HTTP Availability Verification ---');
  const checkFront = await fetch(frontSignedUrl, { headers: { Range: 'bytes=0-10' } });
  const checkBack = await fetch(backSignedUrl, { headers: { Range: 'bytes=0-10' } });

  if (checkFront.status !== 206 && checkFront.status !== 200) {
    throw new Error(`R2 Verification Failed: Front=${checkFront.status}`);
  }
  if (checkBack.status !== 206 && checkBack.status !== 200) {
    throw new Error(`R2 Verification Failed: Back=${checkBack.status}`);
  }
  console.log(`✓ Front R2 URL Accessible (Status: ${checkFront.status})`);
  console.log(`✓ Back R2 URL Accessible (Status: ${checkBack.status})\n`);

  // 6. Insert into Supabase
  console.log('--- PHASE 4: Supabase Database Insertion ---');
  const now = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0077',
    supplier_code: 'SUP-0077',
    company_name: 'Zhejiang Dongyang Qianghui Umbrella Co., Ltd.',
    company_name_cn: '浙江东阳市强辉伞业有限公司',
    brand: 'QIANGHUI® / 强辉®',
    category_id: 'cat-accessories',
    raw_category: 'Umbrellas & Rainwear (广告伞、外贸伞、礼品伞制伞定制)',
    supplier_type: 'Manufacturer',
    contact_person: 'Jin Haibin (金海滨)',
    position: 'General Manager / Factory Owner',
    phone: '13566739430; 13758935255; 13967981805',
    has_whatsapp: false,
    email: null,
    website: null,
    qq_messaging: '377856715',
    address: 'Shop 10587, 10th Street, Area F, District 2, Yiwu International Trade City, Yiwu, Zhejiang, China (门市部: 义乌国际商贸城二区F区10587店10街; 厂址: 浙江省东阳市江北开发区)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Advertising umbrellas & promotional umbrellas (广告伞定制)',
      'Foreign trade export umbrellas (外贸伞)',
      'Gift umbrellas & corporate giveaways (礼品伞)',
      'Straight stick umbrellas & folding umbrellas (直杆伞、折叠伞)',
      'Custom logo printing & umbrella frame OEM manufacturing'
    ],
    products_services: 'Manufacturing, customization, and export of advertising umbrellas, foreign trade umbrellas, and gift umbrellas (专业研发生产定做各类广告伞、外贸伞、礼品伞等)',
    notes: 'Showroom located at Shop 10587, 10th Street, Area F, District 2, Yiwu International Trade City. Factory based in Jiangbei Development Zone, Dongyang City. Four bank accounts on card back (ICBC, ABC, CCB, BOC under Jin Haibin) intentionally excluded for privacy compliance. No QR code printed on card.',
    qr_status: 'none',
    qr_payload: null,
    verification_status: 'Card transcription verified; physical showroom at Yiwu Trade City District 2; factory in Dongyang Jiangbei Development Zone',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    is_favorite: false,
    is_demo: false,
    created_at: now,
    updated_at: now,
  };

  const { data: insertData, error: insertError } = await supabase
    .from('csd_suppliers')
    .insert([supplierRecord])
    .select();

  if (insertError) {
    throw new Error(`Database Insert Failed: ${insertError.message}`);
  }
  console.log(`✓ Inserted SUP-0077 into Supabase successfully! Records returned: ${insertData.length}\n`);

  // 7. Update local initialSuppliers.ts for offline/fallback parity
  console.log('--- PHASE 5: Syncing src/data/initialSuppliers.ts ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  // Insert before the last closing `];`
  const lastBracketIndex = fileContent.lastIndexOf('];');
  if (lastBracketIndex === -1) {
    throw new Error('Could not find closing bracket in initialSuppliers.ts');
  }

  const jsonSnippet = ',\n  ' + JSON.stringify(supplierRecord, null, 2).replace(/\n/g, '\n  ') + '\n';
  const updatedContent = fileContent.slice(0, lastBracketIndex).trimEnd() + jsonSnippet + '];\n';

  fs.writeFileSync(initialSuppliersPath, updatedContent, 'utf8');
  console.log('✓ Synced initialSuppliers.ts with SUP-0077.\n');

  console.log('====================================================');
  console.log('🎉 SUCCESS: SUP-0077 ENTRY FULLY COMPLETED');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ FATAL ERROR during auto-entry execution:', err);
  process.exit(1);
});
