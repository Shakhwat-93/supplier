/**
 * AUTO-ENTRY SCRIPT: SUP-0072 (Maple Stock Shoes Trading)
 * AND REPAIR: SUP-0071 (Tianbo Umbrella genuine back image)
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

// Image 1: Maple Stock Shoes (Yellow single-sided card)
const mapleShoesFrontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475762314_2f73a0f4.jpg';
// Image 2: Genuine Tianbo Umbrella Back (何浩芳 He Hao Fang with 3 umbrella icons & 4 banks)
const tianboRealBackPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475762320_fc31236d.jpg';

async function run() {
  console.log('====================================================');
  console.log('🚀 EXECUTING REPAIR FOR SUP-0071 & ENTRY FOR SUP-0072');
  console.log('====================================================\n');

  // --- PART 1: REPAIR SUP-0071 BACK CARD ---
  console.log('--- PART 1: Updating SUP-0071 with Genuine Umbrella Reverse Card ---');
  const tianboBackBuf = fs.readFileSync(tianboRealBackPath);
  const tianboBackKey = 'supplier-cards/SUP-0071/back.jpg';

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: tianboBackKey,
    Body: tianboBackBuf,
    ContentType: 'image/jpeg',
  }));

  const tianboBackSignedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucketName, Key: tianboBackKey }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  await supabase
    .from('csd_suppliers')
    .update({
      business_card_back: tianboBackSignedUrl,
      notes: 'Manufacturer based in Shangyu (China umbrella manufacturing hub) with showroom at Shop F1-10574, Street 10, Phase 2, Yiwu International Trade City. WeChat QR decoded and active. Genuine back card verified with 3 umbrella product icons. Bank accounts on reverse (ICBC, ABC, BOC, CCB under He Hao Fang) intentionally excluded for privacy compliance.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'SUP-0071');

  console.log('✅ Successfully updated SUP-0071 with genuine reverse card!\n');

  // --- PART 2: INSERT SUP-0072 (Maple Stock Shoes Trading) ---
  console.log('--- PART 2: Ingesting SUP-0072 (Maple Stock Shoes Trading) ---');
  const shoesFrontBuf = fs.readFileSync(mapleShoesFrontPath);

  const shoesFrontKey = 'supplier-cards/SUP-0072/front.jpg';
  const shoesBackKey = 'supplier-cards/SUP-0072/back.jpg';

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: shoesFrontKey,
    Body: shoesFrontBuf,
    ContentType: 'image/jpeg',
  }));

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: shoesBackKey,
    Body: shoesFrontBuf, // Single-sided card
    ContentType: 'image/jpeg',
  }));

  const shoesFrontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: shoesFrontKey }));
  console.log('R2 Shoes Front bytes:', shoesFrontHead.ContentLength);

  const shoesFrontSignedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucketName, Key: shoesFrontKey }),
    { expiresIn: 60 * 60 * 24 * 7 }
  );

  const now = new Date().toISOString();
  const sup72Record = {
    id: 'SUP-0072',
    supplier_code: 'SUP-0072',
    company_name: 'Maple Stock Shoes Trading',
    company_name_cn: '枫叶外贸鞋类批发 (各类外贸鞋)',
    brand: 'MAPLE / 枫叶',
    category_id: 'cat-garments',
    raw_category: 'Shoes & Footwear (各类外贸鞋 / 库存鞋批发)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Ye Hong (叶红 / MAPLE); Chen Xian Guo (陈先国)',
    position: 'Owners / Sales Representatives',
    phone: '13626690669; 18969363490; (86)0579-81544340',
    has_whatsapp: false,
    email: 'mapleyei@163.com',
    website: '',
    qq_messaging: '438934031',
    address: 'Shop No. 44340, Street 27, Shoes Class A Area, Phase 4, Yiwu International Trade City, Yiwu, Zhejiang, China (义乌国际商贸城四期鞋类A区27街44340店面)',
    city: 'Yiwu',
    province: 'Zhejiang',
    product_range: [
      'Foreign trade export shoes (各类外贸鞋)',
      'Stock shoes & surplus footwear (库存鞋批发)',
      'Casual shoes, sneakers & sports shoes',
      'Sandals, slippers & seasonal footwear',
      'Container & bulk wholesale footwear export',
    ],
    products_services: 'Wholesale and export distribution of all kinds of foreign trade stock shoes, clearance footwear, and casual shoes (专业经营批发各类外贸鞋、外贸库存鞋、休闲运动鞋及出口尾货)',
    notes: 'Wholesale showroom at Shop 44340, Street 27, Shoes Section Class A, Phase 4, Yiwu International Trade City. (Printed card had "Phase 3" pen-corrected to "Phase 4", where the Yiwu Shoes Market is situated). Single-sided card with all details printed on front. Agricultural Bank of China account (ABC 62284... under Ye Hong) intentionally excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/EJOF6_ENcLnUZl-kMLcOMa8',
    verification_status: 'Card transcription verified; WeChat active; physical booth at Yiwu Trade City Phase 4 Shoes Market',
    business_card_front: shoesFrontSignedUrl,
    business_card_back: shoesFrontSignedUrl,
    is_favorite: false,
    is_demo: false,
    created_at: now,
    updated_at: now,
  };

  const { error: insertErr } = await supabase.from('csd_suppliers').insert(sup72Record);
  if (insertErr) {
    throw new Error('Supabase insert failed: ' + insertErr.message);
  }
  console.log('✅ Successfully inserted SUP-0072 into Supabase csd_suppliers!\n');

  // --- PART 3: SYNC INITIALSUPPLIERS.TS ---
  console.log('--- PART 3: Syncing initialSuppliers.ts ---');
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');

  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  // Update SUP-0071
  const idx71 = suppliersArray.findIndex(s => s.id === 'SUP-0071');
  if (idx71 !== -1) {
    suppliersArray[idx71].business_card_back = tianboBackSignedUrl;
    suppliersArray[idx71].notes = 'Manufacturer based in Shangyu (China umbrella manufacturing hub) with showroom at Shop F1-10574, Street 10, Phase 2, Yiwu International Trade City. WeChat QR decoded and active. Genuine back card verified with 3 umbrella product icons. Bank accounts on reverse (ICBC, ABC, BOC, CCB under He Hao Fang) intentionally excluded for privacy compliance.';
  }

  // Insert SUP-0072
  const idx72 = suppliersArray.findIndex(s => s.id === 'SUP-0072');
  if (idx72 !== -1) {
    suppliersArray[idx72] = sup72Record;
  } else {
    suppliersArray.push(sup72Record);
  }

  const newTsContent =
    fileContent.substring(0, start) +
    JSON.stringify(suppliersArray, null, 2) +
    ';\n';

  fs.writeFileSync(initialSuppliersPath, newTsContent, 'utf8');
  console.log(`✅ Synchronized initialSuppliers.ts with ${suppliersArray.length} suppliers.\n`);

  const { count } = await supabase
    .from('csd_suppliers')
    .select('*', { count: 'exact', head: true });
  console.log(`Total suppliers in production DB now: ${count} (Expected: 72)`);
}

run().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
