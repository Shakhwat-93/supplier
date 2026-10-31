/**
 * AUTO-UPDATE / ENRICH SCRIPT: SUP-0080
 * Feiyan Toys / 飞艳玩具 (Correct front & back card pairing)
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

const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475971418_f7cd4917.jpg';
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475971433_3269ab6d.jpg';

async function main() {
  console.log('--- ENRICHING SUP-0080 WITH CORRECT FEIYAN TOYS CARDS ---');

  if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
    throw new Error('Source image files do not exist!');
  }

  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  const frontHash = crypto.createHash('sha256').update(frontBuf).digest('hex');
  const backHash = crypto.createHash('sha256').update(backBuf).digest('hex');

  console.log(`Front: ${frontBuf.length} bytes, SHA-256: ${frontHash}`);
  console.log(`Back:  ${backBuf.length} bytes, SHA-256: ${backHash}\n`);

  // 1. Upload to Cloudflare R2
  const frontKey = 'supplier-cards/SUP-0080/front.jpg';
  const backKey = 'supplier-cards/SUP-0080/back.jpg';

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

  // Verify in R2
  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));

  console.log(`[R2 Head Verified] Front: ${frontHead.ContentLength} bytes, Back: ${backHead.ContentLength} bytes\n`);

  // 2. Generate Presigned URLs
  const frontSignedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucketName, Key: frontKey }),
    { expiresIn: 604800 }
  );

  const backSignedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucketName, Key: backKey }),
    { expiresIn: 604800 }
  );

  console.log(`Presigned Front: ${frontSignedUrl.substring(0, 100)}...`);
  console.log(`Presigned Back:  ${backSignedUrl.substring(0, 100)}...\n`);

  // 3. Update Supabase
  const updatePayload = {
    company_name: 'Feiyan Toys',
    company_name_cn: '飞艳玩具',
    brand: 'FY / 飞艳',
    category_id: 'cat-toys',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Feiyan Toys Representative (飞艳玩具负责人)',
    position: 'Sales / Showroom Manager',
    phone: '15805798582; 18267067058; 0579-85280251',
    has_whatsapp: false,
    address: 'Shop No. 2064, 6th Street, Area D, District 1, Yiwu International Trade City, Yiwu, Zhejiang, China (店面地址: 国际商贸城1区D区6街2064店面; 展厅地址: 义乌市金融六街168号环球大厦16楼1611室)',
    city: 'Yiwu',
    province: 'Zhejiang',
    qq_messaging: '314133286',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    product_range: [
      "Children's toys & novelty play items (儿童玩具、新奇特玩具)",
      "Small gift toys & premium party novelties (精品小礼品玩具)",
      "Wholesale toys for domestic and export markets",
      "Yiwu Market District 1 physical shop supply",
      "Global Building 16th floor exhibition hall display"
    ],
    notes: 'Dual physical locations in Yiwu: Booth 2064, Street 6, Area D, District 1, International Trade City AND Exhibition Hall at Room 1611, 16th Floor, Global Building, No. 168 Jinrong 6th Street. Dual WeChat QR codes printed on card corresponding to mobiles 15805798582 and 18267067058. Verified high-res card images uploaded.',
    verification_status: 'Card transcription verified; physical shop at Yiwu Trade City District 1 Booth 2064 & Global Building showroom Room 1611',
    updated_at: new Date().toISOString(),
  };

  const { data: dbResult, error: dbError } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0080')
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database update failed: ${dbError.message}`);
  }

  console.log(`[Supabase Verified] Updated SUP-0080 -> ${dbResult.company_name} (${dbResult.company_name_cn})\n`);

  // 4. Update src/data/initialSuppliers.ts
  const initSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  let content = fs.readFileSync(initSuppliersPath, 'utf8');

  // Find SUP-0080 block
  const supPattern = /\{\s*"id":\s*"SUP-0080"[\s\S]*?\n  \}(,)?/;
  const match = content.match(supPattern);

  if (match) {
    const existingBlock = match[0];
    const hasTrailingComma = existingBlock.endsWith(',');
    const parsed = JSON.parse(existingBlock.replace(/,\s*$/, ''));

    parsed.business_card_front = frontSignedUrl;
    parsed.business_card_back = backSignedUrl;
    parsed.phone = updatePayload.phone;
    parsed.address = updatePayload.address;
    parsed.notes = updatePayload.notes;
    parsed.updated_at = updatePayload.updated_at;

    const newBlock = JSON.stringify(parsed, null, 2).split('\n').map((line, idx) => idx === 0 ? '  ' + line : '  ' + line).join('\n') + (hasTrailingComma ? ',' : '');
    content = content.replace(existingBlock, newBlock);
    fs.writeFileSync(initSuppliersPath, content, 'utf8');
    console.log('[initialSuppliers.ts Verified] SUP-0080 card URLs updated.\n');
  } else {
    console.warn('[Warning] SUP-0080 block not found in initialSuppliers.ts via regex');
  }

  console.log('✅ SUP-0080 successfully enriched with correct Feiyan Toys cards!');
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
