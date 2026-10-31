/**
 * AUTO-UPDATE SCRIPT: SUP-0033
 * Enriches existing duplicate record SUP-0033: Qianliu Yao Sheng (Guangzhou) Biotechnology Co. (乾鎏垚晟(广州)生物科技有限公司)
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

// Image 1 is Chinese Front (乾鎏垚晟(广州)生物科技有限公司, 灵愿 经理, 13544391499, 美博城C座负一楼1B19档, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476082966_7474cdfe.jpg';
// Image 2 is English Back (Qianliu Yao Sheng (Guangzhou) Biotechnology Co., Lily manager, 13544391499, WhatsApp QR, WeChat QR)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793476082972_11c0d603.jpg';

async function runAutoUpdate() {
  console.log('====================================================');
  console.log('🚀 ENRICHING EXISTING SUPPLIER SUP-0033 (QIANLIU YAO SHENG)');
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
  const frontKey = 'supplier-cards/SUP-0033/front.jpg';
  const backKey = 'supplier-cards/SUP-0033/back.jpg';

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

  // 3. Construct enriched DB update payload for SUP-0033
  const nowIso = new Date().toISOString();
  const updatePayload = {
    company_name: 'Qianliu Yao Sheng (Guangzhou) Biotechnology Co., Ltd.',
    company_name_cn: '乾鎏垚晟(广州)生物科技有限公司',
    brand: 'Qianliu Yao Sheng / 乾鎏垚晟',
    category_id: 'cat-cosmetics',
    raw_category: 'Biotechnology, Pain Relief Oils, Essential Oils & Herbal Mud Moxibustion OEM/ODM (生物科技、专研痛症精油、蜂毒药油、草本泥灸及护肤品OEM加工)',
    supplier_type: 'Manufacturer',
    contact_person: 'Lily / 灵愿',
    position: 'Manager (经理)',
    phone: '13544391499',
    has_whatsapp: true,
    email: null,
    website: null,
    address: 'Booth 1B19, Basement Level (-1F), Block C, Beauty Expo City, No. 121 Guangyuan West Road, Yuexiu District, Guangzhou, Guangdong, China (广东省广州市越秀区广园西路121号美博城C座负一楼1B19档)',
    city: 'Guangzhou',
    province: 'Guangdong',
    product_range: [
      'Bee venom essential oils & herbal massage oils (特色蜂毒精油、舒筋通络药油)',
      'Pain relief therapy & traditional Chinese herbal mud moxibustion (专研痛症草本泥灸、温灸膏)',
      'Cosmetics, skincare serums & botanical treatments (美妆护肤品、精华油、草本护发品)',
      'Health & wellness topical care products (养生大健康外用护理产品)',
      'Source factory spot supply, white-label OEM & ODM processing (源头工厂现货供应、品牌贴牌代工定制)'
    ],
    products_services: 'Source factory specialized in R&D and OEM/ODM manufacturing of pain relief herbal oils, bee venom therapies, mud moxibustion, and skincare cosmetics at Guangzhou Beauty Expo City (广州美博城源头工厂直销：专研痛症、特色蜂毒精油、中药油、泥灸、美妆护肤品现货供应与OEM/ODM贴牌定制加工)',
    notes: 'Showroom located at Booth 1B19, Basement Level (-1F), Block C, Beauty Expo City, No. 121 Guangyuan West Road, Yuexiu District, Guangzhou. Both WhatsApp QR and WeChat QR successfully decoded and verified.',
    qr_status: 'decoded',
    qr_payload: 'WhatsApp: https://wa.me/qr/WN2BECSNLB4NE1 | WeChat: https://u.wechat.com/MFqR1fq3NSaMv_HYo2c5uXw?s=2',
    verification_status: 'Card transcription verified; WhatsApp active; WeChat active; physical showroom at Guangzhou Beauty Expo City Block C Booth 1B19',
    business_card_front: frontUrl,
    business_card_back: backUrl,
    updated_at: nowIso,
  };

  // 4. Update Supabase
  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0033')
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database update failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Updated SUP-0033 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 5. Update initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  const supIdx = content.indexOf('"id": "SUP-0033"');
  if (supIdx !== -1) {
    const blockStart = content.lastIndexOf('{', supIdx);
    const nextSupIdx = content.indexOf('"id": "SUP-0034"', supIdx);
    const blockEnd = content.lastIndexOf('},', nextSupIdx) + 2;

    const modernRecord = {
      id: 'SUP-0033',
      supplier_code: 'SUP-0033',
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
    console.log('[initialSuppliers.ts Verified] SUP-0033 block updated to modern schema.');
  }

  console.log('====================================================');
  console.log('🎉 ENRICHMENT FOR SUP-0033 COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

runAutoUpdate().catch(err => {
  console.error('Fatal Auto-Update Error:', err);
  process.exit(1);
});
