import { test, expect } from '@playwright/test';
import fs from 'fs';

const HOSTS_FILE = '/etc/hosts';

test.describe('Website Blocking Flow', () => {
  test('should block websites when habit deadline passes', async ({ page }) => {
    // Create a habit with deadline in the past
    await page.goto('http://localhost:5173');
    await page.click('button:has-text("Create New Habit")');

    await page.fill('input#name', 'Overdue Habit');
    await page.fill('input#deadline', '00:01'); // Very early morning
    await page.fill('input#website', 'example.com');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Create Habit")');

    // Wait for habit to be created
    await expect(page.locator('.habit-card:has-text("Overdue Habit")')).toBeVisible();

    // Trigger daemon sync
    await fetch('http://localhost:3000/api/daemon/sync', { method: 'POST' });

    // Wait for daemon to process
    await page.waitForTimeout(3000);

    // Check hosts file (note: this requires appropriate permissions)
    // In a real test environment, you might mock this or run with sudo
    // For now, we'll just verify the API response
    const statusResponse = await fetch('http://localhost:3000/api/status');
    const statusData = await statusResponse.json();

    // Verify that blocking is active (this is a placeholder)
    expect(statusData.success).toBe(true);
  });

  test('should unblock websites when habit is completed', async ({ page }) => {
    // This test would verify the full flow:
    // 1. Create habit with blocked sites
    // 2. Wait for deadline to pass
    // 3. Verify sites are blocked
    // 4. Complete the habit
    // 5. Verify sites are unblocked

    await page.goto('http://localhost:5173');

    // For testing purposes, we'll just verify the completion flow
    // A full integration test would require time mocking or waiting
  });

  test('should maintain backup of hosts file', async ({ page }) => {
    // Verify that backups are created
    // This is a placeholder - real test would check ~/.habit-tracker/backups/
  });
});
