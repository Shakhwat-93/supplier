/**
 * AUTO-ENTRY SCRIPT: SUP-0078
 * Yiwu Jinxiu Belthardware Bags Accessories Shop (义乌市锦秀五金箱包配件商行)
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

// Image 1 is Front (义乌市锦秀五金箱包配件商行, 吴松主, 吴米兰, 13732436730, 13157922481, 65号门L-3084#, 仓库, QQ, Email)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475824776_f7034f88.jpg';
// Image 2 is Back (专业生产 欢迎来样订做, Kiss lock purse frames)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475824782_bfc07cce.jpg';

async function runAutoEntry() {
  console.log('====================================================');
  console.log('🚀 EXECUTING CHINA SUPPLIER AUTO-ENTRY FOR SUP-0078');
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

  // 1. Pre-check DB to ensure SUP-0078 is free
  const { data: existingCheck } = await supabase
    .from('csd_suppliers')
    .select('id')
    .eq('id', 'SUP-0078');
  if (existingCheck && existingCheck.length > 0) {
    throw new Error('Safety halt: SUP-0078 already exists in database!');
  }

  // 2. Upload to Cloudflare R2
  console.log('--- PHASE 1: Cloudflare R2 Storage Upload ---');
  const frontKey = 'supplier-cards/SUP-0078/front.jpg';
  const backKey = 'supplier-cards/SUP-0078/back.jpg';

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

  // 4. Generate 7-day presigned URLs
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

  console.log('Front Signed URL generated.');
  console.log('Back Signed URL generated.\n');

  // 5. Verify GET accessibility
  console.log('--- PHASE 3: HTTP Availability Verification ---');
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

  // 6. Insert into Supabase
  console.log('--- PHASE 4: Supabase Database Insertion ---');
  const now = new Date().toISOString();
  const supplierRecord = {
    id: 'SUP-0078',
    supplier_code: 'SUP-0078',
    company_name: 'Yiwu Jinxiu Belthardware Bags Accessories Shop',
    company_name_cn: '义乌市锦秀五金箱包配件商行',
    brand: 'JX / 锦秀',
    category_id: 'cat-accessories',
    raw_category: 'Hardware Luggage & Bag Accessories (五金箱包配件、口金包夹、金属压铸件及气眼帽钉)',
    supplier_type: 'Manufacturer',
    contact_person: 'Wu Songzhu (吴松主); Wu Milan (吴米兰)',
    position: 'Owners / Sales Representatives',
    phone: '13732436730; 13157922481; (86)0579-81570561',
    has_whatsapp: false,
    email: '81577585@163.com',
    website: null,
    qq_messaging: '1103592356',
    address: 'Booth L-3084#, 3rd Floor, Gate 65, Yiwu International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城65号门三楼L-3084#; 仓库: 江村A区15栋3号前门)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Metal kiss lock purse frames & wallet clips (口金包夹、铁包夹、票夹)',
      'Eyelets, grommets & rivets (气眼、帽钉)',
      'Shoe buckles & metal hardware fasteners (鞋扣)',
      'Cord stops & bell stoppers (吊钟)',
      'Metal die-casting parts & custom hardware fittings (金属压铸件)',
      'Custom luggage & bag hardware accessories by sample (来样订做箱包配件)'
    ],
    products_services: 'Professional manufacturing and customization of metal kiss lock purse frames, eyelets, rivets, shoe buckles, cord stops, and die-cast hardware for bags and luggage (专业生产销售票夹、气眼、帽钉、鞋扣、吊钟、铁包夹、金属压铸件及箱包五金配件，支持来样订做)',
    notes: 'Showroom located at Booth L-3084#, 3rd Floor, Gate 65, Yiwu International Trade City. Warehouse at Front Door No. 3, Building 15, Jiangcun Area A. Two bank accounts on card front (ABC, CCB under Wu Songzhu) intentionally excluded for privacy compliance. No QR code printed on card.',
    qr_status: 'none',
    qr_payload: null,
    verification_status: 'Card transcription verified; physical showroom at Yiwu Trade City District 3 Gate 65; warehouse in Jiangcun Area A',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    is_favorite: false,
    is_demo: false,
    created_at: now,
    updated_at: now,
  };

  const { data: insertData, error: insertError } = await supabase
    .from('csd_suppliers')
    .insert([supplierRecord])
    .select();

  if (insertError) {
    throw new Error(`Database Insert Failed: ${insertError.message}`);
  }
  console.log(`✓ Inserted SUP-0078 into Supabase successfully! Records returned: ${insertData.length}\n`);

  // 7. Update local initialSuppliers.ts for offline/fallback parity
  console.log('--- PHASE 5: Syncing src/data/initialSuppliers.ts ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  // Insert before the last closing `];`
  const lastBracketIndex = fileContent.lastIndexOf('];');
  if (lastBracketIndex === -1) {
    throw new Error('Could not find closing bracket in initialSuppliers.ts');
  }

  const jsonSnippet = ',\n  ' + JSON.stringify(supplierRecord, null, 2).replace(/\n/g, '\n  ') + '\n';
  const updatedContent = fileContent.slice(0, lastBracketIndex).trimEnd() + jsonSnippet + '];\n';

  fs.writeFileSync(initialSuppliersPath, updatedContent, 'utf8');
  console.log('✓ Synced initialSuppliers.ts with SUP-0078.\n');

  console.log('====================================================');
  console.log('🎉 SUCCESS: SUP-0078 ENTRY FULLY COMPLETED');
  console.log('====================================================');
}

runAutoEntry().catch((err) => {
  console.error('\n❌ FATAL ERROR during auto-entry execution:', err);
  process.exit(1);
});
