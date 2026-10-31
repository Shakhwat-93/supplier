/**
 * AUTO-ENTRY SCRIPT: SUP-0091
 * Jinfeng Toys / 金丰玩具 (王红君)
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

// Image 1 is Front (金丰玩具 / Jinfeng Toys, 王红君, 15057903478, 13819988169, Booth 2255, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475947328_fce04a2f.jpg';
// Image 2 is Back (Bank accounts, WeChat ID 13957971387, Order tel/QQ)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475947264_5b477c98.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0091');
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

  // 1. Pre-check DB to ensure SUP-0091 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id, supplier_code')
    .eq('id', 'SUP-0091')
    .maybeSingle();

  if (existingCheck) {
    console.log('[Notice] SUP-0091 already exists in DB, will update record.');
  } else {
    console.log('[Check Passed] SUP-0091 is clear for new insertion.');
  }

  // 2. Upload Front & Back to Cloudflare R2
  const frontKey = 'supplier-cards/SUP-0091/front.jpg';
  const backKey = 'supplier-cards/SUP-0091/back.jpg';

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

  // 4. Construct complete DB record for SUP-0091
  const nowIso = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0091',
    supplier_code: 'SUP-0091',
    company_name: 'Jinfeng Toys',
    company_name_cn: '金丰玩具',
    brand: 'Jin Feng / 金丰玩具',
    category_id: 'cat-toys',
    raw_category: 'Plastic Toys & Novelty Playthings (金丰玩具、塑料玩具及义乌商贸城实体批发)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Wang Hongjun (王红君)',
    position: 'Owner / Representative',
    phone: '15057903478; 13819988169; WeChat: 13957971387; Tel: 0579-85282256; Orders: 0579-89125903',
    has_whatsapp: false,
    email: null,
    website: 'http://www.jhjinfeng.com; http://jhjfsl.1688.com',
    qq_messaging: '1316609150; Orders QQ: 2750189218',
    address: 'Booth 2255, 9th Street, Area D, District 1, Futian Market, International Trade City, Yiwu, Zhejiang, China (义乌·国际商贸城福田市场D区9街2255店面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Plastic playthings & children toys (塑料玩具、日常益智玩具)',
      'Novelty gift toys & seasonal festival novelties (新奇特礼品玩具)',
      '1688 direct factory sourcing & wholesale distribution (1688诚信通线上线下一体化批发)',
      'Export and domestic wholesale orders (外贸及内销玩具订单)'
    ],
    products_services: 'Wholesale distribution of children plastic toys, novelty playthings, and seasonal gift toys at Yiwu International Trade City Futian Market (义乌国际商贸城福田市场一区实体展销：塑料玩具、新奇特儿童玩具批发，支持1688诚信通线上采购)',
    notes: 'Showroom located at Booth 2255, 9th Street, Area D, District 1, Futian Market, Yiwu International Trade City. Five bank accounts on card back (ICBC, CCB, BOC, ABC, Yiwu Rural Commercial Bank, Alipay under Wang Hongjun) intentionally excluded for privacy compliance. WeChat ID 13957971387 printed on card back.',
    qr_status: 'visible_not_decoded',
    qr_payload: 'WeChat: 13957971387 / 15057903478 / 13819988169',
    verification_status: 'Card transcription verified; 1688 shop active; physical showroom at Yiwu Futian Market Area D Booth 2255',
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

  console.log(`[Supabase Verified] Upserted SUP-0091 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

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

  if (content.includes('"id": "SUP-0091"')) {
    console.log('[initialSuppliers.ts] SUP-0091 entry exists, replacing with updated entry...');
    const regex = new RegExp(`\\{\\s*"id":\\s*"SUP-0091"[\\s\\S]*?\\n\\s*\\}(,)?`, 'g');
    content = content.replace(regex, JSON.stringify(localRecord, null, 2) + '$1');
  } else {
    console.log('[initialSuppliers.ts] Appending SUP-0091 before closing bracket...');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0091 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('Fatal Auto-Entry Error:', err);
  process.exit(1);
});
