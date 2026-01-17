import { test, expect } from '@playwright/test';

test.describe('Habit Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should create a new habit', async ({ page }) => {
    // Click create habit button
    await page.click('button:has-text("Create New Habit")');

    // Fill in the form
    await page.fill('input#name', 'Morning Exercise');
    await page.fill('textarea#description', 'Do at least 30 minutes of exercise');
    await page.fill('input#deadline', '09:00');

    // Add blocked websites
    await page.fill('input#website', 'reddit.com');
    await page.click('button:has-text("Add")');
    await page.fill('input#website', 'twitter.com');
    await page.click('button:has-text("Add")');

    // Submit the form
    await page.click('button:has-text("Create Habit")');

    // Verify habit appears in the list
    await expect(page.locator('.habit-card:has-text("Morning Exercise")')).toBeVisible();
    await expect(page.locator('.deadline:has-text("09:00")')).toBeVisible();
  });

  test('should display validation errors for invalid input', async ({ page }) => {
    await page.click('button:has-text("Create New Habit")');

    // Try to submit without a name
    await page.fill('input#deadline', '09:00');
    await page.click('button:has-text("Create Habit")');

    // Should show validation error
    await expect(page.locator('.error')).toBeVisible();
  });

  test('should delete a habit', async ({ page }) => {
    // First create a habit
    await page.click('button:has-text("Create New Habit")');
    await page.fill('input#name', 'Test Habit to Delete');
    await page.fill('input#deadline', '10:00');
    await page.click('button:has-text("Create Habit")');

    // Wait for habit to appear
    const habitCard = page.locator('.habit-card:has-text("Test Habit to Delete")');
    await expect(habitCard).toBeVisible();

    // Set up dialog handler before clicking delete
    page.on('dialog', (dialog) => dialog.accept());

    // Delete the habit
    await habitCard.locator('button:has-text("Delete")').click();

    // Verify it's gone
    await expect(habitCard).not.toBeVisible();
  });

  test('should complete a habit', async ({ page }) => {
    // Create a habit first
    await page.click('button:has-text("Create New Habit")');
    await page.fill('input#name', 'Reading');
    await page.fill('input#deadline', '21:00');
    await page.click('button:has-text("Create Habit")');

    // Open check-in modal
    const habitCard = page.locator('.habit-card:has-text("Reading")');
    await habitCard.locator('button:has-text("Check In")').click();

    // Complete the habit
    await page.click('button.mode-btn:has-text("Complete")');
    await page.fill('textarea#notes', 'Finished a great chapter!');
    await page.click('button:has-text("Mark Complete")');

    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should skip a habit with reason', async ({ page }) => {
    // Create a habit first
    await page.click('button:has-text("Create New Habit")');
    await page.fill('input#name', 'Gym Session');
    await page.fill('input#deadline', '18:00');
    await page.click('button:has-text("Create Habit")');

    // Open check-in modal
    const habitCard = page.locator('.habit-card:has-text("Gym Session")');
    await habitCard.locator('button:has-text("Check In")').click();

    // Skip the habit
    await page.click('button.mode-btn:has-text("Skip")');
    await page.fill('input#skipReason', 'Feeling unwell');
    await page.fill('textarea#notes', 'Will resume tomorrow');
    await page.click('button:has-text("Mark Skipped")');

    // Modal should close
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should require skip reason when skipping', async ({ page }) => {
    // Create a habit
    await page.click('button:has-text("Create New Habit")');
    await page.fill('input#name', 'Test Habit');
    await page.fill('input#deadline', '12:00');
    await page.click('button:has-text("Create Habit")');

    // Open check-in modal
    const habitCard = page.locator('.habit-card:has-text("Test Habit")');
    await habitCard.locator('button:has-text("Check In")').click();

    // Try to skip without reason
    await page.click('button.mode-btn:has-text("Skip")');
    await page.click('button:has-text("Mark Skipped")');

    // Should show error
    await expect(page.locator('.error')).toBeVisible();
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Check that stats are displayed
    await expect(page.locator('.dashboard-stats')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Active Habits")')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Total Habits")')).toBeVisible();
    await expect(page.locator('.stat-label:has-text("Blocked Sites")')).toBeVisible();
  });
});
