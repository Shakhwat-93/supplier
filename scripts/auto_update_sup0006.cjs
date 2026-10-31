/**
 * AUTO-UPDATE SCRIPT: SUP-0006
 * GUANGZHOU GREAT WALL TOYS (广州长城玩具)
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

// Image 1 is Front (广州长城玩具, 邱利雄, +86-13926012500, +86-20-81061950, 一德西路390-426号国际玩具城二楼B2005-B2007, QQ: 775755847, Email, Web, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475842914_9746e304.jpg';
// Image 2 is Back (经营范围: 遥控车、飞机、船、坦克、合金车、智力积木等 欢迎国内外客户来样订做)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475842920_5b3de3f8.jpg';

async function updateSUP0006() {
  console.log('====================================================');
  console.log('🔄 EXECUTING AUTO-ENRICHMENT & UPDATE FOR SUP-0006');
  console.log('====================================================\n');

  if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
    throw new Error('Source business card images not found.');
  }

  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  // 1. Upload high-res images to Cloudflare R2
  console.log('--- PHASE 1: Uploading High-Res Card Images to R2 ---');
  const frontKey = 'supplier-cards/SUP-0006/front.jpg';
  const backKey = 'supplier-cards/SUP-0006/back.jpg';

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
    company_name: 'GUANGZHOU GREAT WALL TOYS',
    company_name_cn: '广州长城玩具',
    brand: 'GUANGZHOU GREAT WALL TOYS',
    category_id: 'cat-toys',
    raw_category: 'Remote Control (R/C) Toys, Alloy Vehicles & Educational Building Blocks (遥控玩具、合金车模及智力积木)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Qiu Lixiong (邱利雄)',
    position: 'General Manager / Owner',
    phone: '+86-13926012500; +86-20-81061950',
    has_whatsapp: false,
    email: 'gzccwj@126.com',
    website: 'http://www.gzccwj.com',
    qq_messaging: '775755847',
    address: 'Booths B2005-B2007, 2nd Floor, International Toy City (Nations Exquisite Article Plaza), No. 390-426 Yide West Road, Yuexiu District, Guangzhou, Guangdong, China (广州市越秀区一德西路390-426号国际玩具城二楼B2005-B2007档)',
    city: 'Guangzhou',
    province: 'Guangdong',
    product_range: [
      'Remote control cars & RC trucks (遥控车)',
      'RC airplanes & helicopters (遥控飞机)',
      'RC boats & warships (遥控船)',
      'RC military tanks (遥控坦克)',
      'Die-cast alloy toy cars & vehicles (合金车)',
      'Educational intelligence building blocks (智力积木)',
      'OEM sample manufacturing & custom production (来样订做)'
    ],
    products_services: 'Wholesale and sample manufacturing of remote control vehicles, airplanes, ships, tanks, die-cast alloy model cars, and educational building blocks at Guangzhou International Toy City (广州一德路国际玩具城遥控车模、航模、船模、合金车及智力积木批发，支持来样订做)',
    notes: 'Card re-scanned and verified from physical card. Corrected QQ number to 775755847. Physical showroom at Guangzhou International Toy City (Yide West Road Booths B2005-B2007). WeChat active on mobile +86-13926012500.',
    qr_status: 'visible_not_decoded',
    qr_payload: 'WeChat: +86-13926012500',
    verification_status: 'Physical card verified; physical showrooms B2005-B2007 at Guangzhou International Toy City; website active',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    updated_at: now,
  };

  const { data: dbData, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updateData)
    .eq('id', 'SUP-0006')
    .select();

  if (dbError) {
    throw new Error(`Database Update Failed: ${dbError.message}`);
  }
  console.log(`✓ Updated SUP-0006 in Supabase! Updated rows: ${dbData.length}\n`);

  // 4. Update initialSuppliers.ts
  console.log('--- PHASE 4: Updating initialSuppliers.ts ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  // Find SUP-0006 in file
  const regex = /\{\s*["'](?:id|supplierCode)["']:\s*["']SUP-0006["'][\s\S]*?\n\s*\},?/;
  const match = fileContent.match(regex);
  if (match) {
    const isTrailingComma = match[0].trim().endsWith(',');
    const merged = {
      id: 'SUP-0006',
      supplier_code: 'SUP-0006',
      ...updateData,
      is_favorite: false,
      is_demo: false,
      created_at: '2026-10-20T13:33:48.131Z',
    };
    const newJson = JSON.stringify(merged, null, 2).replace(/\n/g, '\n  ') + (isTrailingComma ? ',' : '');
    fileContent = fileContent.replace(match[0], newJson);
    fs.writeFileSync(initialSuppliersPath, fileContent, 'utf8');
    console.log('✓ Successfully enriched SUP-0006 in initialSuppliers.ts!\n');
  } else {
    console.warn('⚠️ Could not find SUP-0006 block in initialSuppliers.ts');
  }

  console.log('====================================================');
  console.log('🎉 SUCCESS: SUP-0006 ENRICHMENT FULLY COMPLETED');
  console.log('====================================================');
}

updateSUP0006().catch((err) => {
  console.error('\n❌ FATAL ERROR during auto-update execution:', err);
  process.exit(1);
});
