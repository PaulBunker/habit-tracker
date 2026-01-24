import { test, expect } from '@playwright/test';

test.describe('Emergency Bypass Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display bypass button with duration selector', async ({ page }) => {
    // Find the emergency bypass section
    const bypassControls = page.locator('.bypass-controls');
    await expect(bypassControls).toBeVisible();

    // Check duration selector exists with options
    const durationSelect = page.locator('.bypass-duration-select');
    await expect(durationSelect).toBeVisible();

    // Check default value is 30 minutes
    await expect(durationSelect).toHaveValue('30');

    // Check button is present
    const bypassButton = page.locator('.emergency-reset-button');
    await expect(bypassButton).toBeVisible();
    await expect(bypassButton).toHaveText('Emergency Bypass');
  });

  test('should activate bypass with selected duration', async ({ page }) => {
    // Select 60 minute duration
    await page.selectOption('.bypass-duration-select', '60');

    // Click bypass button
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('.emergency-reset-button');

    // Wait for bypass to activate
    await expect(page.locator('.bypass-countdown')).toBeVisible({ timeout: 5000 });

    // Check countdown is displayed
    const bypassLabel = page.locator('.bypass-label');
    await expect(bypassLabel).toHaveText('Bypass Active');

    // Check timer shows approximately 60 minutes
    const bypassTimer = page.locator('.bypass-timer');
    const timerText = await bypassTimer.textContent();
    expect(timerText).toMatch(/^59?:\d{2}$/); // Should start around 59:xx or 60:00

    // Cancel button should be visible
    const cancelButton = page.locator('.emergency-reset-button--cancel');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveText('Cancel Bypass');
  });

  test('should cancel bypass and return to normal state', async ({ page }) => {
    // First activate bypass
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('.emergency-reset-button');

    // Wait for bypass to be active
    await expect(page.locator('.bypass-countdown')).toBeVisible({ timeout: 5000 });

    // Click cancel button
    await page.click('.emergency-reset-button--cancel');

    // Wait for confirmation and state change
    await expect(page.locator('.bypass-controls')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bypass-countdown')).not.toBeVisible();
  });

  test('should persist bypass state across page reload', async ({ page }) => {
    // Activate bypass
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('.emergency-reset-button');

    // Wait for bypass to be active
    await expect(page.locator('.bypass-countdown')).toBeVisible({ timeout: 5000 });

    // Reload the page
    await page.reload();

    // Bypass should still be active after reload
    await expect(page.locator('.bypass-countdown')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.bypass-label')).toHaveText('Bypass Active');
  });

  test('should countdown timer decrement', async ({ page }) => {
    // Activate bypass
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('.emergency-reset-button');

    // Wait for bypass to be active
    await expect(page.locator('.bypass-countdown')).toBeVisible({ timeout: 5000 });

    // Get initial timer value
    const bypassTimer = page.locator('.bypass-timer');
    const initialText = await bypassTimer.textContent();
    const [initMinStr, initSecStr] = initialText!.split(':');
    const initialTotal = parseInt(initMinStr) * 60 + parseInt(initSecStr);

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Check timer has decremented
    const afterText = await bypassTimer.textContent();
    const [afterMinStr, afterSecStr] = afterText!.split(':');
    const afterTotal = parseInt(afterMinStr) * 60 + parseInt(afterSecStr);

    expect(afterTotal).toBeLessThan(initialTotal);
  });

  test('should show confirmation dialog before activating bypass', async ({ page }) => {
    let dialogShown = false;

    page.on('dialog', async (dialog) => {
      dialogShown = true;
      expect(dialog.message()).toContain('Activate emergency bypass');
      expect(dialog.message()).toContain('30 minutes');
      await dialog.dismiss();
    });

    await page.click('.emergency-reset-button');

    expect(dialogShown).toBe(true);
    // Bypass should not activate since we dismissed
    await expect(page.locator('.bypass-countdown')).not.toBeVisible();
  });

  test('should show confirmation dialog before cancelling bypass', async ({ page }) => {
    // First activate bypass
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('.emergency-reset-button');

    await expect(page.locator('.bypass-countdown')).toBeVisible({ timeout: 5000 });

    // Now test cancel confirmation
    let cancelDialogShown = false;
    page.removeAllListeners('dialog');
    page.on('dialog', async (dialog) => {
      cancelDialogShown = true;
      expect(dialog.message()).toContain('Cancel bypass');
      expect(dialog.message()).toContain('Normal blocking will resume');
      await dialog.dismiss();
    });

    await page.click('.emergency-reset-button--cancel');

    expect(cancelDialogShown).toBe(true);
    // Bypass should still be active since we dismissed
    await expect(page.locator('.bypass-countdown')).toBeVisible();
  });
});
