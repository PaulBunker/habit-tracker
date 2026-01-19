---
description: Work on the next Documentation-as-Code issue
---

# Documentation Work

Work on documentation issues from the Documentation-as-Code project (#34-44).

## Arguments

- `issue_number` (optional): Specific issue to work on. If omitted, finds the next open issue.

## Feature Branch Strategy

All docs work happens on a feature branch with sub-branches per issue:

```
main
  └── feature/docs-as-code (base branch)
        ├── feature/docs-as-code/issue-34 → PR to feature branch
        ├── feature/docs-as-code/issue-35 → PR to feature branch
        └── ... each issue gets reviewed before merging
```

When the project is complete, `feature/docs-as-code` gets PR'd to `main`.

## Process

### 1. Find the Issue

If no issue number provided, find the next open documentation issue:

```bash
gh issue list --label "documentation" --label "ai:ready" --state open --json number,title --limit 1
```

If an issue number is provided, verify it exists and is open:

```bash
gh issue view $ARGUMENTS
```

### 2. Set Up Branches

Ensure the base feature branch exists:

```bash
# Check if feature branch exists
git fetch origin
if ! git show-ref --verify --quiet refs/heads/feature/docs-as-code; then
  # Create from main
  git checkout main
  git pull origin main
  git checkout -b feature/docs-as-code
  git push -u origin feature/docs-as-code
fi
```

Create a sub-branch for this issue:

```bash
# Checkout and update base feature branch
git checkout feature/docs-as-code
git pull origin feature/docs-as-code

# Create sub-branch
git checkout -b feature/docs-as-code/issue-<number>
```

### 3. Update Issue Status

```bash
gh issue edit <number> --add-label "status:in-progress" --remove-label "status:ready"
```

### 4. Review TSDoc Patterns

Before writing documentation, review these patterns:

**For interfaces/types** (Issues #35):
```typescript
/**
 * Brief description of what this represents.
 *
 * @example
 * ```typescript
 * const example: TypeName = { prop: 'value' };
 * ```
 */
export interface TypeName {
  /** Property description */
  propertyName: Type;
}
```

**For functions** (Issues #36, #37):
```typescript
/**
 * Brief description of what this does.
 *
 * @param paramName - Parameter description
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = functionName(param);
 * ```
 */
export function functionName(paramName: Type): ReturnType
```

**For React hooks** (Issue #38):
```typescript
/**
 * Hook description and purpose.
 *
 * @returns Object with state and methods
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useHookName();
 * ```
 */
export function useHookName() { ... }
```

**For package READMEs** (Issue #40):
```markdown
# Package Name

Brief description of what this package does.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point |

## Development

\`\`\`bash
npm run dev -w @habit-tracker/package-name
\`\`\`

## Architecture

Brief explanation of how it works.
```

### 5. Implement Documentation

Follow TDD approach where applicable:
1. Read the target files listed in the issue
2. Add documentation following the patterns above
3. Ensure all exported items are documented

### 6. Verify Documentation

After making changes, verify the docs generate correctly:

```bash
# Generate docs (after #34 infrastructure is complete)
npm run docs:generate

# Check for warnings
npm run docs:generate 2>&1 | grep -i "warning"

# Preview locally (optional)
npm run docs:dev
```

### 7. Create PR to Feature Branch

When documentation is complete, PR to the **feature branch** (not main):

```bash
git add -A
git commit -m "docs: <description>

Closes #<issue-number>

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin HEAD

# PR targets feature branch, not main!
gh pr create \
  --base feature/docs-as-code \
  --title "Closes #<number>: <description>" \
  --body "## Summary
- <what was documented>

## Verification
- [ ] \`npm run docs:generate\` completes without warnings
- [ ] Generated docs show new descriptions
- [ ] No broken links

## Issue
Closes #<number>

---
*This PR targets \`feature/docs-as-code\`, not \`main\`.*"
```

### 8. After PR Merged

Once the PR is merged to the feature branch:

```bash
# Return to feature branch for next issue
git checkout feature/docs-as-code
git pull origin feature/docs-as-code
```

## Project Completion

When ALL documentation issues (#34-44) are complete:

```bash
# Create final PR from feature branch to main
git checkout feature/docs-as-code
git pull origin feature/docs-as-code

gh pr create \
  --base main \
  --title "Documentation-as-Code: Complete docs overhaul" \
  --body "## Summary
Complete documentation restructuring including:
- VitePress + TypeDoc infrastructure
- TSDoc comments on all exported code
- Package READMEs
- Aggregated documentation website

## Issues Completed
- #34 - VitePress + TypeDoc infrastructure
- #35 - TSDoc for shared types
- #36 - TSDoc for daemon-client and utilities
- #37 - TSDoc for backend REST API
- #38 - TSDoc for frontend hooks/components
- #39 - Docs restructuring (parent)
- #40 - Package READMEs
- #41 - Local domain docs consolidation
- #42 - Replace manual API docs
- #43 - VitePress aggregation
- #44 - Update main README

## Verification
- [ ] \`npm run docs:dev\` serves complete documentation site
- [ ] All packages have READMEs
- [ ] API reference is generated from code
- [ ] No duplicate documentation"
```

## Notes

- **#34 is first**: Sets up infrastructure before other issues can verify docs generation
- **PRs go to feature branch**: Not main! This allows review per issue
- **Keep descriptions concise**: One line for simple properties, full block for complex items
- **Include examples**: At least one `@example` per major interface or function
- **Check dependencies**: Some issues depend on others (see #39 for dependency graph)
