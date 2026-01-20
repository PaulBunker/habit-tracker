# Habit Tracker with Website Blocking

A macOS habit tracking app that blocks distracting websites when daily habits aren't completed by their deadlines.

## How It Works

1. **Create habits** with optional deadlines
2. **Configure blocked websites** in Settings
3. **Daemon monitors** habit status (instant IPC + 60-second fallback polling)
4. **Websites blocked** when any deadline passes
5. **Unblocked** when all overdue habits are completed/skipped

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode (sandbox database)
npm run dev
```

- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:3001

For production deployment, see the [Deployment Guide](https://paulbunker.github.io/habit-tracker/guide/deployment).

## Documentation

**[View Full Documentation](https://paulbunker.github.io/habit-tracker/)**

| Section | Description |
|---------|-------------|
| [Guide](https://paulbunker.github.io/habit-tracker/guide/) | Setup, architecture, deployment, troubleshooting |
| [API Reference](https://paulbunker.github.io/habit-tracker/api/) | TypeDoc-generated from source |
| [CLAUDE.md](./CLAUDE.md) | AI assistant instructions |

Or build docs locally:
```bash
npm run docs:dev    # Start at http://localhost:5173
```

## Project Structure

```
packages/
├── shared/     # TypeScript types and utilities
├── backend/    # Express API server (SQLite)
├── frontend/   # React + Vite webapp
├── daemon/     # Background service (/etc/hosts)
├── e2e/        # Playwright & Cucumber tests
└── docs/       # VitePress documentation
```

Each package has its own README with detailed documentation.

## Key Commands

```bash
npm run dev           # Development mode
npm run start:prod    # Production mode
npm run build         # Build all packages
npm test              # Run all tests
npm run docs:dev      # Documentation site
```

## Troubleshooting

See the [Troubleshooting Guide](https://paulbunker.github.io/habit-tracker/guide/troubleshooting) for common issues.

Quick fixes:
```bash
npm run daemon:status   # Check daemon status
npm run daemon:restore  # Emergency unblock all websites
```

## Contributing

This project follows TDD/BDD practices. Run `npm run lint` to check code style (ESLint enforces naming conventions and no `any` types).

## License

MIT
