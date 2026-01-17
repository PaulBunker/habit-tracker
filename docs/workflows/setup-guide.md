# Setup Guide

Complete guide to setting up the Habit Tracker development environment.

## Prerequisites

### Required Software

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **macOS** (for daemon features)

### Optional Tools

- **Visual Studio Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Playwright Test for VSCode
- **Postman** or **Insomnia** for API testing
- **DB Browser for SQLite** for database inspection

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd habit-tracker
```

### 2. Install Dependencies

Install all workspace dependencies:

```bash
npm install
```

This installs dependencies for:
- Root workspace
- All packages (frontend, backend, daemon, shared, e2e)

**Note:** If you see peer dependency warnings, they can usually be ignored.

### 3. Build Shared Package

The shared package must be built before other packages can use it:

```bash
npm run build -w @habit-tracker/shared
```

### 4. Set Up Database

Create and initialize the database:

```bash
# Navigate to backend package
cd packages/backend

# Generate initial migration
npx drizzle-kit generate:sqlite

# Run migrations
npm run db:migrate

# Optional: Seed with sample data
npm run db:seed

# Return to root
cd ../..
```

This creates:
- `packages/backend/data/habit-tracker.db` - SQLite database
- `packages/backend/drizzle/` - Migration files

### 5. Install Daemon (Optional)

The daemon is required for website blocking functionality.

```bash
npm run install:daemon
```

**What this does:**
1. Builds the daemon package
2. Creates launchd plist file in `~/Library/LaunchAgents/`
3. Loads the daemon service
4. Creates directories for logs and backups

**Troubleshooting:**
- If you get permission errors, the script will guide you
- The daemon needs to modify `/etc/hosts`, which requires sudo access
- Check daemon status: `launchctl list | grep habit-tracker`

## Verification

### Check Installation

```bash
# Verify Node.js version
node --version  # Should be >= 18.0.0

# Verify npm version
npm --version   # Should be >= 9.0.0

# Check all packages installed
npm list --depth=0

# Verify TypeScript works
npx tsc --version
```

### Run Tests

```bash
# Run all tests
npm test

# Should see all tests passing
```

### Start Development Servers

```bash
# Start all services
npm run dev
```

This should start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

**Verify:**
1. Open http://localhost:5173 in your browser
2. You should see the Habit Tracker UI
3. Try creating a habit
4. Check backend is responding: http://localhost:3000/health

## Configuration

### Environment Variables

Create `.env` files if needed:

**packages/backend/.env** (optional):
```env
PORT=3000
DB_PATH=./data/habit-tracker.db
NODE_ENV=development
```

**packages/frontend/.env** (optional):
```env
VITE_API_URL=http://localhost:3000
```

### Database Configuration

Edit `packages/backend/drizzle.config.ts` to change database location:

```typescript
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DB_PATH || './data/habit-tracker.db',
  },
};
```

### Daemon Configuration

Edit check interval in `packages/daemon/src/index.ts`:

```typescript
const CHECK_INTERVAL = 60 * 1000; // Change to desired interval in ms
```

## IDE Setup

### Visual Studio Code

**Recommended Extensions:**

Install via command palette (Cmd+Shift+P > Extensions: Install Extensions):

```
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-playwright.playwright
```

**Settings (.vscode/settings.json):**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Launch Configuration (.vscode/launch.json):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/packages/backend/src/server.ts",
      "preLaunchTask": "tsc: build - packages/backend/tsconfig.json",
      "outFiles": ["${workspaceFolder}/packages/backend/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### "Cannot find module '@habit-tracker/shared'"

**Solution:**
```bash
npm run build -w @habit-tracker/shared
```

The shared package must be built before other packages can import from it.

#### Port 3000 or 5173 already in use

**Find process:**
```bash
lsof -i :3000  # or :5173
```

**Kill process:**
```bash
kill -9 <PID>
```

**Or use different ports:**
```bash
PORT=3001 npm run dev -w @habit-tracker/backend
```

#### Permission errors when installing daemon

**Solution:**
The daemon needs to modify `/etc/hosts`. You'll be prompted for your password.

If it still fails:
```bash
# Manually create directories
mkdir -p ~/.habit-tracker/logs
mkdir -p ~/.habit-tracker/backups

# Run install script with verbose output
bash -x scripts/install-daemon.sh
```

#### Database locked errors

**Solution:**
```bash
# Close all connections to database
killall node

