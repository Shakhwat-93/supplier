/**
 * AUTOMATED INTEGRATION & ACCEPTANCE TESTS
 * Business Card Replacement Feature
 */

const http = require('http');
const { Buffer } = require('buffer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1x1 valid PNG buffer
const VALID_1PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// 1x1 valid JPEG buffer
const VALID_1PX_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

// Valid WebP buffer (RIFF....WEBPVP8X...)
const VALID_WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1e, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x4c, 0x0a, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
  0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Malicious / Invalid Payloads
const SVG_PAYLOAD = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const HTML_PAYLOAD = Buffer.from('<!DOCTYPE html><html><body><h1>Fake Card</h1></body></html>');
const EXE_PAYLOAD = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);

function postApi(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3300,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING CARD REPLACEMENT INTEGRATION TEST SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const ADMIN_HEADERS = {
    'Authorization': 'Bearer token-user-001-admin',
    'X-User-Role': 'admin',
    'X-User-Email': 'admin@chinasuppliers.io',
  };

  const BUYER_HEADERS = {
    'Authorization': 'Bearer token-user-002-buyer',
    'X-User-Role': 'buyer',
    'X-User-Email': 'buyer@chinasuppliers.io',
  };

  // --- TEST GROUP 1: SECURITY & AUTHORIZATION ---
  console.log('\n--- 1. SECURITY & AUTHORIZATION ENFORCEMENT ---');

  // Test 1.1: Reject request with no auth headers
  const unauthRes = await postApi('/api/supplier/replace-card', {
    supplierId: 'SUP-0064',
    side: 'front',
    base64Data: VALID_1PX_PNG.toString('base64'),
  });
  assert(unauthRes.status === 403, 'Reject unauthorized request with 403 Forbidden');

  // Test 1.2: Reject non-admin role (e.g. buyer)
  const buyerRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'front',
      base64Data: VALID_1PX_PNG.toString('base64'),
    },
    BUYER_HEADERS
  );
  assert(buyerRes.status === 403, 'Reject non-admin (buyer role) with 403 Forbidden');

  // --- TEST GROUP 2: INPUT VALIDATION & MAGIC BYTES ---
  console.log('\n--- 2. INPUT VALIDATION & MAGIC BYTES FILTERING ---');

  // Test 2.1: Invalid supplier ID format (path traversal attempt)
  const pathTravRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: '../../../etc/passwd',
      side: 'front',
      base64Data: VALID_1PX_PNG.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(pathTravRes.status === 400, 'Reject path traversal supplierId with 400 Bad Request');

  // Test 2.2: Non-existent supplier ID
  const notFoundRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-9999',
      side: 'front',
      base64Data: VALID_1PX_PNG.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(notFoundRes.status === 404, 'Return 404 for non-existent supplier ID');

  // Test 2.3: Invalid card side (e.g. 'top')
  const invalidSideRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'top',
      base64Data: VALID_1PX_PNG.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(invalidSideRes.status === 400, 'Reject invalid side parameter with 400 Bad Request');

  // Test 2.4: Reject SVG file
  const svgRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'front',
      base64Data: SVG_PAYLOAD.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(svgRes.status === 400, 'Reject SVG upload via magic bytes detection with 400 Bad Request');

  // Test 2.5: Reject HTML file
  const htmlRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'front',
      base64Data: HTML_PAYLOAD.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(htmlRes.status === 400, 'Reject HTML upload via magic bytes detection with 400 Bad Request');

  // Test 2.6: Reject Executable file
  const exeRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'front',
      base64Data: EXE_PAYLOAD.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(exeRes.status === 400, 'Reject Executable upload with 400 Bad Request');

  // Test 2.7: Reject Oversized file (> 8MB)
  const oversizedBuf = Buffer.alloc(8.5 * 1024 * 1024);
  oversizedBuf.set(VALID_1PX_PNG, 0); // valid header but > 8MB
  const oversizedRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'front',
      base64Data: oversizedBuf.toString('base64'),
    },
    ADMIN_HEADERS
  );
  assert(oversizedRes.status === 400, 'Reject oversized file (>8MB) with 400 Bad Request');

  // --- TEST GROUP 3: HAPPY PATH REPLACEMENT & TARGET ISOLATION ---
  console.log('\n--- 3. CARD REPLACEMENT & TARGET ISOLATION ---');

  // Fetch initial state of Supplier A (SUP-0064) and Supplier B (SUP-0063)
  const { data: initialSup64 } = await supabase.from('csd_suppliers').select('*').eq('id', 'SUP-0064').single();
  const { data: initialSup63 } = await supabase.from('csd_suppliers').select('*').eq('id', 'SUP-0063').single();

  const originalFront64 = initialSup64.business_card_front;
  const originalBack64 = initialSup64.business_card_back;

  // Step 3.1: Replace Supplier A (SUP-0064) FRONT card with valid PNG
  const replaceFrontRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'front',
      base64Data: VALID_1PX_PNG.toString('base64'),
      filename: 'new_front_card.png',
    },
    ADMIN_HEADERS
  );
  assert(replaceFrontRes.status === 200, 'HTTP 200 returned for valid front card replacement');
  assert(replaceFrontRes.data.success === true, 'Success flag returned true');
  assert(replaceFrontRes.data.storageKey.startsWith('supplier-cards/SUP-0064/front/'), 'R2 key matches supplier-cards/SUP-0064/front/...');

  // Query Supabase directly to verify isolation
  const { data: afterFrontSup64 } = await supabase.from('csd_suppliers').select('*').eq('id', 'SUP-0064').single();
  const { data: afterFrontSup63 } = await supabase.from('csd_suppliers').select('*').eq('id', 'SUP-0063').single();

  assert(
    afterFrontSup64.business_card_front !== originalFront64 &&
    afterFrontSup64.business_card_front.includes('supplier-cards/SUP-0064/front/'),
    "Supplier A's FRONT image was successfully updated with new R2 URL"
  );
  assert(
    afterFrontSup64.business_card_back === originalBack64,
    "Supplier A's BACK image remained STRICTLY UNCHANGED"
  );
  assert(
    afterFrontSup63.business_card_front === initialSup63.business_card_front &&
    afterFrontSup63.business_card_back === initialSup63.business_card_back,
    "Supplier B's (SUP-0063) front and back images remained STRICTLY UNCHANGED"
  );

  // Step 3.2: Replace Supplier A (SUP-0064) BACK card with valid JPEG
  const replaceBackRes = await postApi(
    '/api/supplier/replace-card',
    {
      supplierId: 'SUP-0064',
      side: 'back',
      base64Data: VALID_1PX_JPEG.toString('base64'),
      filename: 'new_back_card.jpg',
    },
    ADMIN_HEADERS
  );
  assert(replaceBackRes.status === 200, 'HTTP 200 returned for valid back card replacement');

  const { data: afterBackSup64 } = await supabase.from('csd_suppliers').select('*').eq('id', 'SUP-0064').single();
  assert(
    afterBackSup64.business_card_back !== originalBack64 &&
    afterBackSup64.business_card_back.includes('supplier-cards/SUP-0064/back/'),
    "Supplier A's BACK image was successfully updated"
  );
  assert(
    afterBackSup64.business_card_front === afterFrontSup64.business_card_front,
    "Supplier A's newly updated FRONT image remained preserved when BACK was changed"
  );

  // Step 3.3: Persistence verification (fetch clean row from database)
  const { data: persistedRow } = await supabase.from('csd_suppliers').select('*').eq('id', 'SUP-0064').single();
  assert(
    persistedRow.business_card_front === afterBackSup64.business_card_front &&
    persistedRow.business_card_back === afterBackSup64.business_card_back,
    'Changes persist in Supabase across independent sessions/queries'
  );

  // Cleanup: Restore SUP-0064 to its initial values to keep test idempotent
  await supabase.from('csd_suppliers').update({
    business_card_front: originalFront64,
    business_card_back: originalBack64,
    updated_at: initialSup64.updated_at,
  }).eq('id', 'SUP-0064');
  console.log('\n[Cleanup] Restored SUP-0064 to initial card URLs.');

  console.log('\n===========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test run error:', e);
  process.exit(1);
});
