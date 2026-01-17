# Testing Guide

This guide covers all aspects of testing in the Habit Tracker project.

## Testing Philosophy

We follow a **BDD-first, TDD-driven** approach:

1. Write BDD feature files (requirements)
2. Write failing unit tests (TDD)
3. Implement feature
4. Verify with E2E tests

**Goals:**
- 90%+ code coverage
- All user stories covered by BDD tests
- Critical paths covered by E2E tests
- Fast feedback loop

## Test Types

### 1. Unit Tests

**Purpose:** Test individual functions and components in isolation

**Tools:**
- Jest (backend, daemon, shared)
- Vitest (frontend)
- React Testing Library (frontend components)

**Coverage:**
- Business logic
- Utility functions
- Database operations
- API endpoints (with Supertest)
- React components

**Example - Backend Unit Test:**

```typescript
// packages/backend/src/routes/habits.test.ts
import request from 'supertest';
import app from '../server';
import { db } from '../db';

describe('POST /api/habits', () => {
  beforeEach(async () => {
    // Clear database
    await db.delete(habits);
  });

  it('should create a new habit', async () => {
    const response = await request(app)
      .post('/api/habits')
      .send({
        name: 'Morning Exercise',
        deadlineLocal: '09:00',
        timezoneOffset: -300,
        blockedWebsites: ['reddit.com'],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Morning Exercise');
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/habits')
      .send({
        deadlineLocal: '09:00',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

**Example - Frontend Unit Test:**

```typescript
// packages/frontend/src/components/HabitCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitCard } from './HabitCard';

describe('HabitCard', () => {
  const mockHabit = {
    id: '1',
    name: 'Reading',
    deadlineLocal: '21:00',
    blockedWebsites: ['twitter.com'],
    isActive: true,
  };

  it('should render habit details', () => {
    render(<HabitCard habit={mockHabit} onUpdate={jest.fn()} />);

    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText(/21:00/)).toBeInTheDocument();
  });

  it('should open check-in modal on button click', () => {
    render(<HabitCard habit={mockHabit} onUpdate={jest.fn()} />);

    fireEvent.click(screen.getByText('Check In'));

    expect(screen.getByText(/Check In: Reading/)).toBeInTheDocument();
  });
});
```

**Running Unit Tests:**

```bash
# All unit tests
npm run test:unit

# Specific package
npm run test -w @habit-tracker/backend

# Watch mode
npm run test:watch -w @habit-tracker/frontend

# Coverage report
npm run test -- --coverage
```

### 2. BDD Tests (Cucumber)

**Purpose:** Define and verify user stories and acceptance criteria

**Tools:**
- Cucumber
- Playwright (for browser automation)

**Coverage:**
- All user stories
- Acceptance criteria
- Edge cases and error scenarios

**Example - Feature File:**

```gherkin
# packages/e2e/features/habit-creation.feature
Feature: Habit Creation
  As a user
  I want to create habits with deadlines
  So that I can track my daily routines

  Scenario: Create a basic habit
    Given I am on the habit creation page
    When I enter "Morning Exercise" as the habit name
    And I set the deadline to "09:00"
    And I save the habit
    Then I should see "Morning Exercise" in my habit list

  Scenario: Validation prevents empty name
    Given I am on the habit creation page
    When I try to save without entering a name
    Then I should see an error message "Habit name is required"
```

**Example - Step Definitions:**

```typescript
// packages/e2e/step-definitions/habit-creation.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

Given('I am on the habit creation page', async function() {
  await this.page.goto('http://localhost:5173');
  await this.page.click('button:has-text("Create New Habit")');
});

When('I enter {string} as the habit name', async function(name: string) {
  await this.page.fill('input#name', name);
});

Then('I should see {string} in my habit list', async function(habitName: string) {
  const habitCard = this.page.locator('.habit-card', { hasText: habitName });
  await expect(habitCard).toBeVisible();
});
```

**Running BDD Tests:**

```bash
npm run test:bdd
```

**Report:** Opens `packages/e2e/cucumber-report.html`

### 3. E2E Tests (Playwright)

**Purpose:** Test complete user journeys across the entire stack

**Tools:**
- Playwright
- Multiple browsers (Chromium, Firefox, WebKit)

**Coverage:**
- Full user flows
- Cross-browser compatibility
- Visual regression (optional)

**Example:**

```typescript
// packages/e2e/tests/complete-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Habit Flow', () => {
  test('user creates, completes, and deletes a habit', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');

    // Create habit
    await page.click('button:has-text("Create New Habit")');
    await page.fill('input#name', 'Test Habit');
    await page.fill('input#deadline', '10:00');
    await page.click('button:has-text("Create Habit")');

    // Verify created
    await expect(page.locator('.habit-card:has-text("Test Habit")')).toBeVisible();

    // Complete habit
    const habitCard = page.locator('.habit-card:has-text("Test Habit")');
    await habitCard.locator('button:has-text("Check In")').click();
    await page.click('button:has-text("Mark Complete")');

    // Delete habit
    page.on('dialog', dialog => dialog.accept());
    await habitCard.locator('button:has-text("Delete")').click();

    // Verify deleted
    await expect(habitCard).not.toBeVisible();
  });
});
```

**Running E2E Tests:**

```bash
# All browsers
npm run test:e2e

# Specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# UI mode (interactive)
npm run test:ui -w @habit-tracker/e2e

