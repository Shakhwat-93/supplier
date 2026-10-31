/**
 * AUTO-ENTRY SCRIPT: SUP-0065
 * Guangzhou Keyhang Medical Biotechnology Co., Ltd.
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

const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475006964_ab644687.jpg';
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475006975_39654bd0.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0065');
  console.log('====================================================\n');

  // 1. Verify existence of source files
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

  // 2. Pre-check DB to ensure SUP-0065 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0065');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0065 already exists in database!');
  }

  // 3. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0065/front.jpg';
  const backKey = 'supplier-cards/SUP-0065/back.jpg';

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

  // 4. Verify R2 objects via HeadObject
  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));

  if (frontHead.ContentLength !== frontBuf.length || backHead.ContentLength !== backBuf.length) {
    throw new Error('Size mismatch detected during R2 object verification!');
  }
  console.log('✅ Cloudflare R2 upload and byte verification succeeded!\n');

  // 5. Generate Signed URLs
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

  // 6. Assemble complete database record
  console.log('--- PHASE 2: Database Record Insertion ---');
  const now = new Date().toISOString();

  const supplierRecord = {
    id: 'SUP-0065',
    supplier_code: 'SUP-0065',
    company_name: 'Guangzhou Keyhang Medical Biotechnology Co., Ltd.',
    company_name_cn: '广州淇航医疗生物科技有限公司',
    brand: 'KEYHANG',
    category_id: 'cat-machinery',
    raw_category: 'Medical & Rehabilitation Equipment',
    supplier_type: 'Supplier',
    contact_person: 'Kamilla (米悦)',
    position: 'General Manager',
    phone: '+86-16620015217; +86-19120630616',
    has_whatsapp: true,
    email: 'keyhangmedical@gmail.com',
    website: null,
    qq_messaging: null,
    address: 'Room 112, 1st Floor, Phase 1, Guolan (Kwok Lam) Medical Instruments & Equipment City, No. 650 Huawan Road, Liwan District, Guangzhou, Guangdong, China (广州市荔湾区花湾路650号国览医疗器械城一期一楼112室)',
    city: 'Guangzhou',
    province: 'Guangdong',
    product_range: [
      'Medical Consumables',
      'Aesthetic Medical Equipment',
      'Patient Monitoring Consumables',
      'Physical Therapy Equipment',
      'Rehabilitation Equipment',
      'TCM Medical Equipment',
    ],
    products_services: 'Medical Consumables; Aesthetic Medical Equipment; Patient Monitoring Consumables; Physical Therapy Equipment; Rehabilitation Equipment; TCM Medical Equipment (主营：医疗耗材、医美器械、监护耗材、物理治疗、康复及中医设备)',
    notes: 'Professional supplier of medical & rehabilitation equipment and consumables. Slogan: Keyhang Cares Everywhere (淇航守护健康同行). Verified active WhatsApp & WeChat QR codes. No bank details printed on card.',
    qr_status: 'decoded',
    qr_payload: 'WhatsApp: https://wa.me/message/LIELBIEMDPOLI1?src=qr | WeChat: https://u.wechat.com/ED42TgxhtQ5D-2bjHW4d9Gk?s=2',
    verification_status: 'Card transcription verified; direct contact and QR active',
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
  console.log('✅ Successfully inserted SUP-0065 into Supabase csd_suppliers!\n');

  // 7. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0065')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0065!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 65)\n`);

  // 8. Synchronize local initialSuppliers.ts for offline fallback
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
    category: 'Machinery',
    rawCategory: supplierRecord.raw_category,
    supplierType: supplierRecord.supplier_type,
    city: supplierRecord.city,
    province: supplierRecord.province,
    contactPerson: supplierRecord.contact_person,
    position: supplierRecord.position,
    phone: supplierRecord.phone,
    hasWhatsApp: supplierRecord.has_whatsapp,
    whatsappNumber: '+86-16620015217',
    email: supplierRecord.email,
    website: '',
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

  const updatedInitial = [...currentInitial.filter(s => s.id !== 'SUP-0065'), newInitialSupplier];
  const newFileContent = `import { Supplier } from '../types/supplier';\n\nexport const INITIAL_SUPPLIERS: Supplier[] = ${JSON.stringify(updatedInitial, null, 2)};\n`;
  fs.writeFileSync(initialSuppliersPath, newFileContent, 'utf8');
  console.log(`✅ Synchronized initialSuppliers.ts with ${updatedInitial.length} suppliers.\n`);

  // 9. Clean up temp directory
  if (fs.existsSync('temp_qr')) {
    fs.rmSync('temp_qr', { recursive: true, force: true });
  }

  console.log('====================================================');
  console.log('🎉 AUTO-ENTRY FOR SUP-0065 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch(err => {
  console.error('❌ Auto-entry failed:', err);
  process.exit(1);
});
