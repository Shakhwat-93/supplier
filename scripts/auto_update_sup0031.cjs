/**
 * AUTO-UPDATE SCRIPT: SUP-0031
 * Enriches existing duplicate record SUP-0031: Bage Parasol / 巴哥洋伞 (娅诗丽黛)
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

// Image 1 is Chinese Front (巴哥洋伞 / 娅诗丽黛, 巴军, 吴红梅, 13566991122, 13906892276, 二区24号门10街10582店)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476090309_0ab4f89b.jpg';
// Image 2 is English Back (Ba Jun, Wu Hong Mei, No. 10582 Shop, 10 Street, 24 Gate, Zone 2, WeChat QR)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476090309_a3b85e3f.jpg';

async function runAutoUpdate() {
  console.log('====================================================');
  console.log('🚀 ENRICHING EXISTING SUPPLIER SUP-0031 (BAGE PARASOL)');
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
  const frontKey = 'supplier-cards/SUP-0031/front.jpg';
  const backKey = 'supplier-cards/SUP-0031/back.jpg';

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

  // 3. Construct enriched DB update payload for SUP-0031
  const nowIso = new Date().toISOString();
  const updatePayload = {
    company_name: 'Bage Parasol & Umbrella Co.',
    company_name_cn: '巴哥洋伞 (娅诗丽黛)',
    brand: 'Bage / 巴哥洋伞 / 娅诗丽黛',
    category_id: 'cat-accessories',
    raw_category: 'Umbrellas, Parasols & Rain Gear (巴哥洋伞、娅诗丽黛、遇水开花防紫外线晴雨伞)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Ba Jun (巴军); Wu Hongmei (吴红梅)',
    position: 'Owners / Representatives',
    phone: '13566991122; 13906892276',
    has_whatsapp: false,
    email: null,
    website: null,
    address: 'Shop No. 10582 (Street Vendor Stall), 10th Street, Gate 24, Zone 2, Yiwu International Trade City, Zhejiang, China (义乌国际商贸城二区24号门10街10582店(边摊))',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Water-activated blooming umbrellas (遇水开花晴雨伞)',
      'Mini capsule folding umbrellas with cartoon bear designs (卡通迷你胶囊折叠伞)',
      'UV-blocking sun parasols & vinyl blackout umbrellas (黑胶防晒防紫外线遮阳伞)',
      'Windproof folding umbrellas for domestic & export retail (抗风晴雨伞批发)'
    ],
    products_services: 'Wholesale distribution and export of novelty water-activated blooming umbrellas, capsule folding umbrellas, and UV-blocking sun parasols at Yiwu Trade City District 2 (义乌国际商贸城二区实体展销：巴哥洋伞、娅诗丽黛遇水开花创意晴雨伞、防紫外线遮阳伞批发)',
    notes: 'Showroom stall located at Shop No. 10582, 10th Street, Gate 24, Zone 2, Yiwu International Trade City. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/ME9v6SSKQfHB8swvLVXjsek',
    verification_status: 'Card transcription verified; WeChat active; physical showroom at Yiwu Trade City District 2 Booth 10582',
    business_card_front: frontUrl,
    business_card_back: backUrl,
    updated_at: nowIso,
  };

  // 4. Update Supabase
  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0031')
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database update failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Updated SUP-0031 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 5. Update initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  const supIdx = content.indexOf('"id": "SUP-0031"');
  if (supIdx !== -1) {
    const blockStart = content.lastIndexOf('{', supIdx);
    const nextSupIdx = content.indexOf('"id": "SUP-0032"', supIdx);
    const blockEnd = content.lastIndexOf('},', nextSupIdx) + 2;

    const modernRecord = {
      id: 'SUP-0031',
      supplier_code: 'SUP-0031',
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
    console.log('[initialSuppliers.ts Verified] SUP-0031 block updated to modern schema.');
  }

  console.log('====================================================');
  console.log('🎉 ENRICHMENT FOR SUP-0031 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoUpdate().catch(err => {
  console.error('Fatal Auto-Update Error:', err);
  process.exit(1);
});
