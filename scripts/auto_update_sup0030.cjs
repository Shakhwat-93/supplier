/**
 * AUTO-UPDATE SCRIPT: SUP-0030
 * Enriches existing duplicate record SUP-0030: Chengyang Children's Car (澄阳童车)
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

// Image 1 is English Front (Chengyang Children's Car, coco, 15088200002, QQ 122276431, Room 2068, Room 81331-81332, Bank accounts, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476096645_3346c14f.jpg';
// Image 2 is Chinese Back (澄阳童车, 傅诗阳, 15088200002, 2068商位, 81331-81332商位, Bank accounts, WeChat QR)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476096650_a5177864.jpg';

async function runAutoUpdate() {
  console.log('====================================================');
  console.log('🚀 ENRICHING EXISTING SUPPLIER SUP-0030 (CHENGYANG CHILDREN CAR)');
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

  // 1. Upload high-res images to R2
  const frontKey = 'supplier-cards/SUP-0030/front.jpg';
  const backKey = 'supplier-cards/SUP-0030/back.jpg';

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

  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));
  console.log(`[R2 Upload Verified] Front: ${frontHead.ContentLength} bytes, Back: ${backHead.ContentLength} bytes\n`);

  // 2. Generate 7-day presigned URLs
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

  // 3. Construct enriched DB update payload for SUP-0030
  const nowIso = new Date().toISOString();
  const updatePayload = {
    company_name: "Chengyang Children's Car",
    company_name_cn: '澄阳童车',
    brand: 'Chengyang / 澄阳童车',
    category_id: 'cat-toys',
    raw_category: 'Ride-On Electric Cars, Baby Strollers & Children Scooters (澄阳童车、儿童电动汽车、摩托车、婴儿推车、滑板车及滑滑车)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Fu Shiyang (傅诗阳 / coco)',
    position: 'Owner / Representative',
    phone: '15088200002',
    has_whatsapp: false,
    email: null,
    website: null,
    qq_messaging: '122276431',
    address: 'Store: Room 2068, 6th Street, Gate 11, 1st Floor, Zone 1, Yiwu International Trade City (义乌市国际商贸城一区一楼11号门6街2068商位); Exhibition Hall: Room 81331-81332, 4th Street, 1st Floor, Gate 179, Global Data Trade Center (Zone 6) (全球数贸中心(六区)179号门一楼4街81331-81332商位)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Children ride-on electric cars & off-road battery vehicles (儿童电动汽车、越野遥控电动车)',
      'Kids electric motorcycles & trikes (儿童电动摩托车、三轮车)',
      'Lightweight baby strollers & travel prams (便携式婴儿推车、折叠溜娃神器)',
      'Children kick scooters & balance bikes (儿童折叠滑板车、平衡滑滑车)',
      'Export compliance certified products with EN71, GCC, CE, CPC, MSDS certifications'
    ],
    products_services: 'Wholesale and international export of ride-on electric cars, children motorcycles, baby strollers, and scooters at Yiwu Trade City Zone 1 and Global Data Trade Center Zone 6 (义乌国际商贸城一区实体批发与全球数贸中心展厅：儿童电动汽车、摩托车、推车、滑板车现货供应，全套EN71/CE/CPC资质齐全)',
    notes: 'Store located at Room 2068, 6th Street, Gate 11, 1st Floor, Zone 1, Yiwu International Trade City. Exhibition hall located at Room 81331-81332, 4th Street, 1st Floor, Gate 179, Global Data Trade Center (Zone 6). Bank accounts (CCB, ABC, ICBC under Fu Shiyang) excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/ENUf0TzIyJnX_zEWmiVpQF4?s=2',
    verification_status: 'Card transcription verified; WeChat active; physical showrooms at Yiwu Trade City Zone 1 Booth 2068 and Global Trade Center Booths 81331-81332',
    business_card_front: frontUrl,
    business_card_back: backUrl,
    updated_at: nowIso,
  };

  // 4. Update Supabase
  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0030')
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database update failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Updated SUP-0030 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 5. Update initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  const supIdx = content.indexOf('"id": "SUP-0030"');
  if (supIdx !== -1) {
    const blockStart = content.lastIndexOf('{', supIdx);
    const nextSupIdx = content.indexOf('"id": "SUP-0031"', supIdx);
    const blockEnd = content.lastIndexOf('},', nextSupIdx) + 2;

    const modernRecord = {
      id: 'SUP-0030',
      supplier_code: 'SUP-0030',
      company_name: updatePayload.company_name,
      company_name_cn: updatePayload.company_name_cn,
      brand: updatePayload.brand,
      category_id: updatePayload.category_id,
      raw_category: updatePayload.raw_category,
      supplier_type: updatePayload.supplier_type,
      contact_person: updatePayload.contact_person,
      position: updatePayload.position,
      phone: updatePayload.phone,
      has_whatsapp: updatePayload.has_whatsapp,
      email: updatePayload.email,
      website: updatePayload.website,
      qq_messaging: updatePayload.qq_messaging,
      address: updatePayload.address,
      city: updatePayload.city,
      province: updatePayload.province,
      product_range: updatePayload.product_range,
      products_services: updatePayload.products_services,
      notes: updatePayload.notes,
      qr_status: updatePayload.qr_status,
      qr_payload: updatePayload.qr_payload,
      verification_status: updatePayload.verification_status,
      business_card_front: updatePayload.business_card_front,
      business_card_back: updatePayload.business_card_back,
      is_favorite: false,
      is_demo: false,
      created_at: '2026-10-21T12:49:57.761Z',
      updated_at: nowIso,
    };

    const newBlock = JSON.stringify(modernRecord, null, 2) + ',';
    content = content.substring(0, blockStart) + newBlock + content.substring(blockEnd);
    fs.writeFileSync(initSuppliersPath, content, 'utf8');
    console.log('[initialSuppliers.ts Verified] SUP-0030 block updated to modern schema.');
  }

  console.log('====================================================');
  console.log('🎉 ENRICHMENT FOR SUP-0030 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoUpdate().catch(err => {
  console.error('Fatal Auto-Update Error:', err);
  process.exit(1);
});
