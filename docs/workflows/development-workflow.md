# Development Workflow

This document describes the development workflow for the Habit Tracker project following TDD/BDD best practices.

## Setup

### Initial Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build shared package:
   ```bash
   npm run build -w @habit-tracker/shared
   ```

### Running in Development

Start all services:
```bash
npm run dev
```

This runs:
- Frontend dev server (Vite) on port 5173
- Backend dev server (tsx watch) on port 3000
- Daemon in watch mode

Or run services individually:
```bash
# Frontend only
npm run dev -w @habit-tracker/frontend

# Backend only
npm run dev -w @habit-tracker/backend

# Daemon only
npm run dev -w @habit-tracker/daemon
```

## TDD/BDD Workflow

### 1. BDD First: Define Requirements

Start with a Cucumber feature file describing the user story:

**File:** `packages/e2e/features/my-feature.feature`

```gherkin
Feature: User Registration
  Scenario: User creates a new account
    Given I am on the registration page
    When I enter valid details
    And I submit the form
    Then I should see a success message
```

### 2. Implement Step Definitions

Create step definitions for your feature:

**File:** `packages/e2e/step-definitions/my-feature.steps.ts`

```typescript
import { Given, When, Then } from '@cucumber/cucumber';

Given('I am on the registration page', async function() {
  // Implementation
});

When('I enter valid details', async function() {
  // Implementation
});
```

Run BDD tests:
```bash
npm run test:bdd
```

At this point, tests will fail (Red phase).

### 3. TDD: Write Failing Unit Tests

Write unit tests for the functionality:

**File:** `packages/backend/src/routes/users.test.ts`

