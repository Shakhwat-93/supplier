/**
 * AUTO-UPDATE SCRIPT: SUP-0055
 * Enriches existing duplicate record SUP-0055: Yiwu Jingong Electronics (义乌津工电子)
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

// Image 1 is Front (义乌津工电子 / JINGONG, 吴小伟, 万娇红, 18958492657, 13857977600, Tel: 057985188768, 417801197@qq.com, G3-18768/18749/18750, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475933221_b183a38c.jpg';
// Image 2 is Back (Main produce: ODM OEM Wall Clock, Acrylic DIY 3D Clock, Quartz Movement, 3C Electric, LED Display Clocks)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475939935_7fae1754.jpg';

async function runAutoUpdate() {
  console.log('====================================================');
  console.log('🚀 ENRICHING EXISTING SUPPLIER SUP-0055 (JINGONG ELECTRONICS)');
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
  const frontKey = 'supplier-cards/SUP-0055/front.jpg';
  const backKey = 'supplier-cards/SUP-0055/back.jpg';

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

  // 3. Construct enriched DB update payload for SUP-0055
  const nowIso = new Date().toISOString();
  const updatePayload = {
    company_name: 'Yiwu Jingong Electronics Co., Ltd.',
    company_name_cn: '义乌津工电子',
    brand: 'JINGONG / 津工',
    category_id: 'cat-electronics',
    raw_category: 'LED Clocks, 3D Wall Clocks & 3C Electronic Products (LED钟表、3D立体亚克力DIY挂钟、石英钟机芯配件及3C电子产品)',
    supplier_type: 'Manufacturer',
    contact_person: 'Wu Xiaowei (吴小伟); Wan Jiaohong (万娇红)',
    position: 'Owners / General Managers',
    phone: '+86 18958492657; +86 13857977600; 0579-85188768',
    has_whatsapp: false,
    email: '417801197@qq.com',
    website: null,
    qq_messaging: '417801197',
    address: 'Shops G3-18768 / 18749 / 18750, 8th Street, 3rd Floor, Gate 46, District 2, International Trade City, Yiwu, Zhejiang, China (浙江省义乌国际商贸城2区46号门3楼8街18768.18749.18750店面); Factory: Yiting Town, Yiwu City (义乌市义亭镇工业区)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Digital LED display clocks & planet series projection clocks (LED数字显示钟、星球系列时钟)',
      'Acrylic DIY 3D wall clocks & modern decorative clocks (亚克力立体DIY艺术挂钟)',
      'Quartz clock movements, dials & needle sets (石英钟机芯及钟针配件)',
      'Consumer 3C electronics & novelty desktop clocks (3C数码电子产品、创意桌面电子钟)',
      'OEM & ODM custom clock design and production (钟表来样定制加工、贴牌生产)'
    ],
    products_services: 'Manufacturing, OEM/ODM development, and export distribution of LED clocks, 3D acrylic wall clocks, quartz movements, and 3C electronic novelties (义乌津工电子专业研发制造：ODM/OEM各类LED时钟、亚克力立体挂钟、石英机芯及3C电子产品)',
    notes: 'Showrooms located at Shops G3-18768/18749/18750, 8th Street, 3rd Floor, Gate 46, District 2, Yiwu International Trade City. Factory located in Yiting Town, Yiwu City. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/EJmPMj22vMsjB9CUtTw6EKk',
    verification_status: 'Card transcription verified; WeChat active; physical showrooms at Yiwu Trade City District 2 Booths 18768, 18749, 18750',
    business_card_front: frontUrl,
    business_card_back: backUrl,
    updated_at: nowIso,
  };

  // 4. Update Supabase
  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0055')
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database update failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Updated SUP-0055 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 5. Update initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  const supIdx = content.indexOf('"id": "SUP-0055"');
  if (supIdx !== -1) {
    const blockStart = content.lastIndexOf('{', supIdx);
    const nextSupIdx = content.indexOf('"id": "SUP-0056"', supIdx);
    const blockEnd = content.lastIndexOf('},', nextSupIdx) + 2;

    const modernRecord = {
      id: 'SUP-0055',
      supplier_code: 'SUP-0055',
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
    console.log('[initialSuppliers.ts Verified] SUP-0055 block updated to modern schema.');
  }

  console.log('====================================================');
  console.log('🎉 ENRICHMENT FOR SUP-0055 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoUpdate().catch(err => {
  console.error('Fatal Auto-Update Error:', err);
  process.exit(1);
});
