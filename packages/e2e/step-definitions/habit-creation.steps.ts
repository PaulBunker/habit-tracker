import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am on the habit creation page', async function () {
  await this.page.goto('http://localhost:5173');
  await this.page.click('button:has-text("Create New Habit")');
});

When('I enter {string} as the habit name', async function (name: string) {
  await this.page.fill('input#name', name);
});

When('I set the deadline to {string}', async function (time: string) {
  await this.page.fill('input#deadline', time);
});

When('I save the habit', async function () {
  await this.page.click('button:has-text("Create Habit")');
  await this.page.waitForTimeout(500); // Wait for API call
});

Then('I should see {string} in my habit list', async function (habitName: string) {
  const habitCard = this.page.locator('.habit-card', { hasText: habitName });
  await expect(habitCard).toBeVisible();
});

Then('the habit should have a deadline of {string}', async function (time: string) {
  const deadline = this.page.locator('.deadline', { hasText: time });
  await expect(deadline).toBeVisible();
});

When('I add {string} to the blocked websites', async function (website: string) {
  await this.page.fill('input#website', website);
  await this.page.click('button:has-text("Add")');
});

Then(
  'the habit should block {string} and {string}',
  async function (website1: string, website2: string) {
    const blockedWebsites = this.page.locator('.blocked-websites');
    await expect(blockedWebsites).toContainText(website1);
    await expect(blockedWebsites).toContainText(website2);
  }
);

When('I enter {string} as the description', async function (description: string) {
  await this.page.fill('textarea#description', description);
});

Then('the habit should have the description {string}', async function (description: string) {
  const desc = this.page.locator('.description', { hasText: description });
  await expect(desc).toBeVisible();
});

When('I try to save the habit without entering a name', async function () {
  await this.page.click('button:has-text("Create Habit")');
});

Then('I should see an error message {string}', async function (errorMessage: string) {
  const error = this.page.locator('.error', { hasText: errorMessage });
  await expect(error).toBeVisible();
});

Then('the habit should not be created', async function () {
  // Check that we're still on the form page
  const form = this.page.locator('.habit-form');
  await expect(form).toBeVisible();
});

When('I try to save the habit without setting a deadline', async function () {
  await this.page.click('button:has-text("Create Habit")');
});

When('I try to add {string} to the blocked websites', async function (website: string) {
  await this.page.fill('input#website', website);
  await this.page.click('button:has-text("Add")');
});

Then('the blocked website should not be added', async function () {
  const websiteList = this.page.locator('.website-list');
  await expect(websiteList).not.toBeVisible();
});
