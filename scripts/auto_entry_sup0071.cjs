/**
 * AUTO-ENTRY SCRIPT: SUP-0071
 * Shangyu City Tian Bo Make An Umbrella Co., Ltd. (上虞市天波制伞有限公司)
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

// Image 1 is Front (Pink background, Tianbo Umbrella, 何浩芳, mobiles, address, email, site, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475680840_b3792cde.jpg';
// Image 2 is Back (Preserved per upload)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475680846_5bd26349.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0071');
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

  // 1. Pre-check DB to ensure SUP-0071 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0071');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0071 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0071/front.jpg';
  const backKey = 'supplier-cards/SUP-0071/back.jpg';

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

  // 4. Generate Signed URLs
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

  // 5. Assemble complete database record
  console.log('--- PHASE 2: Database Record Insertion ---');
  const now = new Date().toISOString();

  const supplierRecord = {
    id: 'SUP-0071',
    supplier_code: 'SUP-0071',
    company_name: 'Shangyu City Tian Bo Make An Umbrella Co., Ltd. (Tianbo Umbrella)',
    company_name_cn: '上虞市天波制伞有限公司',
    brand: 'TIAN BO / 天波制伞',
    category_id: 'cat-accessories',
    raw_category: 'Umbrellas & Rainwear (制伞 / 晴雨伞及伞具配件)',
    supplier_type: 'Manufacturer',
    contact_person: 'He Hao Fang (何浩芳)',
    position: 'Sales / Factory Representative',
    phone: '13989432818; Factory Rep: 13806760399; Fax: 0579-85183346; 0579-82682581',
    has_whatsapp: false,
    email: 'tianbo1888@yeach.net',
    website: 'http://www.tianbo1888.cn',
    qq_messaging: '1045959352',
    address: 'Shop No. F1-10574, Street 10, Phase 2, Yiwu International Trade City, Yiwu, Zhejiang, China (义乌市国际商贸城二期十街F1-10574)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Umbrellas & rainwear',
      'Folding umbrellas & straight umbrellas',
      'Sun & UV protection parasols',
      'Advertising & promotional custom umbrellas',
      'OEM/ODM umbrella manufacturing',
    ],
    products_services: 'Manufacturer of folding umbrellas, straight umbrellas, sun parasols, advertising gift umbrellas, and custom OEM umbrella production (专业生产三折伞、直杆伞、遮阳伞、广告礼品伞及外贸伞具定制生产)',
    notes: 'Manufacturer based in Shangyu (China umbrella manufacturing hub) with showroom at Shop F1-10574, Street 10, Phase 2, Yiwu International Trade City. WeChat QR decoded and active. Attached images preserved in R2 storage per user confirmation; product scope categorized strictly under Umbrellas & Rainwear.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/MG-k-6Fbq28Pom-2OwbOmBw',
    verification_status: 'Card transcription verified; official site & WeChat active; booth F1-10574 at Yiwu Trade City Phase 2',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    is_favorite: false,
    is_demo: false,
    created_at: now,
    updated_at: now,
  };

  const { error: insertErr } = await supabase.from('csd_suppliers').insert(supplierRecord);
  if (insertErr) {
    throw new Error('Supabase insert failed: ' + insertErr.message);
  }
  console.log('✅ Successfully inserted SUP-0071 into Supabase csd_suppliers!\n');

  // 6. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0071')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0071!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 71)\n`);

  // 7. Synchronize local initialSuppliers.ts for offline fallback
  console.log('--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  const existingIdx = suppliersArray.findIndex((s) => s.id === 'SUP-0071');
  if (existingIdx !== -1) {
    suppliersArray[existingIdx] = supplierRecord;
  } else {
    suppliersArray.push(supplierRecord);
  }

  const newTsContent =
    fileContent.substring(0, start) +
    JSON.stringify(suppliersArray, null, 2) +
    ';\n';

  fs.writeFileSync(initialSuppliersPath, newTsContent, 'utf8');
  console.log(`✅ Synchronized initialSuppliers.ts with ${suppliersArray.length} suppliers.\n`);

  console.log('====================================================');
  console.log('🎉 AUTO-ENTRY FOR SUP-0071 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
