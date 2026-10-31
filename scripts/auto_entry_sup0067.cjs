/**
 * AUTO-ENTRY SCRIPT: SUP-0067
 * Shang Hai Halloween Co., Ltd. / Yiwu Shanghai Toys Co., Ltd. (义乌商海玩具有限公司)
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

// Image 2 is Front (Logo, company names, contact person Lunar, phones, address, email, QQ)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475037819_acacb967.jpg';
// Image 1 is Back (1688 URL, Chinagoods Look Picture QR, WeChat QR, bank info)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475037811_842f615b.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0067');
  console.log('====================================================\n');

  if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
    throw new Error('Source business card images not found.');
  }

  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  const frontHash = crypto.createHash('sha256').update(frontBuf).digest('hex');
  const backHash = crypto.createHash('sha256').update(backBuf).digest('hex');

  console.log(`[Source Files Verified]`);
  console.log(`Front: ${frontBuf.length} bytes, SHA-256: ${frontHash}`);
  console.log(`Back:  ${backBuf.length} bytes, SHA-256: ${backHash}\n`);

  // 1. Pre-check DB to ensure SUP-0067 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0067');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0067 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0067/front.jpg';
  const backKey = 'supplier-cards/SUP-0067/back.jpg';

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
    id: 'SUP-0067',
    supplier_code: 'SUP-0067',
    company_name: 'Shang Hai Halloween Co., Ltd. (Yiwu Shanghai Toys)',
    company_name_cn: '义乌商海玩具有限公司 / 义乌市韩妮儿电动毛绒玩具厂',
    brand: 'SHANG HAI HALLOWEEN',
    category_id: 'cat-toys',
    raw_category: 'Electric Plush Toys & Halloween Party Supplies',
    supplier_type: 'Manufacturer',
    contact_person: 'Lunar (龚迟青 / Gong Chiqing)',
    position: 'Managing Director',
    phone: '(86)18906891567; (86)0579-85285600',
    has_whatsapp: false,
    email: 'honeytoys@vip.163.com',
    website: 'https://honeytoys1688.1688.com',
    qq_messaging: '397780407; 2763392859',
    address: 'Shops 1F151-155, East Auxiliary Room, Gate 12, District C, Phase 1, International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城一期C区12号门东辅房1F151-155店面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Electric plush toys',
      'Halloween costumes & party supplies',
      'Plush dolls & characters',
      'Festival holiday gifts',
      'Custom plush manufacturing',
    ],
    products_services: 'Electric plush toys; Halloween festival toys and party supplies; custom plush manufacturing (电动毛绒玩具、万圣节玩具及派对礼品。支持根据客户订单开模定制：We can make it according to your order)',
    notes: 'Professional manufacturer of electric plush toys and Halloween party supplies. Operating 1688 store (honeytoys1688.1688.com) and Chinagoods shop 6185420. Bank accounts on reverse (ABC, BOC, ICBC, CCB under Zhang Xuehai) were intentionally excluded from contact fields for privacy.',
    qr_status: 'decoded',
    qr_payload: 'Chinagoods Shop: http://m.chinagoods.com/shop/6185420?mark=01&shop_id=6185420 | WeChat: https://u.wechat.com/ECHOr6KHTNKDohbLNo_g0I4',
    verification_status: 'Card transcription verified; 1688, Chinagoods & WeChat QR active',
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
  console.log('✅ Successfully inserted SUP-0067 into Supabase csd_suppliers!\n');

  // 6. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0067')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0067!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 67)\n`);

  // 7. Synchronize local initialSuppliers.ts for offline fallback
  console.log('--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const jsonStr = fileContent.substring(start, end + 1);
  const currentInitial = JSON.parse(jsonStr);

  const newInitialSupplier = {
    id: supplierRecord.id,
    supplierCode: supplierRecord.supplier_code,
    companyName: supplierRecord.company_name,
    chineseName: supplierRecord.company_name_cn,
    brand: supplierRecord.brand,
    category: 'Toys & Gifts',
    rawCategory: supplierRecord.raw_category,
    supplierType: supplierRecord.supplier_type,
    city: supplierRecord.city,
    province: supplierRecord.province,
    contactPerson: supplierRecord.contact_person,
    position: supplierRecord.position,
    phone: supplierRecord.phone,
    hasWhatsApp: supplierRecord.has_whatsapp,
    whatsappNumber: undefined,
    email: supplierRecord.email,
    website: supplierRecord.website,
    qqMessaging: supplierRecord.qq_messaging,
    address: supplierRecord.address,
    productRange: supplierRecord.product_range,
    productsServices: supplierRecord.products_services,
    notes: supplierRecord.notes,
    qrStatus: supplierRecord.qr_status,
    qrPayload: supplierRecord.qr_payload,
    verificationStatus: supplierRecord.verification_status,
    isFavorite: false,
    cards: {
      frontUrl: frontSignedUrl,
      backUrl: backSignedUrl,
      frontStorageKey: frontKey,
      backStorageKey: backKey,
    },
    createdAt: now,
    updatedAt: now,
  };

  const updatedInitial = [...currentInitial.filter(s => s.id !== 'SUP-0067'), newInitialSupplier];
  const newFileContent = `import { Supplier } from '../types/supplier';\n\nexport const INITIAL_SUPPLIERS: Supplier[] = ${JSON.stringify(updatedInitial, null, 2)};\n`;
  fs.writeFileSync(initialSuppliersPath, newFileContent, 'utf8');
  console.log(`✅ Synchronized initialSuppliers.ts with ${updatedInitial.length} suppliers.\n`);

  // 8. Clean up temp directories
  if (fs.existsSync('temp_qr3')) {
    fs.rmSync('temp_qr3', { recursive: true, force: true });
  }

  console.log('====================================================');
  console.log('🎉 AUTO-ENTRY FOR SUP-0067 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('❌ Auto-entry failed:', err);
  process.exit(1);
});
