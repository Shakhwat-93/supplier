/**
 * EXECUTE IMPORT SCRIPT — SAFE SUPPLIER DELTA IMPORT (SUP-0022 to SUP-0064)
 * china-supplier-directory
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createClient } = require('@supabase/supabase-js');

// Load environment
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucketName = process.env.R2_BUCKET_NAME || 'china-supplier-directory';

// Verified QR Decoded Payloads
const DECODED_QRS = {
  'SUP-0028': { side: 'back', type: 'wechat', payload: 'https://u.wechat.com/EEdDbzU3wDnmmYa7Mhl28PI?s=2' },
  'SUP-0031': { side: 'front', type: 'wechat', payload: 'https://u.wechat.com/ME9v6SSKQfHB8swvLVXjsek' },
  'SUP-0037': { side: 'back', type: 'whatsapp', payload: 'https://wa.me/qr/276L4PGOI7TCP1' },
  'SUP-0045': { side: 'back', type: 'wechat', payload: 'https://u.wechat.com/EKX5GiloTpkfY-wBpzQBzok' },
};

function getCategoryId(rawCategory) {
  const rc = (rawCategory || '').toLowerCase();
  if (rc.includes('toy') || rc.includes('gift') || rc.includes('vehicle') || rc.includes('block') || rc.includes('game')) {
    return 'cat-toys';
  }
  if (rc.includes('luggage') || (rc.includes('bag') && !rc.includes('hardware') && !rc.includes('accessories'))) {
    return 'cat-bags';
  }
  if (rc.includes('shoe') || rc.includes('clothing') || rc.includes('textile') || (rc.includes('garment') && !rc.includes('hardware') && !rc.includes('accessories'))) {
    return 'cat-garments';
  }
  if (rc.includes('electronic') || rc.includes('wearable') || rc.includes('digital') || rc.includes('clock') || rc.includes('solar')) {
    return 'cat-electronics';
  }
  if (rc.includes('cosmetic') || rc.includes('beauty')) {
    return 'cat-cosmetics';
  }
  if (rc.includes('pet') || rc.includes('cup') || rc.includes('drinkware') || rc.includes('home')) {
    return 'cat-home';
  }
  if (rc.includes('keychain') || rc.includes('hardware') || rc.includes('watch') || rc.includes('umbrella') || rc.includes('jewelry') || rc.includes('accessories')) {
    return 'cat-accessories';
  }
  if (rc.includes('stationery')) return 'cat-stationery';
  if (rc.includes('packaging')) return 'cat-packaging';
  if (rc.includes('machinery')) return 'cat-machinery';
  return 'cat-other';
}

function extractCityProvince(address) {
  const addr = (address || '').toLowerCase();
  if (addr.includes('yiwu') || addr.includes('义乌') || addr.includes('international trade city')) {
    return { city: 'Yiwu', province: 'Zhejiang' };
  }
  if (addr.includes('guangzhou') || addr.includes('广州')) {
    return { city: 'Guangzhou', province: 'Guangdong' };
  }
  if (addr.includes('shantou') || addr.includes('chenghai') || addr.includes('汕头') || addr.includes('澄海')) {
    return { city: 'Shantou', province: 'Guangdong' };
  }
  if (addr.includes('shenzhen') || addr.includes('深圳')) {
    return { city: 'Shenzhen', province: 'Guangdong' };
  }
  if (addr.includes('dongguan') || addr.includes('东莞')) {
    return { city: 'Dongguan', province: 'Guangdong' };
  }
  if (addr.includes('wenzhou') || addr.includes('温州')) {
    return { city: 'Wenzhou', province: 'Zhejiang' };
  }
  if (addr.includes('hangzhou') || addr.includes('杭州')) {
    return { city: 'Hangzhou', province: 'Zhejiang' };
  }
  if (addr.includes('fujian') || addr.includes('福建') || addr.includes('quanzhou') || addr.includes('jinjiang')) {
    return { city: 'Quanzhou', province: 'Fujian' };
  }
  return { city: '', province: '' };
}

async function execute() {
  console.log('====================================================');
  console.log('🚀 STARTING SAFE DELTA IMPORT (SUP-0022..SUP-0064)');
  console.log('====================================================\n');

  // 1. Verify Existing DB State
  const { data: existingSuppliers, error: countErr } = await supabase
    .from('csd_suppliers')
    .select('id, supplier_code');
  if (countErr) {
    throw new Error('Supabase pre-check failed: ' + countErr.message);
  }
  console.log(`[DB Check] Current suppliers in DB: ${existingSuppliers.length}`);
  const existingIds = new Set(existingSuppliers.map(s => s.id));
  if (!existingIds.has('SUP-0001') || !existingIds.has('SUP-0021')) {
    throw new Error('Safety assertion failed: SUP-0001 or SUP-0021 missing from database.');
  }

  // 2. Read Package Files
  const baseDir = path.resolve(__dirname, '../supplier_delta_import_20261021');
  const manifest = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/card_image_manifest.json'), 'utf8'));
  const delta = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/suppliers_delta.json'), 'utf8'));

  console.log(`[Package] Manifest entries: ${manifest.length}`);
  console.log(`[Package] Delta supplier records: ${delta.length}`);

  // Filter only working records SUP-0022..SUP-0064 (ignore duplicate review items in upload)
  const workingManifest = manifest.filter(m => {
    const num = parseInt(m.supplier_id.replace('SUP-', ''), 10);
    return num >= 22 && num <= 64;
  });
  console.log(`[Package] Working card images to upload: ${workingManifest.length} (Expected: 86)`);
  if (workingManifest.length !== 86) {
    throw new Error(`Expected 86 working card images, but found ${workingManifest.length}`);
  }

  // 3. Cloudflare R2 Upload Phase
  console.log('\n--- PHASE 1: Cloudflare R2 Upload & URL Generation ---');
  const uploadedUrls = {}; // { [supplierId]: { frontUrl, backUrl, frontKey, backKey } }

  for (let i = 0; i < workingManifest.length; i++) {
    const item = workingManifest[i];
    const localFilePath = path.join(baseDir, item.package_path);
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Missing source file: ${localFilePath}`);
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    if (hash.toLowerCase() !== item.sha256.toLowerCase()) {
      throw new Error(`SHA-256 hash mismatch for ${localFilePath}`);
    }

    const objectKey = item.r2_key; // e.g. supplier-cards/SUP-0022/front.png

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: 'image/png',
    }));

    // Verify upload with HeadObject
    const head = await r2Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }));
    if (head.ContentLength !== fileBuffer.length) {
      throw new Error(`Size mismatch after upload for ${objectKey}`);
    }

    // Generate signed URL (7 days)
    const signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      }),
      { expiresIn: 60 * 60 * 24 * 7 }
    );

    if (!uploadedUrls[item.supplier_id]) {
      uploadedUrls[item.supplier_id] = {};
    }
    if (item.side === 'front') {
      uploadedUrls[item.supplier_id].frontUrl = signedUrl;
      uploadedUrls[item.supplier_id].frontKey = objectKey;
    } else {
      uploadedUrls[item.supplier_id].backUrl = signedUrl;
      uploadedUrls[item.supplier_id].backKey = objectKey;
    }

    if ((i + 1) % 10 === 0 || i === workingManifest.length - 1) {
      console.log(`Uploaded & verified ${i + 1}/${workingManifest.length} images...`);
    }
  }

  console.log('✅ Cloudflare R2 Upload Phase Completed Successfully (86/86 verified)!');

  // 4. Supabase DB Insert Phase
  console.log('\n--- PHASE 2: Supabase Database Import ---');
  const recordsToInsert = [];

  for (const s of delta) {
    if (existingIds.has(s.id)) {
      throw new Error(`Safety halt: ${s.id} already exists in database!`);
    }

    const catId = getCategoryId(s.category);
    const { city, province } = extractCityProvince(s.address);
    const qrInfo = DECODED_QRS[s.id];

    let qrStatus = 'not_decoded';
    let qrPayload = null;
    if (qrInfo) {
      qrStatus = 'decoded';
      qrPayload = qrInfo.payload;
    }

    const allText = (s.phones + ' ' + s.messaging_ids + ' ' + s.review).toLowerCase();
    const hasWhatsApp = qrInfo?.type === 'whatsapp' || allText.includes('whatsapp') || allText.includes('wa.me');

    const productRange = (s.products || '')
      .split(';')
      .map(p => p.trim())
      .filter(Boolean);

    const cardData = uploadedUrls[s.id] || {};

    const row = {
      id: s.id,
      supplier_code: s.id,
      company_name: s.company_en,
      company_name_cn: s.company_zh || null,
      brand: s.brand || null,
      category_id: catId,
      raw_category: s.category,
      supplier_type: 'Supplier',
      contact_person: s.contacts || 'Unknown',
      position: 'Sales / Representative',
      phone: s.phones || '',
      has_whatsapp: hasWhatsApp,
      email: s.email || null,
      website: s.website || null,
      qq_messaging: s.messaging_ids || null,
      address: s.address || '',
      city: city || null,
      province: province || null,
      product_range: productRange.length > 0 ? productRange : null,
      products_services: s.products || null,
      notes: `Confidence: ${s.confidence}. ${s.review}`,
      qr_status: qrStatus,
      qr_payload: qrPayload,
      verification_status: 'Card transcription only; public verification pending',
      business_card_front: cardData.frontUrl || null,
      business_card_back: cardData.backUrl || null,
      is_favorite: false,
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    recordsToInsert.push(row);
  }

  console.log(`Prepared ${recordsToInsert.length} records for database insertion.`);

  // Insert in safe batches of 10 rows
  const BATCH_SIZE = 10;
  for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
    const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabase.from('csd_suppliers').insert(batch);
    if (insertErr) {
      throw new Error(`Database batch insert failed at index ${i}: ` + insertErr.message);
    }
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)`);
  }

  console.log('✅ Supabase Import Completed Successfully (43/43 records inserted)!');

  // 5. Verification Phase
  console.log('\n--- PHASE 3: Database & Data Integrity Verification ---');
  const { data: finalSuppliers, error: verifyErr } = await supabase
    .from('csd_suppliers')
    .select('id, company_name, business_card_front, qr_status, qr_payload');
  if (verifyErr) {
    throw new Error('Verification query failed: ' + verifyErr.message);
  }

  console.log(`Total suppliers in DB now: ${finalSuppliers.length} (Expected: 64)`);
  if (finalSuppliers.length !== 64) {
    throw new Error(`Expected 64 suppliers in DB, found ${finalSuppliers.length}`);
  }

  const finalIds = new Set(finalSuppliers.map(s => s.id));
  for (let i = 1; i <= 64; i++) {
    const expectedId = 'SUP-' + String(i).padStart(4, '0');
    if (!finalIds.has(expectedId)) {
      throw new Error(`Missing expected supplier ID in DB: ${expectedId}`);
    }
  }
  console.log('✅ Supplier ID sequence verified: SUP-0001 through SUP-0064 complete with 0 gaps!');

  // 6. Update local initialSuppliers.ts for offline synchronization
  console.log('\n--- PHASE 4: Local initialSuppliers.ts Synchronization ---');
  await syncInitialSuppliers(recordsToInsert, uploadedUrls);

  console.log('\n====================================================');
  console.log('🎉 ALL DELTA IMPORT PHASES COMPLETED WITH 100% SUCCESS');
  console.log('====================================================');
}

async function syncInitialSuppliers(newRows, uploadedUrls) {
  const initialSuppliersPath = path.resolve(__dirname, '../src/data/initialSuppliers.ts');
  const content = fs.readFileSync(initialSuppliersPath, 'utf8');

  // Extract existing INITIAL_SUPPLIERS array
  const eqIdx = content.indexOf('=');
  const start = content.indexOf('[', eqIdx);
  const end = content.lastIndexOf(']');
  const json = content.substring(start, end + 1);
  const INITIAL_SUPPLIERS = JSON.parse(json);
  console.log(`Current initialSuppliers count: ${INITIAL_SUPPLIERS.length}`);

  const CATEGORY_NAMES = {
    'cat-bags': 'Bags & Luggage',
    'cat-garments': 'Garments & Textiles',
    'cat-toys': 'Toys & Gifts',
    'cat-electronics': 'Electronics',
    'cat-packaging': 'Packaging',
    'cat-home': 'Home & Living',
    'cat-stationery': 'Stationery',
    'cat-machinery': 'Machinery',
    'cat-cosmetics': 'Cosmetics',
    'cat-accessories': 'Accessories',
    'cat-other': 'Other',
  };

  const newSuppliers = newRows.map(r => {
    const cardData = uploadedUrls[r.id] || {};
    return {
      id: r.id,
      supplierCode: r.supplier_code,
      companyName: r.company_name,
      chineseName: r.company_name_cn || undefined,
      brand: r.brand || undefined,
      category: CATEGORY_NAMES[r.category_id] || 'Other',
      rawCategory: r.raw_category || undefined,
      supplierType: r.supplier_type,
      city: r.city || '',
      province: r.province || '',
      contactPerson: r.contact_person,
      position: r.position || undefined,
      phone: r.phone,
      hasWhatsApp: r.has_whatsapp,
      whatsappNumber: r.has_whatsapp ? r.phone : undefined,
      email: r.email || '',
      website: r.website || '',
      qqMessaging: r.qq_messaging || undefined,
      address: r.address || '',
      productRange: r.product_range || [],
      productsServices: r.products_services || undefined,
      notes: r.notes || '',
      qrStatus: r.qr_status || undefined,
      qrPayload: r.qr_payload || undefined,
      verificationStatus: r.verification_status || undefined,
      isFavorite: false,
      cards: {
        frontUrl: r.business_card_front || '',
        backUrl: r.business_card_back || '',
        frontStorageKey: cardData.frontKey || `supplier-cards/${r.id}/front.png`,
        backStorageKey: cardData.backKey || `supplier-cards/${r.id}/back.png`,
      },
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  const merged = [...INITIAL_SUPPLIERS, ...newSuppliers];
  console.log(`Merged initialSuppliers total: ${merged.length}`);

  const updatedFileContent = `import { Supplier } from '../types/supplier';\n\nexport const INITIAL_SUPPLIERS: Supplier[] = ${JSON.stringify(merged, null, 2)};\n`;
  fs.writeFileSync(initialSuppliersPath, updatedFileContent, 'utf8');
  console.log('✅ initialSuppliers.ts updated successfully with 64 records!');
}

execute().catch(err => {
  console.error('\n❌ IMPORT FAILED:', err);
  process.exit(1);
});
