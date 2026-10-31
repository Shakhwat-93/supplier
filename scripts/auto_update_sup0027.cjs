/**
 * AUTO-UPDATE SCRIPT: SUP-0027
 * Yijian Educational & Intelligence Toys (益健智力玩具)
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
  endpoint: 'https://' + process.env.R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucketName = process.env.R2_BUCKET_NAME || 'china-supplier-directory';

// Image 1 is Front (Logo, 益健智力玩具, 赖胜滔, 彭小姐, mobiles, Guangzhou address, WeChat QR)
const frontPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475793166_f4f4e984.jpg';
// Image 2 is Back (经营范围, bank info)
const backPath = 'C:/Users/shakh/.gemini/antigravity/brain/00d7b972-9421-4f87-b487-2cb61a1ac79a/.user_uploaded/media_1793475793255_71aca5d0.jpg';

async function updateSUP0027() {
  console.log('--- PHASE 1: Uploading high-res card images for SUP-0027 ---');
  const frontBuf = fs.readFileSync(frontPath);
  const backBuf = fs.readFileSync(backPath);

  const frontKey = 'supplier-cards/SUP-0027/front.jpg';
  const backKey = 'supplier-cards/SUP-0027/back.jpg';

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: frontKey,
    Body: frontBuf,
    ContentType: 'image/jpeg',
  }));

  await r2Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: backKey,
    Body: backBuf,
    ContentType: 'image/jpeg',
  }));

  const frontHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: frontKey }));
  const backHead = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: backKey }));
  console.log('R2 Front bytes:', frontHead.ContentLength, 'Back bytes:', backHead.ContentLength);

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

  console.log('--- PHASE 2: Updating SUP-0027 in Supabase ---');
  const now = new Date().toISOString();
  const updatePayload = {
    company_name: 'YIJIAN ZHILI TOYS (Yijian Educational & Intelligence Toys)',
    company_name_cn: '益健智力玩具',
    brand: 'YIJIAN / 益健',
    category_id: 'cat-toys',
    raw_category: 'Educational & Intelligence Toys (智力玩具、益智早教及桌面玩具)',
    supplier_type: 'Wholesaler / Distributor',
    contact_person: 'Lai Shengtao (赖胜滔); Miss Peng (彭小姐)',
    position: 'Owners / Sales Representatives',
    phone: '13602886163; 13719038900',
    has_whatsapp: false,
    address: 'Booths B1032-B1033, 1st Floor, International Toy City, No. 390 Yide West Road, Yuexiu District, Guangzhou, Guangdong, China (廣州市越秀區一德西路390號國際玩具城一樓B1032-B1033檔)',
    city: 'Guangzhou',
    province: 'Guangdong',
    product_range: [
      'Educational & intelligence toys (智力玩具)',
      'Puzzles, brainteasers & logic games (益智玩具)',
      'Early learning & development toys (早教玩具)',
      'Tabletop games & educational kits (桌面益智游戏)',
      'Yide Road wholesale toy market distribution',
    ],
    products_services: 'Wholesale distribution of educational and intelligence toys, brainteasers, developmental puzzles, and tabletop games at Guangzhou International Toy City (广州一德路国际玩具城益智早教、智力玩具及桌面游戏批发)',
    notes: 'Card re-scanned and verified from physical card. Corrected city/location to Guangzhou International Toy City on Yide West Road (Booths B1032-B1033). Corrected contact names to Lai Shengtao (赖胜滔) and Miss Peng (彭小姐). Three bank accounts on reverse (ICBC, Bank of Communications, ABC under Peng Laidi and Lai Shengtao) intentionally excluded for privacy compliance. WeChat QR decoded successfully.',
    qr_status: 'decoded',
    qr_payload: 'WeChat: https://u.wechat.com/MBQ4sqQNR24TA_qYERMuQJs',
    verification_status: 'Card transcription & high-res scan verified; WeChat active; physical booths B1032-B1033 at Guangzhou International Toy City',
    business_card_front: frontSignedUrl,
    business_card_back: backSignedUrl,
    updated_at: now,
  };

  const { error: updateErr } = await supabase
    .from('csd_suppliers')
    .update(updatePayload)
    .eq('id', 'SUP-0027');

  if (updateErr) {
    throw new Error('Supabase update failed: ' + updateErr.message);
  }
  console.log('✅ Successfully updated SUP-0027 in Supabase!');

  // Sync initialSuppliers.ts
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const fileContent = fs.readFileSync(initialSuppliersPath, 'utf8');
  const eqIdx = fileContent.indexOf('=');
  const start = fileContent.indexOf('[', eqIdx);
  const end = fileContent.lastIndexOf(']');
  const suppliersArray = JSON.parse(fileContent.substring(start, end + 1));

  const targetIdx = suppliersArray.findIndex(s => s.id === 'SUP-0027');
  if (targetIdx !== -1) {
    suppliersArray[targetIdx] = {
      ...suppliersArray[targetIdx],
      ...updatePayload,
    };
    const newTsContent =
      fileContent.substring(0, start) +
      JSON.stringify(suppliersArray, null, 2) +
      ';\n';
    fs.writeFileSync(initialSuppliersPath, newTsContent, 'utf8');
    console.log('✅ Synchronized initialSuppliers.ts with updated SUP-0027.');
  }
}

updateSUP0027().catch(err => {
  console.error('\n❌ Execution failed:', err);
  process.exit(1);
});
