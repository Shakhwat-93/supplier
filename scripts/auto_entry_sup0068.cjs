/**
 * AUTO-ENTRY SCRIPT: SUP-0068
 * Yue Jia Business Hotel (悦嘉商务宾馆)
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

// Image 1 is Front (Hotline, fax, postal code, address, logo)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475654128_685dc029.jpg';
// Image 2 is Back (Street map, location next to International Trade City)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475654137_be9e4abc.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0068');
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

  // 1. Pre-check DB to ensure SUP-0068 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0068');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0068 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0068/front.jpg';
  const backKey = 'supplier-cards/SUP-0068/back.jpg';

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
    id: 'SUP-0068',
    supplier_code: 'SUP-0068',
    company_name: 'Yue Jia Business Hotel (Yue Jia Hotel)',
    company_name_cn: '悦嘉商务宾馆',
    brand: 'YUE JIA HOTEL',
    category_id: 'cat-other',
    raw_category: 'Business Hotel & Market Accommodation (商务宾馆 / 市场商旅住宿)',
    supplier_type: 'Supplier',
    contact_person: 'Reservation Desk / 前台预订 (Hotline)',
    position: 'Reservation / Front Desk',
    phone: '0579-81582188; Fax: 0579-85559177',
    has_whatsapp: false,
    email: '',
    website: '',
    qq_messaging: '',
    address: '21 Building 1 Area Yinhai, Yiwu, Zhejiang, China (Behind Yinhai International Mansion) / 浙江省义乌市银海一区21幢(银海国际大厦后面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Business hotel accommodation',
      'Yiwu wholesale market buyer lodging',
      'Proximity to International Trade City Phase 2 & 3H',
      'Room reservation hotline service',
    ],
    products_services: 'Business hotel and accommodation for buyers and traders visiting Yiwu International Trade City (义乌国际商贸城二期、三期H区周边采购商商务宾馆住宿及订房服务)',
    notes: 'Taxi navigation card for Yue Jia Hotel in Yiwu. Provided for foreign buyers with "PLEASE TAKE ME TO" bilingual directions to Yinhai Area 1 behind Yinhai International Mansion. Map on reverse indicates walking proximity to Yiwu International Trade City Phase 2 & Phase 3 District H.',
    qr_status: 'no_qr',
    qr_payload: null,
    verification_status: 'Card transcription verified; physical taxi card in Yiwu Trade City district',
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
  console.log('✅ Successfully inserted SUP-0068 into Supabase csd_suppliers!\n');

  // 6. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0068')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0068!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 68)\n`);

  // 7. Synchronize local initialSuppliers.ts for offline fallback
  console.log('--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  // Check if SUP-0068 already exists in array
  const existingIdx = suppliersArray.findIndex((s) => s.id === 'SUP-0068');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0068 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
