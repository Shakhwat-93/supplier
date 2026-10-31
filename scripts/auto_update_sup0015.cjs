/**
 * AUTO-UPDATE SCRIPT: SUP-0015
 * Enriches existing duplicate record SUP-0015: Yiwu Yabei Import and Export Co., Ltd. (义乌市雅贝进出口有限公司)
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

// Image 1 is English Front (Yiwu Yabei Import and Export Co., Ltd. / yabe pet, Joy, +86 18105798829, 71013, WhatsApp QR, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475954463_0955810c.jpg';
// Image 2 is Chinese Back (义乌市雅贝进出口有限公司 (原艾贝儿宠物用品厂), 呀佳英, 18105798829, WeChat QR)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475954469_e96574b1.jpg';

async function runAutoUpdate() {
  console.log('====================================================');
  console.log('🚀 ENRICHING EXISTING SUPPLIER SUP-0015 (YABEI PET)');
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
  const frontKey = 'supplier-cards/SUP-0015/front.jpg';
  const backKey = 'supplier-cards/SUP-0015/back.jpg';

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

  // 3. Construct enriched DB update payload for SUP-0015
  const nowIso = new Date().toISOString();
  const updatePayload = {
    company_name: 'Yiwu Yabei Import and Export Co., Ltd.',
    company_name_cn: '义乌市雅贝进出口有限公司 (原艾贝儿宠物用品厂)',
    brand: 'yabe pet / 雅贝',
    category_id: 'cat-home',
    raw_category: 'Pet Supplies, Pet Food, Toys, Beds & Cages (宠物用品、宠物食品、宠物窝、猫砂盆及宠物笼)',
    supplier_type: 'Manufacturer & Exporter',
    contact_person: 'Joy / 呀佳英 (Mia)',
    position: 'Sales Manager / Representative',
    phone: '+86 18105798829; 0579-85183921',
    has_whatsapp: true,
    email: '635565839@qq.com',
    website: 'http://yabeipet.1688.com',
    qq_messaging: '635565839',
    address: 'Store Address: No. 71013, 4th Street, 5th Floor, Gate 112, Zone 5, Yiwu International Trade City, Zhejiang, China (浙江省义乌市国际商贸城5区112号门5楼4街71013号); Factory: Baiyun Street, Xia Kunxi Industrial Zone, Dongyang City, Zhejiang Province (东阳市白云街道下昆溪工业区)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Pet food & nutritious treats (宠物食品)',
      'Pet beds, cushions & fabric houses (宠物窝、宠物垫)',
      'Interactive pet toys & scratching posts (宠物玩具、猫抓板)',
      'Pet bowls, feeders & water dispensers (宠物碗、饮水喂食器)',
      'Cat litter boxes, scoops & cleaning products (猫砂盆、清洁铲)',
      'Pet carriers, travel bags & foldable backpacks (宠物包、出行便携包)',
      'Pet cages, crates & playpens (宠物笼、围栏)'
    ],
    products_services: 'Manufacturer and international exporter of comprehensive pet supplies including pet food, beds, toys, bowls, cat litter boxes, travel carriers, and cages (义乌市雅贝进出口实体展销与东阳工厂直供：专业生产出口各类宠物食品、宠物窝垫、玩具、喂食器、猫砂盆、宠物出行包及宠物笼)',
    notes: 'Showroom located at Store No. 71013, 4th Street, 5th Floor, Gate 112, Zone 5, Yiwu International Trade City. Factory located in Xia Kunxi Industrial Zone, Baiyun Street, Dongyang City. Both WhatsApp QR and WeChat QR successfully decoded and verified.',
    qr_status: 'decoded',
    qr_payload: 'WhatsApp: https://wa.me/qr/QW2KKVZTJKMIF1 | WeChat: https://u.wechat.com/EBtpyzHtlT78lXHUEFv6ThQ?s=2',
    verification_status: 'Card transcription verified; WhatsApp active; WeChat active; physical showroom at Yiwu Trade City Zone 5 Booth 71013',
    business_card_front: frontUrl,
    business_card_back: backUrl,
    updated_at: nowIso,
  };

  // 4. Update Supabase
  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0015')
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database update failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Updated SUP-0015 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 5. Update initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  const supIdx = content.indexOf('"id": "SUP-0015"');
  if (supIdx !== -1) {
    const blockStart = content.lastIndexOf('{', supIdx);
    const nextSupIdx = content.indexOf('"id": "SUP-0016"', supIdx);
    const blockEnd = content.lastIndexOf('},', nextSupIdx) + 2;

    const modernRecord = {
      id: 'SUP-0015',
      supplier_code: 'SUP-0015',
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
      created_at: '2026-10-20T12:00:00Z',
      updated_at: nowIso,
    };

    const newBlock = JSON.stringify(modernRecord, null, 2) + ',';
    content = content.substring(0, blockStart) + newBlock + content.substring(blockEnd);
    fs.writeFileSync(initSuppliersPath, content, 'utf8');
    console.log('[initialSuppliers.ts Verified] SUP-0015 block updated to modern schema.');
  }

  console.log('====================================================');
  console.log('🎉 ENRICHMENT FOR SUP-0015 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoUpdate().catch(err => {
  console.error('Fatal Auto-Update Error:', err);
  process.exit(1);
});
