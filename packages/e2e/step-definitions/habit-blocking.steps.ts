import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const HOSTS_FILE = '/etc/hosts';
const LOGS_DIR = path.join(process.env.HOME!, '.habit-tracker', 'logs');
const BACKUP_DIR = path.join(process.env.HOME!, '.habit-tracker', 'backups');

Given(
  'I have a habit {string} with deadline {string}',
  async function (habitName: string, deadline: string) {
    // Create habit via API
    const response = await fetch('http://localhost:3000/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: habitName,
        deadlineLocal: deadline,
        timezoneOffset: -new Date().getTimezoneOffset(),
        blockedWebsites: [],
      }),
    });
    const data = await response.json();
    this.habitId = data.data.id;
  }
);

Given('the habit blocks {string}', async function (websites: string) {
  const websiteList = websites.split(',');
  // Update habit with blocked websites
  await fetch(`http://localhost:3000/api/habits/${this.habitId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blockedWebsites: websiteList,
    }),
  });
});

When('the time is {string}', async function (time: string) {
  // Mock time or wait for time to pass
  // In a real test, you would mock the system time
  this.currentTime = time;
});

When("I haven't completed the habit", function () {
  // Do nothing - habit is not completed
});

Then('{string} should be blocked', async function (domain: string) {
  // Check if domain is in hosts file
  const hostsContent = fs.readFileSync(HOSTS_FILE, 'utf-8');
  expect(hostsContent).toContain(`127.0.0.1 ${domain}`);
});

Then('{string} should be accessible', async function (domain: string) {
  // Check if domain is NOT in hosts file habit-tracker section
  const hostsContent = fs.readFileSync(HOSTS_FILE, 'utf-8');
  const lines = hostsContent.split('\n');
  let inSection = false;
  let blocked = false;

  for (const line of lines) {
    if (line.includes('# HABIT-TRACKER-START')) {
      inSection = true;
      continue;
    }
    if (line.includes('# HABIT-TRACKER-END')) {
      break;
    }
    if (inSection && line.includes(domain)) {
      blocked = true;
      break;
    }
  }

  expect(blocked).toBe(false);
});

Given(
  'I have a habit {string} with deadline {string} that blocks {string}',
  async function (habitName: string, deadline: string, websites: string) {
    const websiteList = websites.split(',');
    const response = await fetch('http://localhost:3000/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: habitName,
        deadlineLocal: deadline,
        timezoneOffset: -new Date().getTimezoneOffset(),
        blockedWebsites: websiteList,
      }),
    });
    const data = await response.json();
    this.habits = this.habits || {};
    this.habits[habitName] = data.data.id;
  }
);

When("I haven't completed {string}", function (habitName: string) {
  // Do nothing - habit is not completed
});

When('I completed the habit at {string}', async function (time: string) {
  await fetch(`http://localhost:3000/api/habits/${this.habitId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: `Completed at ${time}` }),
  });
});

When('I skip the habit with reason {string}', async function (reason: string) {
  await fetch(`http://localhost:3000/api/habits/${this.habitId}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skipReason: reason }),
  });
});

When('the time becomes {string}', async function (time: string) {
  this.currentTime = time;
  // Trigger daemon check
  await fetch('http://localhost:3000/api/daemon/sync', {
    method: 'POST',
  });
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for daemon
});

Then('a backup of the hosts file should be created', function () {
  const backups = fs.readdirSync(BACKUP_DIR);
  expect(backups.length).toBeGreaterThan(0);
});

Then('the backup should be timestamped', function () {
  const backups = fs.readdirSync(BACKUP_DIR);
  const latestBackup = backups[backups.length - 1];
  expect(latestBackup).toMatch(/hosts_.*\.bak/);
});

Then('the hosts file should contain an entry for {string}', function (domain: string) {
  const hostsContent = fs.readFileSync(HOSTS_FILE, 'utf-8');
  expect(hostsContent).toContain(`127.0.0.1 ${domain}`);
});

Then('the daemon log should contain an entry for blocking {string}', function (domain: string) {
  const logPath = path.join(LOGS_DIR, 'daemon.log');
  const logContent = fs.readFileSync(logPath, 'utf-8');
  expect(logContent).toContain(`Blocking`);
  expect(logContent).toContain(domain);
});

Then('the log entry should include a timestamp', function () {
  const logPath = path.join(LOGS_DIR, 'daemon.log');
  const logContent = fs.readFileSync(logPath, 'utf-8');
  // Check for ISO timestamp format
  expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
});
