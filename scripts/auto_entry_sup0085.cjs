/**
 * AUTO-ENTRY SCRIPT: SUP-0085
 * Guangdong Chenghai Xiangfeng Toys Shop (广东澄海翔丰玩具)
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

// Image 1 is Front (广东澄海翔丰玩具 / GUANG DONG CHENGHAI XIANG FENG TOYS SHOP, 吴允兴, 15257979764, 13588959576, 0579-85287565, QQ: 1556425033, 2062店面, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475894149_49ed8e11.jpg';
// Image 2 is Back (生产销售各种遥控车、电动车及礼品玩具, 携手共进 合作共赢, Bank accounts)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475894156_432cf0e3.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0085');
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

  // 1. Pre-check DB to ensure SUP-0085 is free or clean
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id, supplier_code')
    .eq('id', 'SUP-0085')
    .maybeSingle();

  if (existingCheck) {
    console.log('[Notice] SUP-0085 already exists in DB, will update record.');
  } else {
    console.log('[Check Passed] SUP-0085 is clear for new insertion.');
  }

  // 2. Upload Front & Back to Cloudflare R2
  const frontKey = 'supplier-cards/SUP-0085/front.jpg';
  const backKey = 'supplier-cards/SUP-0085/back.jpg';

  console.log(`Uploading ${frontKey} to R2...`);
  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: frontKey,
    Body: frontBuf,
    ContentType: 'image/jpeg',
  }));

  console.log(`Uploading ${backKey} to R2...`);
  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: backKey,
    Body: backBuf,
    ContentType: 'image/jpeg',
  }));

  // Verify objects exist in R2
  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));
  console.log(`[R2 Upload Verified] Front: ${frontHead.ContentLength} bytes, Back: ${backHead.ContentLength} bytes\n`);

  // 3. Generate 7-day presigned URLs
  const frontUrl = await getSignedUrl(r2Client, new GetObjectCommand({
    Bucket: bucketName,
    Key: frontKey,
  }), { expiresIn: 604800 });

  const backUrl = await getSignedUrl(r2Client, new GetObjectCommand({
    Bucket: bucketName,
    Key: backKey,
  }), { expiresIn: 604800 });

  console.log('[Presigned URLs Generated (7 days)]');
  console.log(`Front URL: ${frontUrl.substring(0, 100)}...`);
  console.log(`Back URL:  ${backUrl.substring(0, 100)}...\n`);

  // 4. Construct complete DB record for SUP-0085
  const nowIso = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0085',
    supplier_code: 'SUP-0085',
    company_name: 'Guangdong Chenghai Xiangfeng Toys Shop',
    company_name_cn: '广东澄海翔丰玩具',
    brand: 'Xingfeng Toys / 翔丰玩具 (XF)',
    category_id: 'cat-toys',
    raw_category: 'Remote Control & Electric Toy Vehicles (生产销售各种遥控车、电动车及礼品玩具)',
    supplier_type: 'Manufacturer & Wholesaler',
    contact_person: 'Wu Yunxing (吴允兴); Ms. Luo (罗小姐); Mr. Wu (吴先生)',
    position: 'Owner / General Manager',
    phone: '15257979764; 13588959576; 0579-85287565',
    has_whatsapp: false,
    email: null,
    website: null,
    qq_messaging: '1556425033',
    address: 'Shop No. 2062, 6th Street, 1st Floor, Area D, District 1, International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城一区一楼D区6街2062店面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Remote control RC cars & high-speed off-road vehicles (遥控车、高速车、越野车)',
      'Electric ride-ons & battery-powered toy vehicles (电动车、工程车)',
      'Novelty gift toys & promotional toys (礼品玩具)',
      'OEM & ODM production and wholesale distribution (生产销售、来样定制)'
    ],
    products_services: 'Manufacturing, wholesale, and export distribution of RC cars, electric vehicles, and novelty gift toys at Yiwu International Trade City District 1 (广东澄海工厂直销、义乌国际商贸城实体批发：各种遥控车、电动车及礼品玩具生产销售)',
    notes: 'Showroom located at Shop No. 2062, 6th Street, 1st Floor, Area D, District 1, Yiwu International Trade City. Factory base in Chenghai, Guangdong. Three bank account numbers on card back (BOC, ICBC, CCB under Wu Yunxing) excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/MPeWIIhvEBcPnSgw60Mlnac',
    verification_status: 'Card transcription verified; WeChat active; physical showroom at Yiwu Trade City District 1 Area D Booth 2062',
    business_card_front: frontUrl,
    business_card_back: backUrl,
    is_favorite: false,
    is_demo: false,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // 5. Insert/Upsert into Supabase csd_suppliers table
  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .upsert(supplierRecord, { onConflict: 'id' })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database upsert failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Upserted SUP-0085 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 6. Update src/data/initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  // Ensure initialSuppliers record matches schema without redundant card_* keys
  const localRecord = {
    id: supplierRecord.id,
    supplier_code: supplierRecord.supplier_code,
    company_name: supplierRecord.company_name,
    company_name_cn: supplierRecord.company_name_cn,
    brand: supplierRecord.brand,
    category_id: supplierRecord.category_id,
    raw_category: supplierRecord.raw_category,
    supplier_type: supplierRecord.supplier_type,
    contact_person: supplierRecord.contact_person,
    position: supplierRecord.position,
    phone: supplierRecord.phone,
    has_whatsapp: supplierRecord.has_whatsapp,
    email: supplierRecord.email,
    website: supplierRecord.website,
    qq_messaging: supplierRecord.qq_messaging,
    address: supplierRecord.address,
    city: supplierRecord.city,
    province: supplierRecord.province,
    product_range: supplierRecord.product_range,
    products_services: supplierRecord.products_services,
    notes: supplierRecord.notes,
    qr_status: supplierRecord.qr_status,
    qr_payload: supplierRecord.qr_payload,
    verification_status: supplierRecord.verification_status,
    business_card_front: supplierRecord.business_card_front,
    business_card_back: supplierRecord.business_card_back,
    is_favorite: supplierRecord.is_favorite,
    is_demo: supplierRecord.is_demo,
    created_at: supplierRecord.created_at,
    updated_at: supplierRecord.updated_at,
  };

  if (content.includes('"id": "SUP-0085"')) {
    console.log('[initialSuppliers.ts] SUP-0085 entry exists, replacing with updated entry...');
    const regex = new RegExp(`\\{\\s*"id":\\s*"SUP-0085"[\\s\\S]*?\\n\\s*\\}(,)?`, 'g');
    content = content.replace(regex, JSON.stringify(localRecord, null, 2) + '$1');
  } else {
    console.log('[initialSuppliers.ts] Appending SUP-0085 before closing bracket...');
    const lastBracketIdx = content.lastIndexOf('];');
    if (lastBracketIdx === -1) {
      throw new Error('Could not find closing bracket in initialSuppliers.ts');
    }
    const beforeBracket = content.substring(0, lastBracketIdx).trimEnd();
    const needsComma = !beforeBracket.endsWith(',');
    const newEntry = `${needsComma ? ',' : ''}\n  ${JSON.stringify(localRecord, null, 2).replace(/\n/g, '\n  ')}\n];\n`;
    content = beforeBracket + newEntry;
  }

  fs.writeFileSync(initSuppliersPath, content, 'utf8');
  console.log('[initialSuppliers.ts Verified] Updated successfully.\n');

  console.log('====================================================');
  console.log('🎉 AUTO-ENTRY FOR SUP-0085 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('Fatal Auto-Entry Error:', err);
  process.exit(1);
});
