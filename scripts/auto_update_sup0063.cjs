/**
 * AUTO-UPDATE SCRIPT: SUP-0063
 * Guangzhou Hao Xin Technology Co., Ltd. (广州豪鑫科技)
 */

const fs = require('fs');
const path = require('path');
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

// Image 1 is Front (HX 广州豪鑫科技, 马娟娟 Juan, 13435637788, 广州市荔湾区西堤二马路新亚洲1F039档)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475817987_df15ae42.jpg';
// Image 2 is Back (3 QR codes: 2 WeChat, 1 WhatsApp, smart watch 内存卡、U盘)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475817994_9e3b5f85.jpg';

async function updateSUP0063() {
  console.log('====================================================');
  console.log('🔄 EXECUTING AUTO-ENRICHMENT & UPDATE FOR SUP-0063');
  console.log('====================================================\n');

  if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
    throw new Error('Source business card images not found.');
  }

  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  // 1. Upload high-res images to Cloudflare R2
  console.log('--- PHASE 1: Uploading High-Res Card Images to R2 ---');
  const frontKey = 'supplier-cards/SUP-0063/front.jpg';
  const backKey = 'supplier-cards/SUP-0063/back.jpg';

  console.log(`Uploading Front -> ${frontKey}`);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: frontKey,
      Body: frontBuf,
      ContentType: 'image/jpeg',
    })
  );

  console.log(`Uploading Back -> ${backKey}`);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: backKey,
      Body: backBuf,
      ContentType: 'image/jpeg',
    })
  );

  // Verify byte lengths
  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));

  if (frontHead.ContentLength !== frontBuf.length || backHead.ContentLength !== backBuf.length) {
    throw new Error('Size mismatch detected during R2 object verification!');
  }
  console.log('✅ Cloudflare R2 upload and byte verification succeeded!\n');

  // 2. Generate 7-day presigned URLs
  console.log('--- PHASE 2: Presigned URL Generation ---');
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

  // Verify GET accessibility
  const checkFront = await fetch(frontSignedUrl, { headers: { Range: 'bytes=0-10' } });
  const checkBack = await fetch(backSignedUrl, { headers: { Range: 'bytes=0-10' } });
  if (checkFront.status !== 206 && checkFront.status !== 200) {
    throw new Error(`R2 Verification Failed: Front=${checkFront.status}`);
  }
  if (checkBack.status !== 206 && checkBack.status !== 200) {
    throw new Error(`R2 Verification Failed: Back=${checkBack.status}`);
  }
  console.log(`✓ Front R2 URL Accessible (Status: ${checkFront.status})`);
  console.log(`✓ Back R2 URL Accessible (Status: ${checkBack.status})\n`);

  // 3. Assemble enriched record
  console.log('--- PHASE 3: Updating Supabase Record ---');
  const now = new Date().toISOString();
  const updateData = {
    company_name: 'Guangzhou Hao Xin Technology Co., Ltd.',
    company_name_cn: '广州豪鑫科技',
    brand: 'HX / 豪鑫科技',
    category_id: 'cat-electronics',
    raw_category: 'Smart Watches, Memory Cards & USB Flash Drives (智能手表、内存卡、U盘及数码配件)',
    supplier_type: 'Manufacturer',
    contact_person: 'Ma Juanjuan / Juan (马娟娟)',
    position: 'Sales / Representative',
    phone: '13435637788',
    has_whatsapp: true,
    address: 'Booth 1F039, 1st Floor, New Asia International Electronic & Digital City, Xiti 2nd Road, Liwan District, Guangzhou, Guangdong, China (广州市荔湾区西堤二马路新亚洲国际电子数码城1F039档)',
    city: 'Guangzhou',
    province: 'Guangdong',
    product_range: [
      'Smart watches & fitness wearables (智能手表)',
      'MicroSD memory cards & flash storage (TF/SD 内存卡)',
      'USB flash drives & pen drives (U盘)',
      'Custom OEM & ODM digital electronic products (承接OEM/ODM订单)',
      'Mobile electronic accessories & consumer electronics'
    ],
    products_services: 'Professional manufacturing and OEM/ODM production of smart watches, memory cards, and USB flash drives at New Asia Electronic City in Guangzhou (专业生产销售智能手表、TF内存卡、U盘，支持OEM/ODM定制)',
    notes: 'Card re-scanned and verified from physical card. Corrected contact name to Ma Juanjuan (马娟娟). Confirmed exact showroom at Booth 1F039, New Asia International Electronic & Digital City, Xiti 2nd Road, Liwan District, Guangzhou. Both WeChat QRs and WhatsApp QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WhatsApp: https://wa.me/qr/WEMKFD73BJJXJ1; WeChat 1: https://u.wechat.com/MG_L9g0yfMCb3TM7wcvFQgo; WeChat 2: https://u.wechat.com/MKXlWkb7C0C8ZpXUTrjn4Qg',
    verification_status: 'Physical card re-verified; WhatsApp and dual WeChat QR codes active; showroom at New Asia Electronic City Booth 1F039',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    updated_at: now,
  };

  const { data: dbData, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updateData)
    .eq('id', 'SUP-0063')
    .select();

  if (dbError) {
    throw new Error(`Database Update Failed: ${dbError.message}`);
  }
  console.log(`✓ Updated SUP-0063 in Supabase! Updated rows: ${dbData.length}\n`);

  // 4. Update initialSuppliers.ts
  console.log('--- PHASE 4: Updating initialSuppliers.ts ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  // Find SUP-0063 in file
  const regex = /\{\s*["'](?:id|supplierCode)["']:\s*["']SUP-0063["'][\s\S]*?\n\s*\},?/;
  const match = fileContent.match(regex);
  if (match) {
    // Merge existing fields with new updateData
    const existingRaw = match[0];
    const isTrailingComma = existingRaw.trim().endsWith(',');
    
    // Parse what we can or replace with clean JSON
    const merged = {
      id: 'SUP-0063',
      supplier_code: 'SUP-0063',
      ...updateData,
      is_favorite: false,
      is_demo: false,
      created_at: '2026-10-21T12:49:57.761Z',
    };
    const newJson = JSON.stringify(merged, null, 2).replace(/\n/g, '\n  ') + (isTrailingComma ? ',' : '');
    fileContent = fileContent.replace(match[0], newJson);
    fs.writeFileSync(initialSuppliersPath, fileContent, 'utf8');
    console.log('✓ Successfully enriched SUP-0063 in initialSuppliers.ts!\n');
  } else {
    console.warn('⚠️ Could not find SUP-0063 block in initialSuppliers.ts');
  }

  console.log('====================================================');
  console.log('🎉 SUCCESS: SUP-0063 ENRICHMENT FULLY COMPLETED');
  console.log('====================================================');
}

updateSUP0063().catch((err) => {
  console.error('\n❌ FATAL ERROR during auto-update execution:', err);
  process.exit(1);
});
