# @habit-tracker/docs

VitePress documentation site with TypeDoc-generated API reference. Aggregates documentation from all packages into a single browsable website.

## Key Files

| File | Purpose |
|------|---------|
| `.vitepress/config.ts` | VitePress site configuration (nav, sidebar, theme) |
| `typedoc.json` | TypeDoc configuration for API docs generation |
| `index.md` | Documentation site homepage |
| `guide/*.md` | User guides (setup, architecture) |
| `api/` | Auto-generated API reference from TSDoc comments |

## Development

```bash
# Start development server with hot reload
npm run docs:dev

# Generate API docs from source code
npm run docs:generate

# Build static site for production
npm run docs:build

# Preview production build locally
npm run docs:preview
```

## Architecture

The docs package combines two documentation sources:

1. **Manual guides** (`guide/*.md`) - Hand-written setup and architecture docs
2. **Generated API reference** (`api/`) - Auto-generated from TSDoc comments in `@habit-tracker/shared`

### Build Process

```
@habit-tracker/shared (TSDoc)
         ↓
    TypeDoc (generate)
         ↓
    api/*.md files
         ↓
    VitePress (build)
         ↓
    Static HTML site
```

## Adding Documentation

### New Guide Page

1. Create `guide/your-topic.md`
2. Add to sidebar in `.vitepress/config.ts`

### API Documentation

API docs are generated automatically from TSDoc comments in the shared package. To document a new type or function:

1. Add TSDoc comments to exports in `packages/shared/src/`
2. Run `npm run docs:generate`
3. The API reference updates automatically

## Output

Built docs are output to `.vitepress/dist/` and can be deployed to any static hosting service.