# Remove database and recreate
rm packages/backend/data/habit-tracker.db
npm run db:migrate -w @habit-tracker/backend
```

#### Tests failing with "ECONNREFUSED"

**Solution:**
Make sure backend server is running:
```bash
npm run dev -w @habit-tracker/backend
```

Or run E2E tests which start servers automatically:
```bash
npm run test:e2e
```

#### TypeScript errors in IDE

**Solution:**
```bash
# Restart TypeScript server in VSCode
# Cmd+Shift+P > TypeScript: Restart TS Server

# Or rebuild all packages
npm run build
```

#### Daemon not starting

**Check daemon status:**
```bash
launchctl list | grep habit-tracker
```

**View daemon logs:**
```bash
tail -f ~/.habit-tracker/logs/daemon.log
tail -f ~/.habit-tracker/logs/daemon.error.log
```

**Restart daemon:**
```bash
launchctl unload ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
launchctl load ~/Library/LaunchAgents/com.habit-tracker.daemon.plist
```

#### Websites not being blocked

**Verify daemon is running:**
```bash
launchctl list | grep habit-tracker
```

**Check hosts file:**
```bash
cat /etc/hosts
```

Look for entries between `# HABIT-TRACKER-START` and `# HABIT-TRACKER-END`.

**Flush DNS cache:**
```bash
dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Check daemon logs:**
```bash
tail -f ~/.habit-tracker/logs/daemon.log
```

#### npm install errors

**Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Check Node version:**
```bash
node --version
```

Should be >= 18.0.0. If not, update Node.js.

## Reset Everything

If you want to start fresh:

```bash
# Stop daemon
npm run uninstall:daemon

# Remove all build artifacts and dependencies
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf packages/*/dist
rm -rf packages/backend/data
rm -rf ~/.habit-tracker

# Remove lock file
rm package-lock.json

# Reinstall
npm install
npm run build

# Recreate database
npm run db:migrate -w @habit-tracker/backend
npm run db:seed -w @habit-tracker/backend

# Reinstall daemon
npm run install:daemon
```

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Rebuild if needed
npm run build

# 4. Start development servers
npm run dev

# 5. Open in browser
open http://localhost:5173
```

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Write BDD feature file
# Edit packages/e2e/features/my-feature.feature

# 3. Write failing tests
npm run test:watch -w @habit-tracker/backend

# 4. Implement feature
# Edit packages/backend/src/...

# 5. Verify tests pass
npm test

# 6. Format and lint
npm run format
npm run lint

# 7. Commit changes
git add .
git commit -m "feat: add my feature"

# 8. Push and create PR
git push origin feature/my-feature
```

## Next Steps

After successful setup:

1. **Read the docs:**
   - [Development Workflow](./development-workflow.md)
   - [Testing Guide](./testing-guide.md)
   - [API Documentation](../architecture/api-documentation.md)

2. **Explore the code:**
   - Start with `packages/backend/src/server.ts`
   - Look at React components in `packages/frontend/src/components/`
   - Check out daemon in `packages/daemon/src/index.ts`

3. **Run the tests:**
   ```bash
   npm run test:unit  # Unit tests
   npm run test:bdd   # BDD tests
   npm run test:e2e   # E2E tests
   ```

4. **Try creating a habit:**
   - Open http://localhost:5173
   - Click "Create New Habit"
   - Fill in the form
   - Add blocked websites
   - Save and check it in

5. **Monitor the daemon:**
   ```bash
   tail -f ~/.habit-tracker/logs/daemon.log
   ```

## Getting Help

If you're stuck:

1. **Check the docs** in `docs/`
2. **Search issues** on GitHub
3. **Ask the team** on Slack/Discord
4. **Create an issue** with:
   - What you tried
   - What you expected
   - What actually happened
   - Logs/screenshots

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Playwright Documentation](https://playwright.dev/)
- [Cucumber Documentation](https://cucumber.io/docs/)

## System Requirements

### Minimum

- macOS 10.15+
- 4 GB RAM
- 500 MB disk space
- Node.js 18.0.0+

### Recommended

- macOS 12.0+
- 8 GB RAM
- 1 GB disk space
- Node.js 20.0.0+
- SSD

## Security Considerations

### Development

- Never commit `.env` files
- Don't commit database files
- Keep dependencies updated
- Use HTTPS in production

### Daemon

- The daemon has write access to `/etc/hosts`
- Only install from trusted sources
- Review daemon code before installation
- Check logs regularly

### Database

- Database file permissions: 644
- Stored locally only
- No sensitive data in version control
- Regular backups recommended

---

**You're all set!** Start coding with `npm run dev` 🚀