```typescript
describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

Run tests:
```bash
npm run test -w @habit-tracker/backend
```

Tests should fail (Red phase).

### 4. Implement the Feature

Write the minimum code to make tests pass:

**File:** `packages/backend/src/routes/users.ts`

```typescript
router.post('/', async (req, res) => {
  // Implementation
});
```

Run tests again:
```bash
npm run test -w @habit-tracker/backend
```

Tests should now pass (Green phase).

### 5. Refactor

Clean up the code while keeping tests green:
- Remove duplication
- Improve naming
- Extract functions
- Add comments

Run tests after each refactor to ensure nothing broke.

### 6. Verify BDD Tests

Run the full BDD test suite:
```bash
npm run test:bdd
```

BDD tests should now pass.

### 7. Write E2E Tests

Create Playwright tests for the complete user flow:

**File:** `packages/e2e/tests/user-registration.spec.ts`

```typescript
test('user can register', async ({ page }) => {
  await page.goto('http://localhost:5173/register');
  await page.fill('#name', 'John');
  await page.fill('#email', 'john@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

Run E2E tests:
```bash
npm run test:e2e
```

## Testing Strategy

### Unit Tests (90%+ Coverage Goal)

**When to write:**
- For all business logic
- For all utility functions
- For database operations
- For validation logic

**How to run:**
```bash
# All unit tests
npm run test:unit

# Specific package
npm run test -w @habit-tracker/backend

# Watch mode
npm run test:watch -w @habit-tracker/backend

# With coverage
npm run test -- --coverage
```

**Coverage reports:**
- Backend: `packages/backend/coverage/`
- Frontend: `packages/frontend/coverage/`
- Daemon: `packages/daemon/coverage/`

### BDD Tests (Cucumber)

**When to write:**
- For user stories and acceptance criteria
- Before implementing features
- To document behavior

**How to run:**
```bash
npm run test:bdd
```

**Reports:**
- Located in `packages/e2e/cucumber-report.html`

### E2E Tests (Playwright)

**When to write:**
- For complete user journeys
- For critical paths
- For cross-browser compatibility

**How to run:**
```bash
# All E2E tests
npm run test:e2e

# Specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# UI mode
npm run test:ui -w @habit-tracker/e2e
```

**Reports:**
- Located in `packages/e2e/playwright-report/`

## Code Style

### Linting

Run ESLint:
```bash
# Check all packages
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Formatting

Format code with Prettier:
```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Pre-commit Hooks

Husky runs lint-staged before every commit:
- ESLint on TypeScript files
- Prettier on all files
- Type checking

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/what` - Refactoring
- `test/what` - Test improvements
- `docs/what` - Documentation

### Commit Messages

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Updating build tasks, package manager configs, etc.

**Examples:**
```
feat(habits): add deadline validation

Add validation to ensure deadlines are in HH:MM format
and within valid time range.

Closes #123
```

```
fix(daemon): handle missing hosts file gracefully

Previously crashed if hosts file didn't exist.
Now creates it with proper permissions.
```

### Pull Request Process

1. Create feature branch from `main`
2. Write BDD feature files
3. Implement with TDD
4. Ensure all tests pass
5. Run linting and formatting
6. Create pull request
7. Wait for review
8. Merge to `main`

## Building

### Development Build

```bash
npm run build
```

Builds all packages in correct order:
1. Shared (types and utilities)
2. Backend
3. Daemon
4. Frontend

### Production Build

```bash
NODE_ENV=production npm run build
```

### Clean Build

```bash
# Remove all build artifacts
find . -name "dist" -type d -exec rm -rf {} +
find . -name "build" -type d -exec rm -rf {} +

# Rebuild
npm run build
```

## Database

### Migrations

Generate migration:
```bash
cd packages/backend
npx drizzle-kit generate:sqlite
```

Run migrations:
```bash
npm run db:migrate -w @habit-tracker/backend
```

### Seeding

Seed database with sample data:
```bash
npm run db:seed -w @habit-tracker/backend
```

### Reset Database

```bash
rm packages/backend/data/habit-tracker.db
npm run db:migrate -w @habit-tracker/backend
npm run db:seed -w @habit-tracker/backend
```

## Daemon Management

### Install Daemon

```bash
npm run install:daemon
```

### Uninstall Daemon

```bash
npm run uninstall:daemon
```

### Check Daemon Status

```bash
launchctl list | grep habit-tracker
```

### View Daemon Logs

```bash
tail -f ~/.habit-tracker/logs/daemon.log
```

### Restart Daemon

```bash
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
launchctl load ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
```

## Debugging

### Frontend Debugging

1. Open Chrome DevTools
2. Use React DevTools extension
3. Set breakpoints in Sources tab
4. Use `console.log` for quick debugging

### Backend Debugging

1. Add debugger statements
2. Run with Node inspector:
   ```bash
   node --inspect packages/backend/dist/server.js
   ```
3. Open `chrome://inspect`
4. Click "inspect" on your process

### Daemon Debugging

1. Stop daemon:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
   ```
2. Run manually:
   ```bash
   node packages/daemon/dist/index.js
   ```
3. View output in terminal
4. Add console.log statements

## Troubleshooting

### "Cannot find module"

```bash
npm install
npm run build -w @habit-tracker/shared
```

### Tests failing

```bash
# Clear cache
npm run test -- --clearCache

# Update snapshots
npm run test -- -u
```

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Hosts file not updating

1. Check daemon is running
2. Check daemon logs for errors
3. Verify permissions on `/etc/hosts`
4. Flush DNS cache:
   ```bash
   dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

## Performance Tips

### Fast Test Runs

```bash
# Run only changed tests
npm run test -- --onlyChanged

# Run specific test file
npm run test -- path/to/test.ts

# Skip E2E tests during development
npm run test:unit
```

### Fast Build

```bash
# Build only what changed
npm run build -w @habit-tracker/backend

# Skip type checking during development
npx vite build --mode development
```

### Development Server

Vite HMR should update instantly. If it's slow:
1. Reduce number of watched files
2. Close unused editor tabs
3. Restart dev server

## Best Practices

1. **Test First**: Always write tests before implementation
2. **Small Commits**: Commit often with clear messages
3. **Code Review**: Never merge without review
4. **Coverage**: Maintain 90%+ test coverage
5. **Types**: Use TypeScript strictly (no `any`)
6. **Documentation**: Update docs with code changes
7. **Refactor**: Clean up code regularly
8. **Security**: Validate all inputs
9. **Performance**: Profile before optimizing
10. **KISS**: Keep it simple and straightforward
