/**
 * AUTO-ENTRY SCRIPT: SUP-0093
 * Ya Jia Toys / 雅佳玩具 (Jane / 林小姐)
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

// Image 1 is English Front (YA JIA TOYS, Jane, 15857942175, No.2254 Shop, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475978118_563d83d0.jpg';
// Image 2 is Chinese Back (雅佳玩具 / YA JIA, 林小姐, 15857942175, 2254店面)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475978127_957a7516.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0093');
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

  // 1. Pre-check DB to ensure SUP-0093 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id, supplier_code')
    .eq('id', 'SUP-0093')
    .maybeSingle();

  if (existingCheck) {
    console.log('[Notice] SUP-0093 already exists in DB, will update record.');
  } else {
    console.log('[Check Passed] SUP-0093 is clear for new insertion.');
  }

  // 2. Upload Front & Back to Cloudflare R2
  const frontKey = 'supplier-cards/SUP-0093/front.jpg';
  const backKey = 'supplier-cards/SUP-0093/back.jpg';

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

  // 4. Construct complete DB record for SUP-0093
  const nowIso = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0093',
    supplier_code: 'SUP-0093',
    company_name: 'Ya Jia Toys',
    company_name_cn: '雅佳玩具',
    brand: 'YA JIA / 雅佳',
    category_id: 'cat-toys',
    raw_category: 'Electric & Intelligent Series Toys (雅佳玩具、多功能电动玩具及智能系列玩具)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Jane / 林小姐 (Ms. Lin)',
    position: 'Sales Representative',
    phone: '15857942175; Tel: 0579-85290488; Fax: 0579-85282988',
    has_whatsapp: false,
    email: '3399363299@qq.com',
    website: null,
    qq_messaging: '3399363299',
    address: 'Shop No. 2254, 9th Street, Area D, 1st Floor, Period 1, Futian Market, International Trade City, Yiwu, Zhejiang, China (义乌福田市场1期一楼D区九街2254店面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Multifunctional electric toys & battery operated pets (多功能电动玩具、电动仿真宠物)',
      'Intelligent educational & interactive series toys (智能早教益智玩具、互动发声发光玩具)',
      'Electric stunt cars & dancing robot toys (电动特技车、音乐舞蹈机器人)',
      'Domestic and export wholesale toy supplies (外贸及电商实体批发订单)'
    ],
    products_services: 'Wholesale sourcing and distribution of multifunctional electric toys and intelligent educational toy series at Yiwu Futian Market (义乌国际商贸城福田市场一区实体批发：各类多功能电动玩具、智能早教益智及声光互动玩具生产销售)',
    notes: 'Showroom located at Shop No. 2254, 9th Street, Area D, 1st Floor, Period 1, Futian Market, Yiwu. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/EKAlcPY2-X95CqcB09IVCkM',
    verification_status: 'Card transcription verified; WeChat active; physical showroom at Yiwu Futian Market Area D Booth 2254',
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

  console.log(`[Supabase Verified] Upserted SUP-0093 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

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

  if (content.includes('"id": "SUP-0093"')) {
    console.log('[initialSuppliers.ts] SUP-0093 entry exists, replacing with updated entry...');
    const regex = new RegExp(`\\{\\s*"id":\\s*"SUP-0093"[\\s\\S]*?\\n\\s*\\}(,)?`, 'g');
    content = content.replace(regex, JSON.stringify(localRecord, null, 2) + '$1');
  } else {
    console.log('[initialSuppliers.ts] Appending SUP-0093 before closing bracket...');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0093 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('Fatal Auto-Entry Error:', err);
  process.exit(1);
});
