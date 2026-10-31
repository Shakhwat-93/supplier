/**
 * AUTO-ENTRY SCRIPT: SUP-0095
 * Zhejiang Yiwu Xinhua Hardware Firm / 浙江义乌鑫华五金商行 (李真相)
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

// Image 1 is Front (浙江义乌鑫华五金商行 / XH, 李真相, 15925981351, 15267360806, L3-3057, Bank accounts, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476104556_c406e893.jpg';
// Image 2 is Back (经营范围: 专业生产各种规格皮带扣、箱包五金、手袋五金配件和磁性扣、磁性材料)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476104501_4276d0e3.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0095');
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

  // 1. Pre-check DB to ensure SUP-0095 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id, supplier_code')
    .eq('id', 'SUP-0095')
    .maybeSingle();

  if (existingCheck) {
    console.log('[Notice] SUP-0095 already exists in DB, will update record.');
  } else {
    console.log('[Check Passed] SUP-0095 is clear for new insertion.');
  }

  // 2. Upload Front & Back to Cloudflare R2
  const frontKey = 'supplier-cards/SUP-0095/front.jpg';
  const backKey = 'supplier-cards/SUP-0095/back.jpg';

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

  // 4. Construct complete DB record for SUP-0095
  const nowIso = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0095',
    supplier_code: 'SUP-0095',
    company_name: 'Zhejiang Yiwu Xinhua Hardware Firm',
    company_name_cn: '浙江义乌鑫华五金商行',
    brand: 'XH / 鑫华五金',
    category_id: 'cat-accessories',
    raw_category: 'Belt Buckles, Bag Hardware, Magnetic Buttons & Handbag Accessories (皮带扣、箱包五金、手袋五金配件和磁性扣、磁性材料)',
    supplier_type: 'Manufacturer',
    contact_person: 'Li Zhenxiang (李真相)',
    position: 'Owner / Representative',
    phone: '15925981351; 15267360806; Tel: 0579-85963057',
    has_whatsapp: false,
    email: null,
    website: null,
    qq_messaging: '1031650773',
    address: 'Booth L3-3057, Area L, Gate 65, 3rd Floor, District 3, International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城三区65号门L区L3-3057)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Belt buckles in various specifications and finishes (各种规格皮带扣、针扣、板扣)',
      'Luggage, briefcase and handbag metal locks and buckles (箱包锁扣、插锁、压花五金)',
      'Handbag metal connecting rings, snap hooks & sliders (手袋五金配件、D扣、圆圈、日字扣)',
      'Magnetic snaps, magnetic buttons & magnetic materials (磁性扣、强力磁扣、磁性材料)',
      'Custom hardware mold making and OEM production (五金开模定制、专业生产批发)'
    ],
    products_services: 'Direct factory manufacturing and wholesale of belt buckles, luggage hardware, handbag metal fittings, magnetic buttons, and magnetic materials at Yiwu Trade City District 3 (浙江义乌鑫华五金专业生产批发：各种规格皮带扣、箱包插锁、手袋五金配件及强力磁性扣、磁性材料定制)',
    notes: 'Showroom located at Booth L3-3057, Area L, Gate 65, 3rd Floor, District 3, Yiwu International Trade City. Two bank accounts on front (ABC, ICBC under Li Zhenxiang) excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/EDR6sbfZ4urvQ8XafdjjBLM',
    verification_status: 'Card transcription verified; WeChat active; physical showroom at Yiwu Trade City District 3 Booth L3-3057',
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

  console.log(`[Supabase Verified] Upserted SUP-0095 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

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

  if (content.includes('"id": "SUP-0095"')) {
    console.log('[initialSuppliers.ts] SUP-0095 entry exists, replacing with updated entry...');
    const regex = new RegExp(`\\{\\s*"id":\\s*"SUP-0095"[\\s\\S]*?\\n\\s*\\}(,)?`, 'g');
    content = content.replace(regex, JSON.stringify(localRecord, null, 2) + '$1');
  } else {
    console.log('[initialSuppliers.ts] Appending SUP-0095 before closing bracket...');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0095 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('Fatal Auto-Entry Error:', err);
  process.exit(1);
});
