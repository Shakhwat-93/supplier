/**
 * AUTO-ENTRY SCRIPT: SUP-0070
 * Yiwu Shuaite Toys Co., Ltd. (义乌市帅特玩具有限公司)
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

// Image 1 is Front (Logo, 义乌市帅特玩具有限公司, YIWU SHUAITE TOYS CO., LTD., contact 李剑锋, phones, addresses)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475672468_fab7c5b0.jpg';
// Image 2 is Back (shuaite TOYS logo, ywshuaite.com, 1688 URL, specialization, WeChat QR, bank info)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475672470_3906af2e.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0070');
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

  // 1. Pre-check DB to ensure SUP-0070 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0070');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0070 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0070/front.jpg';
  const backKey = 'supplier-cards/SUP-0070/back.jpg';

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
    id: 'SUP-0070',
    supplier_code: 'SUP-0070',
    company_name: 'Yiwu Shuaite Toys Co., Ltd.',
    company_name_cn: '义乌市帅特玩具有限公司',
    brand: 'SHUAITE TOYS / 帅特玩具',
    category_id: 'cat-toys',
    raw_category: 'Electronic Flash & LED Light-up Toys (电子闪光及发光玩具)',
    supplier_type: 'Manufacturer',
    contact_person: 'Li Jianfeng (李剑锋)',
    position: 'Vice President of Toy Association / General Manager (玩具协会副会长)',
    phone: '13705791133; (86)0579-85282151',
    has_whatsapp: false,
    email: 'ST21772000@163.com',
    website: 'http://www.ywshuaite.com',
    qq_messaging: '2930292917 (Shop); 601332341 (Direct)',
    address: 'Booth No. 2151, Street 7, 1st Floor, District D, Phase 1, Yiwu International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城一期D区一楼七街2151摊位)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Electronic flash toys & LED novelties',
      'LED flashing jump ropes',
      'Flashing LED headbands & hair accessories',
      'Light-up festival toys & party props',
      'Custom OEM/ODM electronic toy manufacturing',
    ],
    products_services: 'Specializes in customizing and manufacturing electronic flash toys, flash jump ropes, flash headbands and other LED-related light-up novelty products (专业生产定制各种电子闪光玩具、闪光跳绳、闪光头扣等发光系列玩具及OEM/ODM定制)',
    notes: 'Operates manufacturing facility in Heyetang Industrial Area and showroom at Booth 2151, District D, Phase 1, Yiwu International Trade City. Key recommended supplier on Yiwugou (Shop 2151) and 1688 (shop0680960419sz0.1688.com). Contact Li Jianfeng serves as Vice President of Toy Association. Bank accounts on reverse (ABC, BOC, Chouzhou Bank under Li Jianfeng / Tong Maoying) intentionally excluded from contact fields for privacy compliance.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/MPbgh2yQtLat9UKu-QFIj8A',
    verification_status: 'Card transcription verified; 1688, official site & WeChat active; Yiwu Toy Association executive',
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
  console.log('✅ Successfully inserted SUP-0070 into Supabase csd_suppliers!\n');

  // 6. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0070')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0070!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 70)\n`);

  // 7. Synchronize local initialSuppliers.ts for offline fallback
  console.log('--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  const existingIdx = suppliersArray.findIndex((s) => s.id === 'SUP-0070');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0070 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
