/**
 * Capture FLIP animation at various intervals
 * Run with: node scripts/capture-animation.js
 * Requires: npx playwright install chromium
 */

const { chromium } = require('playwright');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../.playwright-mcp');
const BASE_URL = 'http://localhost:5174/playground';

async function captureAnimation() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to playground...');
  await page.goto(BASE_URL);
  await page.waitForTimeout(500); // Let page settle

  // Initial state
  console.log('Capturing initial state...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-initial.png') });

  // === OPEN ANIMATION ===
  console.log('\n=== OPEN ANIMATION ===');

  const openIntervals = [0, 20, 50, 100, 150, 200, 300, 500];

  for (const ms of openIntervals) {
    await page.goto(BASE_URL);
    await page.waitForTimeout(300);

    await page.click('.card');
    if (ms > 0) {
      await page.waitForTimeout(ms);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, `open-${String(ms).padStart(3, '0')}ms.png`) });
    console.log(`  Captured open-${ms}ms.png`);
  }

  // === CLOSE ANIMATION ===
  console.log('\n=== CLOSE ANIMATION ===');

  const closeIntervals = [0, 20, 50, 100, 150, 200, 300, 500];

  for (const ms of closeIntervals) {
    // Reset to open state
    await page.goto(BASE_URL);
    await page.waitForTimeout(300);
    await page.click('.card');
    await page.waitForTimeout(500); // Wait for open to complete

    // Now close
    await page.click('button:has-text("Close")');
    if (ms > 0) {
      await page.waitForTimeout(ms);
    }
    await page.screenshot({ path: path.join(OUTPUT_DIR, `close-${String(ms).padStart(3, '0')}ms.png`) });
    console.log(`  Captured close-${ms}ms.png`);
  }

  await browser.close();

  console.log('\n✓ All screenshots captured in .playwright-mcp/');
  console.log('  Open: open-000ms.png through open-500ms.png');
  console.log('  Close: close-000ms.png through close-500ms.png');
}

captureAnimation().catch(console.error);
