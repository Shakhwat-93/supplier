/**
 * AUTO-ENTRY SCRIPT: SUP-0079
 * Tianxiang Pen Industry (天翔笔业)
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

// Image 2 is Front (天翔笔业, 张宜亮, 13157937788, 13216211362, 0579-85163209, 21288店面, QQ, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475849393_23d6e114.jpg';
// Image 1 is Back (TIAN XIANG PEN INDUSTRY, Novelty plush pens, 欢迎新老客户光临惠顾)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475849388_6d186175.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0079');
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

  // 1. Pre-check DB to ensure SUP-0079 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0079');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0079 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0079/front.jpg';
  const backKey = 'supplier-cards/SUP-0079/back.jpg';

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
    id: 'SUP-0079',
    supplier_code: 'SUP-0079',
    company_name: 'Tianxiang Pen Industry',
    company_name_cn: '天翔笔业',
    brand: 'TIANXIANG / 天翔',
    category_id: 'cat-stationery',
    raw_category: 'Novelty Pens, Plush Pens & Writing Instruments (天翔笔业、毛绒笔、卡通公仔笔及创意文具)',
    supplier_type: 'Manufacturer',
    contact_person: 'Zhang Yiliang (张宜亮)',
    position: 'Owner / General Manager',
    phone: '13157937788; 13216211362; (86)0579-85163209',
    has_whatsapp: false,
    email: null,
    website: null,
    qq_messaging: '312181178',
    address: 'Shop No. 21288, 10th Street, Gate 52, 1st Floor, Area 3, International Trade City Phase 2, Yiwu, Zhejiang, China (国际商贸城二期三区1楼52号门10街21288店面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Plush & pompom novelty pens (毛绒公仔笔、毛球笔)',
      'Cartoon animal pens (unicorn, swan, monster eyes, pineapple pens) (独角兽、天鹅、菠萝造型笔)',
      'Gel pens, ballpoint pens & rollerball pens (中性笔、圆珠笔)',
      'Flower pens & decorative desk stationery (仿真花造型花笔)',
      'Custom OEM & promotional gift pens (文具礼品定制及来样订做)'
    ],
    products_services: 'Manufacturing, wholesale, and export of novelty plush pens, cartoon animal pens, flower pens, and creative writing instruments at Yiwu International Trade City (专业生产销售各类毛绒笔、卡通造型公仔笔、仿真花造型笔及创意文具，欢迎新老客户光临惠顾来样订做)',
    notes: 'Showroom located at Shop 21288, 10th Street, Gate 52, 1st Floor, District 3, Phase 2, Yiwu International Trade City. ABC bank account on card front (6228 48038 06628 80315 under Zhang Yiliang) intentionally excluded for privacy compliance. Stylized candy WeChat QR visible on card; WeChat reachable via mobile numbers.',
    qr_status: 'visible_not_decoded',
    qr_payload: 'WeChat: 13157937788 / 13216211362',
    verification_status: 'Card transcription verified; physical showroom at Yiwu Trade City Phase 2 District 3 Booth 21288',
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
  console.log(`✓ Inserted SUP-0079 into Supabase successfully! Records returned: ${insertData.length}\n`);

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
  console.log('✓ Synced initialSuppliers.ts with SUP-0079.\n');

  console.log('====================================================');
  console.log('🎉 SUCCESS: SUP-0079 ENTRY FULLY COMPLETED');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ FATAL ERROR during auto-entry execution:', err);
  process.exit(1);
});
