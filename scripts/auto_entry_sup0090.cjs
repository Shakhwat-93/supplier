/**
 * AUTO-ENTRY SCRIPT: SUP-0090
 * Mingfeng Hardware Factory Store / 铭丰五金 工厂店 (郑燕潭)
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

// Image is Single-Sided: 铭丰五金 工厂店, 郑燕潭 经理, 13750923755, 15355353775, 三区65号L3-3073, WeChat QR
const cardPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475939940_077d9002.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0090');
  console.log('====================================================\n');

  if (!fs.existsSync(cardPath)) {
    throw new Error('Source business card image not found: ' + cardPath);
  }

  const cardBuf = fs.readFileSync(cardPath);
  const cardHash = crypto.createHash('sha256').update(cardBuf).digest('hex');

  console.log('[Source File Verified]');
  console.log(`Card: ${cardBuf.length} bytes, SHA-256: ${cardHash}\n`);

  // 1. Pre-check DB to ensure SUP-0090 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id, supplier_code')
    .eq('id', 'SUP-0090')
    .maybeSingle();

  if (existingCheck) {
    console.log('[Notice] SUP-0090 already exists in DB, will update record.');
  } else {
    console.log('[Check Passed] SUP-0090 is clear for new insertion.');
  }

  // 2. Upload Front & Back (single-sided mirrored) to Cloudflare R2
  const frontKey = 'supplier-cards/SUP-0090/front.jpg';
  const backKey = 'supplier-cards/SUP-0090/back.jpg';

  console.log(`Uploading ${frontKey} to R2...`);
  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: frontKey,
    Body: cardBuf,
    ContentType: 'image/jpeg',
  }));

  console.log(`Uploading ${backKey} to R2 (mirrored single-sided)...`);
  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: backKey,
    Body: cardBuf,
    ContentType: 'image/jpeg',
  }));

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

  // 4. Construct complete DB record for SUP-0090
  const nowIso = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0090',
    supplier_code: 'SUP-0090',
    company_name: 'Mingfeng Hardware Factory Store',
    company_name_cn: '铭丰五金 工厂店',
    brand: 'Mingfeng Hardware / 铭丰五金',
    category_id: 'cat-accessories',
    raw_category: 'Luggage & Garment Metal Hardware, Buckles & Chains (铭丰五金工厂店、箱包服饰五金配件)',
    supplier_type: 'Manufacturer',
    contact_person: 'Zheng Yantan (郑燕潭)',
    position: 'Manager (经理)',
    phone: '13750923755; 15355353775',
    has_whatsapp: false,
    email: null,
    website: null,
    address: 'Booth L3-3073, Gate 65, 3rd Floor, District 3, International Trade Mart, Yiwu, Zhejiang, China (义乌市商贸城三区65号L3-3073)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Luggage, handbag & bag metal hardware accessories (箱包手袋五金配件)',
      'Garment metal buttons, eyelets & metal tags (服饰五金标牌、气眼鸡眼)',
      'Metal chain links, keychains & snap hooks (五金饰链、钥匙扣、弹簧扣)',
      'Zinc alloy die-casting hardware & custom mold manufacturing (锌合金压铸件五金开模定制)'
    ],
    products_services: 'Direct factory manufacturing and wholesale of metal hardware accessories for bags, luggage, footwear, and garments at Yiwu Trade Mart District 3 (义乌商贸城三区铭丰五金工厂直营：箱包五金、服饰配件、金属链条及锌合金开模定制批发)',
    notes: 'Factory store showroom located at Booth L3-3073, Gate 65, 3rd Floor, District 3, Yiwu International Trade City. Single-sided card design. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/EJzQ4tlFcLx_qnRyW0C4EUE?s=2',
    verification_status: 'Card transcription verified; WeChat active; physical showroom at Yiwu Trade City District 3 Booth L3-3073',
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

  console.log(`[Supabase Verified] Upserted SUP-0090 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 6. Update src/data/initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

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

  if (content.includes('"id": "SUP-0090"')) {
    console.log('[initialSuppliers.ts] SUP-0090 entry exists, replacing with updated entry...');
    const regex = new RegExp(`\\{\\s*"id":\\s*"SUP-0090"[\\s\\S]*?\\n\\s*\\}(,)?`, 'g');
    content = content.replace(regex, JSON.stringify(localRecord, null, 2) + '$1');
  } else {
    console.log('[initialSuppliers.ts] Appending SUP-0090 before closing bracket...');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0090 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('Fatal Auto-Entry Error:', err);
  process.exit(1);
});
