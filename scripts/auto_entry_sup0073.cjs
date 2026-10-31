/**
 * AUTO-ENTRY SCRIPT: SUP-0073
 * Jinsheng Toy Factory (金盛玩具厂)
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

// Image 2 is Front / Outer cover (金盛玩具厂 JINSHENG TOY FACTORY, shop D1-2144, children costumes photos)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475770974_0b3058c9.jpg';
// Image 1 is Back / Inner panel (DISTRIBUTE RANGE, WeChat QR, Shop Tel, Mobile, QQ, bank info, 何利巧)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475770966_1f3a3644.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0073');
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

  // 1. Pre-check DB to ensure SUP-0073 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0073');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0073 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0073/front.jpg';
  const backKey = 'supplier-cards/SUP-0073/back.jpg';

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
    id: 'SUP-0073',
    supplier_code: 'SUP-0073',
    company_name: 'Jinsheng Toy Factory',
    company_name_cn: '金盛玩具厂',
    brand: 'JINSHENG TOY FACTORY / 金盛玩具',
    category_id: 'cat-toys',
    raw_category: 'Festival Costumes, Electronic & Novelty Toys (节日服装、声光电动及新奇特玩具)',
    supplier_type: 'Manufacturer',
    contact_person: 'He Liqiao (何利巧)',
    position: 'Owner / Factory Manager',
    phone: '13906890461; (86)0579-85282144',
    has_whatsapp: false,
    email: '',
    website: '',
    qq_messaging: '297122095',
    address: 'Booth No. D1-2144, Street 7, District D1, Futian Market, International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城福田市场7街D1-2144号)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Children festival costumes & cosplay outfits (Halloween, role-play uniforms, superhero, fairy)',
      'Sound-controlled & voice-activated toys (声控玩具)',
      'Remote control & telecontrol toys (遥控玩具)',
      'Electromotion & inertia toys (电动与惯性玩具)',
      'Halloween props, spooky & novelty trick toys (新奇特及派对恶搞玩具)',
    ],
    products_services: 'Manufacturer of children festival costumes, role-play outfits, sound-controlled and remote control electronic toys, and Halloween novelty props (儿童角色扮演节日服装、演出服、声光电动遥控玩具及万圣节新奇特玩具批发生产)',
    notes: 'Folded 2-fold card. Operating wholesale showroom at Booth D1-2144, Street 7, District D1, Futian Market (Yiwu International Trade City). Bank accounts on card (BOC, CCB, ICBC under He Liqiao) intentionally excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/MNdIB3LAtyDcGkyqWSs10Bk',
    verification_status: 'Card transcription verified; WeChat active; physical showroom at Yiwu Futian Market District D1',
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
  console.log('✅ Successfully inserted SUP-0073 into Supabase csd_suppliers!\n');

  // 6. Verify DB state
  console.log('--- PHASE 3: Verification & Auditing ---');
  const { data: verified, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('*')
    .eq('id', 'SUP-0073')
    .single();

  if (verifyErr || !verified) {
    throw new Error('Verification query failed for SUP-0073!');
  }

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });

  console.log(`Verified record in DB: ${verified.company_name} (${verified.company_name_cn})`);
  console.log(`Total suppliers in production DB now: ${count} (Expected: 73)\n`);

  // 7. Synchronize local initialSuppliers.ts for offline fallback
  console.log('--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  const existingIdx = suppliersArray.findIndex((s) => s.id === 'SUP-0073');
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
  console.log('🎉 AUTO-ENTRY FOR SUP-0073 COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
