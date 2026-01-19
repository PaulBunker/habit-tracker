# @habit-tracker/e2e

End-to-end and BDD tests for the Habit Tracker application using Playwright and Cucumber.

## Key Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright test configuration |
| `cucumber.js` | Cucumber BDD configuration |
| `tests/*.spec.ts` | Playwright E2E test specs |
| `features/*.feature` | Gherkin feature files for BDD |
| `step-definitions/*.steps.ts` | Step implementations for Cucumber |
| `support/world.ts` | Cucumber world context |
| `support/hooks.ts` | Test setup/teardown hooks |

## Test Types

### Playwright E2E Tests

Traditional end-to-end tests in `tests/`:

| Test File | Coverage |
|-----------|----------|
| `habit-management.spec.ts` | Creating, editing, deleting habits |
| `blocking-flow.spec.ts` | Website blocking when deadlines pass |

### Cucumber BDD Tests

Behavior-driven tests in `features/`:

| Feature | Description |
|---------|-------------|
| `daily-checklist.feature` | Main checklist functionality |
| `quick-add-habit.feature` | Quick habit creation flow |
| `habit-settings.feature` | Habit configuration |
| `website-blocking.feature` | Blocking enforcement |
| `calendar-view.feature` | Calendar history display |
| `graph-view.feature` | Data visualization |
| `global-settings.feature` | App settings |
| `data-entry.feature` | Data tracking input |

## Development

```bash
# Run all E2E tests
npm run test:e2e

# Run Playwright tests with UI
npm run test:ui -w @habit-tracker/e2e

# Run Playwright tests in debug mode
npm run test:debug -w @habit-tracker/e2e

# Run Cucumber BDD tests
npm run test:bdd

# View test report
npx playwright show-report packages/e2e/playwright-report
```

## Architecture

### Test Environment

Tests run against a sandboxed environment:
- Backend on port 3001
- Frontend on port 5174
- Separate test database

### Global Setup

`global-setup.ts` prepares the test environment before any tests run.

### Step Definitions

Cucumber steps are organized by domain:
- `habit-creation.steps.ts` - Creating new habits
- `habit-completion.steps.ts` - Completing/skipping habits
- `habit-blocking.steps.ts` - Website blocking scenarios

### World Context

`support/world.ts` provides shared context across steps including:
- Browser page instance
- API client for test setup
- Helper functions for common actions

## Writing Tests

### Playwright Example

```typescript
test('can create a habit', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="quick-add-input"]', 'Exercise');
  await page.click('[data-testid="quick-add-submit"]');
  await expect(page.locator('text=Exercise')).toBeVisible();
});
```

### Cucumber Example

```gherkin
Feature: Quick Add Habit
  Scenario: User creates a habit with just a name
    Given I am on the home page
    When I enter "Exercise" in the quick add field
    And I submit the quick add form
    Then I should see "Exercise" in the habit list
```
