/**
 * AUTO-ENTRY SCRIPT: SUP-0074
 * GuangDong ChengHai WeiZuan Toys Co., Ltd. (广东澄海炜钻玩具有限公司)
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

// Image 2 is Front (WEIZUAN TOYS logo, 廣東澄海煒鑽玩具有限公司, 陈俊伟, mobiles, dual addresses, email, QQ, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475779450_5c32a939.jpg';
// Image 1 is Back (Working Area, R/C, Electric and Model toys, bank info, Welcome to Weizuan Toys World)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475779439_cddf77fc.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0074');
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

  // 1. Pre-check DB to ensure SUP-0074 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0074');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0074 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0074/front.jpg';
  const backKey = 'supplier-cards/SUP-0074/back.jpg';

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
    id: 'SUP-0074',
    supplier_code: 'SUP-0074',
    company_name: 'GuangDong ChengHai WeiZuan Toys Co., Ltd. (Weizuan Toys)',
    company_name_cn: '广东澄海炜钻玩具有限公司',
    brand: 'WEIZUAN TOYS® / 炜钻玩具',
    category_id: 'cat-toys',
    raw_category: 'Remote Control (R/C), Electric & Model Toys (遥控、电动及模型玩具)',
    supplier_type: 'Manufacturer',
    contact_person: 'Chen Jun Wei (陈俊伟)',
    position: 'General Manager / Factory Owner',
    phone: '13588692789; 18868576663; Showroom 1: (86)0579-85288633; Showroom 2: (86)0579-85292338',
    has_whatsapp: false,
    email: '349109229@qq.com',
    website: '',
    qq_messaging: '1431165933',
    address: 'Showroom 1: East Auxiliary Room, 1st Floor, Region D, Rooms F1-163-167; Showroom 2: Store No. E1-2932, Street 11, District E, Phase 1, Yiwu International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城一楼D区东辅房F1-163-167 / 一期一楼11街E区2932店); Factory: Chenghai, Shantou, Guangdong (广东澄海)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Remote control (R/C) cars, drones & vehicles (各种高中低档遥控玩具)',
      'Electric & electromotion toys (电动玩具)',
      'Scale model toys & vehicles (模型玩具系列产品)',
      'High, medium & economy grade toy series (高、中、低档系列玩具)',
      'Chenghai export toy manufacturing & wholesale (澄海玩具外贸出口与定制)',
    ],
    products_services: 'Manufacturer of various grades of remote control (R/C) toys, electric toys, and scale model toy series from Chenghai toy manufacturing base (专业生产批发各种高中低档遥控、电动、模型玩具系列产品，承接内销外贸订单)',
    notes: 'Dual wholesale showrooms operating in Yiwu International Trade City: Region D East Auxiliary Rooms F1-163-167 and Phase 1 Street 11 Booth E1-2932. Manufacturing base in Chenghai, Shantou, Guangdong. Bank accounts on reverse (BOC under Chen Junwei and ABC under Huang Wenyuan) intentionally excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: http://weixin.qq.com/r/O447I5LEDM9zrdZA99sp',
    verification_status: 'Card transcription verified; WeChat active; dual showrooms at Yiwu Trade City Phase 1 & factory in Chenghai',
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
  console.log('✅ Successfully inserted SUP-0074 into Supabase csd_suppliers!\n');

  // 6. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0074')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0074!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 74)\n`);

  // 7. Synchronize local initialSuppliers.ts for offline fallback
  console.log('--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  const existingIdx = suppliersArray.findIndex((s) => s.id === 'SUP-0074');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0074 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
