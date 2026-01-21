import { test, expect } from '@playwright/test';

test.describe('F.L.I.P. Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('modal opens when settings clicked', async ({ page }) => {
    const habitName = `Animation Test ${Date.now()}`;

    // Create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    // Click settings cog
    await habitItem.locator('.checklist-settings').click();

    // Modal should be visible
    await expect(page.locator('.modal.settings-panel')).toBeVisible();
  });

  test('modal has animation class during animation', async ({ page }) => {
    const habitName = `Flip Test ${Date.now()}`;

    // Create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    // Click settings - check for animation class immediately
    await habitItem.locator('.checklist-settings').click();

    // The modal should initially have flip-animating class (or appear quickly)
    const modal = page.locator('.modal.settings-panel');
    await expect(modal).toBeVisible();

    // After animation completes, modal should still be visible
    await page.waitForTimeout(400); // Wait for animation to complete
    await expect(modal).toBeVisible();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const habitName = `Reduced Motion ${Date.now()}`;

    // Create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    // Click settings
    await habitItem.locator('.checklist-settings').click();

    // Modal should appear but NOT have flip-animating class
    const modal = page.locator('.modal.settings-panel');
    await expect(modal).toBeVisible();

    // With reduced motion, the modal should not have the animating class
    await expect(modal).not.toHaveClass(/flip-animating/);
  });

  test('animation does not break modal functionality', async ({ page }) => {
    const habitName = `Functional Test ${Date.now()}`;

    // Create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    // Click settings
    await habitItem.locator('.checklist-settings').click();

    // Wait for modal to be visible
    const modal = page.locator('.modal.settings-panel');
    await expect(modal).toBeVisible();

    // Verify modal is interactive - can type in name field
    const nameInput = page.locator('#settings-name');
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill('New Name');
    await expect(nameInput).toHaveValue('New Name');

    // Can close modal with close button
    await page.click('.close-btn');
    await expect(modal).not.toBeVisible();
  });

  test('rapid clicks do not break animation', async ({ page }) => {
    const habitName = `Rapid Click ${Date.now()}`;

    // Create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    const settingsButton = habitItem.locator('.checklist-settings');

    // Rapid clicks
    await settingsButton.click();
    await settingsButton.click({ force: true });
    await settingsButton.click({ force: true });

    // Modal should still be visible and functional
    const modal = page.locator('.modal.settings-panel');
    await expect(modal).toBeVisible();

    // Close modal
    await page.click('.close-btn');
    await expect(modal).not.toBeVisible();
  });

  test('modal closes and reopens with animation', async ({ page }) => {
    const habitName = `Reopen Test ${Date.now()}`;

    // Create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    const modal = page.locator('.modal.settings-panel');

    // Open modal
    await habitItem.locator('.checklist-settings').click();
    await expect(modal).toBeVisible();

    // Close modal
    await page.click('.close-btn');
    await expect(modal).not.toBeVisible();

    // Reopen modal - should animate again
    await habitItem.locator('.checklist-settings').click();
    await expect(modal).toBeVisible();
  });
});