# Headed mode (see browser)
npx playwright test --headed
```

**Report:** Opens `packages/e2e/playwright-report/`

### 4. Integration Tests

**Purpose:** Test interaction between components

**Tools:**
- Jest with Supertest (API tests)
- Database tests

**Example:**

```typescript
// packages/backend/src/integration/habits.integration.test.ts
describe('Habit Integration', () => {
  it('should create habit and mark as missed after deadline', async () => {
    // Create habit
    const createResponse = await request(app)
      .post('/api/habits')
      .send({
        name: 'Test',
        deadlineLocal: '00:01',
        timezoneOffset: 0,
        blockedWebsites: ['example.com'],
      });

    const habitId = createResponse.body.data.id;

    // Trigger daemon check
    await request(app).post('/api/daemon/sync');

    // Wait for daemon
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check logs
    const logsResponse = await request(app).get(`/api/habits/${habitId}/logs`);

    expect(logsResponse.body.data[0].status).toBe('missed');
  });
});
```

## Test Organization

### File Structure

```
packages/
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── habits.ts
│       │   └── habits.test.ts          # Unit tests
│       └── integration/
│           └── habits.integration.test.ts  # Integration tests
├── frontend/
│   └── src/
│       └── components/
│           ├── HabitCard.tsx
│           └── HabitCard.test.tsx      # Component tests
└── e2e/
    ├── features/
    │   └── habits.feature              # BDD scenarios
    ├── step-definitions/
    │   └── habits.steps.ts             # Cucumber steps
    └── tests/
        └── habits.spec.ts              # Playwright E2E
```

### Naming Conventions

- Unit tests: `*.test.ts` or `*.spec.ts`
- Feature files: `*.feature`
- Step definitions: `*.steps.ts`
- Test utilities: `test-utils.ts`

## Mocking

### Backend Mocking

```typescript
// Mock database
jest.mock('../db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

// Mock external services
jest.mock('better-sqlite3', () => jest.fn());
```

### Frontend Mocking

```typescript
// Mock API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, data: [] }),
  })
) as jest.Mock;

// Mock hooks
jest.mock('../hooks/useHabits', () => ({
  useHabits: () => ({
    habits: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));
```

## Test Data Management

### Fixtures

Create reusable test data:

```typescript
// packages/backend/src/__tests__/fixtures/habits.ts
export const mockHabit = {
  id: '1',
  name: 'Test Habit',
  deadlineUtc: '13:00',
  timezoneOffset: -300,
  blockedWebsites: JSON.stringify(['reddit.com']),
  isActive: true,
  createdAt: '2026-01-17T00:00:00.000Z',
};

export const mockHabitLog = {
  id: '1',
  habitId: '1',
  date: '2026-01-17',
  status: 'completed' as const,
  completedAt: '2026-01-17T08:00:00.000Z',
  createdAt: '2026-01-17T08:00:00.000Z',
};
```

### Factories

```typescript
// packages/backend/src/__tests__/factories/habit.factory.ts
export function createHabit(overrides = {}) {
  return {
    id: randomUUID(),
    name: 'Test Habit',
    deadlineUtc: '13:00',
    timezoneOffset: -300,
    blockedWebsites: JSON.stringify([]),
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
```

## Coverage Reports

### Viewing Coverage

```bash
# Generate coverage
npm run test -- --coverage

# Open HTML report
open packages/backend/coverage/index.html
```

### Coverage Thresholds

Set in Jest/Vitest config:

```javascript
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install
      - run: npm run build
      - run: npm run test:unit
      - run: npm run test:e2e
      - run: npm run test:bdd

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Best Practices

### 1. AAA Pattern

```typescript
it('should create habit', async () => {
  // Arrange
  const habitData = { name: 'Test', deadline: '09:00' };

  // Act
  const response = await request(app)
    .post('/api/habits')
    .send(habitData);

  // Assert
  expect(response.status).toBe(201);
});
```

### 2. One Assertion Per Test

```typescript
// Bad
it('should handle habit creation', async () => {
  const response = await createHabit();
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.data.name).toBe('Test');
});

// Good
it('should return 201 on successful creation', async () => {
  const response = await createHabit();
  expect(response.status).toBe(201);
});

it('should return success flag on creation', async () => {
  const response = await createHabit();
  expect(response.body.success).toBe(true);
});
```

### 3. Descriptive Test Names

```typescript
// Bad
it('works', () => {});

// Good
it('should mark habit as missed when deadline passes without completion', () => {});
```

### 4. Independent Tests

```typescript
// Each test should clean up after itself
afterEach(async () => {
  await db.delete(habits);
  await db.delete(habitLogs);
});
```

### 5. Fast Tests

```typescript
// Use in-memory database for tests
process.env.DB_PATH = ':memory:';

// Mock slow operations
jest.mock('./slow-operation', () => jest.fn().mockResolvedValue({}));
```

## Debugging Tests

### Playwright Debugging

```bash
# Debug specific test
npx playwright test --debug habits.spec.ts

# Slow motion
npx playwright test --slow-mo=1000

# Take screenshots on failure
npx playwright test --screenshot=on-failure
```

### Jest Debugging

```bash
# Debug in VS Code
# Add to launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "${file}"],
  "console": "integratedTerminal"
}
```

## Performance Testing

### Load Testing with k6

```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const res = http.get('http://localhost:3000/api/habits');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

Run:
```bash
k6 run performance-test.js
```

## Accessibility Testing

```typescript
// packages/frontend/src/components/HabitForm.test.tsx
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<HabitForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Visual Regression Testing

```typescript
// packages/e2e/tests/visual.spec.ts
test('habit card looks correct', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page.locator('.habit-card').first()).toHaveScreenshot();
});
```

## Test Maintenance

### Regular Tasks

1. **Remove obsolete tests** after refactoring
2. **Update snapshots** when UI changes
3. **Review flaky tests** and fix root causes
4. **Keep test data updated** with schema changes
5. **Monitor test execution time** and optimize slow tests

### Flaky Test Resolution

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Set timeouts appropriately
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Cucumber Documentation](https://cucumber.io/docs/cucumber/)
- [React Testing Library](https://testing-library.com/react)
