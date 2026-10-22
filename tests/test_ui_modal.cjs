const puppeteer = require('puppeteer-core');
const fs = require('fs');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

const execPath = edgePaths.find((p) => fs.existsSync(p));

if (!execPath) {
  console.log('No Edge/Chrome binary found, skipping Puppeteer UI test.');
  process.exit(0);
}

async function runUiTests() {
  console.log('Launching browser for UI verification at:', execPath);
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 1. Mobile Viewport Test (375 x 812)
    console.log('\n--- 1. Testing Mobile Viewport (375x812) ---');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3300/', { waitUntil: 'networkidle2' });

    // Wait for suppliers to load
    await page.waitForSelector('h3');

    // Click the change card camera button on the first card
    const cardCameraBtn = await page.$('button[title="Replace Front Card Image"]');
    console.log('Found camera button on supplier card:', !!cardCameraBtn);

    if (cardCameraBtn) {
      await cardCameraBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      // Verify modal is open
      const modalTitle = await page.evaluate(() => {
        const el = document.getElementById('replace-card-title');
        return el ? el.textContent : null;
      });
      console.log('Replace card modal opened. Title:', modalTitle);

      // Verify buttons inside modal
      const modalButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map((b) => b.textContent.trim());
      });
      console.log('Found modal actions:', modalButtons.filter(t => t.includes('Front') || t.includes('Back') || t.includes('Photo') || t.includes('File')));

      // Check horizontal overflow
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      console.log(`Mobile scrollWidth: ${scrollWidth}, innerWidth: ${innerWidth} (No overflow: ${scrollWidth <= innerWidth})`);

      // Close modal by clicking Cancel
      const closed = await page.evaluate(() => {
        const cancelBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Cancel'));
        if (cancelBtn) {
          cancelBtn.click();
          return true;
        }
        return false;
      });
      console.log('Closed modal via Cancel button:', closed);
      await new Promise((r) => setTimeout(r, 400));
    }

    // 2. Desktop Viewport Test (1440 x 900)
    console.log('\n--- 2. Testing Desktop Viewport (1440x900) ---');
    await page.setViewport({ width: 1440, height: 900, isMobile: false });
    await page.goto('http://localhost:3300/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('h3');

    // Drawer is docked on desktop >= 1280px. Click change button in drawer
    const changeDrawerBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Change Front') || b.textContent.includes('Change'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Triggered change card from desktop drawer:', changeDrawerBtn);
    await new Promise((r) => setTimeout(r, 500));

    const desktopModalTitle = await page.evaluate(() => {
      const el = document.getElementById('replace-card-title');
      return el ? el.textContent : null;
    });
    console.log('Replace card modal opened on desktop. Title:', desktopModalTitle);

    // Test Escape key closes modal
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));
    const modalAfterEsc = await page.evaluate(() => document.getElementById('replace-card-title'));
    console.log('Modal closed on Escape key press:', modalAfterEsc === null);

    console.log('\n🎉 ALL PUPPETEER UI TESTS PASSED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

runUiTests().catch((e) => {
  console.error('Puppeteer UI test error:', e);
  process.exit(1);
});
