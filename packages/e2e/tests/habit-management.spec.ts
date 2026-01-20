import { test, expect } from '@playwright/test';

test.describe('Habit Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a new habit', async ({ page }) => {
    const habitName = `Exercise ${Date.now()}`;

    // Use QuickAddHabit to create a habit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Verify habit appears in the checklist
    await expect(page.locator(`.checklist-item:has-text("${habitName}")`)).toBeVisible();
  });

  test('should not create habit with empty name', async ({ page }) => {
    // Wait for page to load by checking quick-add is visible
    await expect(page.locator('.quick-add')).toBeVisible();

    // The submit button should be disabled when input is empty
    const submitButton = page.locator('.quick-add button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    // Try typing whitespace-only - button should still be disabled
    await page.fill('.quick-add input', '   ');
    await expect(submitButton).toBeDisabled();
  });

  test('should delete a habit', async ({ page }) => {
    const habitName = `Delete Test ${Date.now()}`;

    // First create a habit using QuickAddHabit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    // Click settings cog to open settings panel
    await habitItem.locator('.checklist-settings').click();

    // Set up dialog handler for confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Click delete button in settings panel
    await page.click('button:has-text("Delete Habit")');

    // Verify habit is removed
    await expect(habitItem).not.toBeVisible();
  });

  test('should complete a habit', async ({ page }) => {
    const habitName = `Read ${Date.now()}`;

    // Create a habit using QuickAddHabit
    await page.fill('.quick-add input', habitName);
    await page.click('.quick-add button[type="submit"]');

    // Wait for habit to appear
    const habitItem = page.locator(`.checklist-item:has-text("${habitName}")`);
    await expect(habitItem).toBeVisible();

    // Click the checkbox label to complete the habit (checkbox input is covered by .checkmark)
    await habitItem.locator('.checklist-checkbox').click();

    // Verify habit shows as completed
    await expect(page.locator(`.checklist-item--completed:has-text("${habitName}")`)).toBeVisible();
  });

  test('should display progress', async ({ page }) => {
    // Check that progress bar exists
    await expect(page.locator('.progress')).toBeVisible();

    // Check progress text shows completion format
    await expect(page.locator('.progress-text')).toBeVisible();
    await expect(page.locator('.progress-text')).toContainText(/\d+ of \d+ complete/);
  });
});
