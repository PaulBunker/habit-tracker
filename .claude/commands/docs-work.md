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
  └── feature/docs-as-code (base)
        ├── feature/docs-as-code/issue-34 → PR to feature branch
        ├── feature/docs-as-code/issue-35 → PR to feature branch
        └── ... each issue reviewed before merging
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

### 4. Review Patterns

Before writing documentation, review the relevant patterns:

**For interfaces/types** (Issue #35):
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

### 6. Build Verification (Catch Issues Early!)

**IMPORTANT**: Verify docs compile BEFORE creating PR. Easier to fix issues now.

```bash
# Generate docs (after #34 infrastructure is complete)
npm run docs:generate

# Check for warnings - these should be fixed!
npm run docs:generate 2>&1 | grep -i "warning"

# Start local docs server
npm run docs:dev
```

### 7. Manual Verification (Required!)

**Actually look at the docs site** to verify:

1. Start the docs server: `npm run docs:dev`
2. Open browser to docs URL (typically http://localhost:5173)
3. Check:
   - [ ] New documentation appears in navigation
   - [ ] Content renders correctly (no broken markdown)
   - [ ] Code examples display properly
   - [ ] Links work (no 404s)
   - [ ] Types/functions show in API reference

**Use the browser tools** to navigate and verify. Don't skip this step - it catches issues that build warnings miss.

If issues found: Fix them now before proceeding to PR.

### 8. Commit Changes

```bash
git add -A
git commit -m "docs: <description>

Closes #<issue-number>

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 9. Create PR to Feature Branch

PR to the **feature branch** (not main):

```bash
git push -u origin HEAD

# PR targets feature branch, not main!
gh pr create \
  --base feature/docs-as-code \
  --title "Closes #<number>: <description>" \
  --body "## Summary
- <what was documented>

## Verification Performed
- [x] \`npm run docs:generate\` completes without warnings
- [x] Manually verified docs render correctly at localhost
- [x] Links and navigation work
- [ ] Code review requested

## Issue
Closes #<number>

---
*This PR targets \`feature/docs-as-code\`, not \`main\`.*"
```

### 10. Update Issue Status

```bash
# Update issue to review status
gh issue edit <number> --add-label "status:review" --remove-label "status:in-progress"
```

### 11. Request Code Review

Spawn the code review skill on the new PR:

```bash
# Get the PR number
gh pr list --head feature/docs-as-code/issue-<number> --json number

# Then run code review
/code-review <pr-number>
```

The code review will:
- Check for CLAUDE.md compliance
- Scan for obvious issues
- Comment on the PR with findings

### 12. Address Review Feedback

If code review finds issues:
1. Fix the issues on the same branch
2. Push fixes: `git push`
3. Re-run verification steps 6-7
4. Comment on PR that issues are addressed

### 13. After PR Merged

Once the PR is approved and merged to the feature branch:

```bash
# Update issue status
gh issue edit <number> --add-label "status:done" --remove-label "status:review"

# Return to feature branch for next issue
git checkout feature/docs-as-code
git pull origin feature/docs-as-code

# Delete the sub-branch locally
git branch -d feature/docs-as-code/issue-<number>
```

### 14. Update Project Board

Verify the issue moved to "Done" on the project board:
- Go to: https://github.com/PaulBunker/habit-tracker/projects
- Check "Documentation-as-Code" project
- Confirm issue shows as complete

---

## Project Completion

When ALL documentation issues (#34-44) are complete:

### Final Verification

Before creating the final PR, do a comprehensive check:

```bash
git checkout feature/docs-as-code
git pull origin feature/docs-as-code

# Full build
npm run docs:build

# Start and manually verify entire site
npm run docs:dev
```

**Manual site review**:
- [ ] Home page renders
- [ ] All guide sections present
- [ ] API reference complete
- [ ] Search works (if configured)
- [ ] Mobile responsive (resize browser)
- [ ] No console errors

### Create Final PR to Main

```bash
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
- [ ] \`npm run docs:build\` succeeds
- [ ] \`npm run docs:dev\` serves complete site
- [ ] All packages have READMEs
- [ ] API reference generated from code
- [ ] No duplicate documentation
- [ ] Final code review completed

Closes #39"
```

### Final Code Review

```bash
# Get PR number and run code review
/code-review <final-pr-number>
```

---

## Notes

- **#34 is first**: Sets up infrastructure before other issues can verify docs generation
- **PRs go to feature branch**: Not main! This allows review per issue
- **Manual verification is required**: Actually look at the docs site
- **Run /code-review**: Don't skip the automated review
- **Update issue status**: Keep the project board accurate
- **Catch issues early**: Verify before PR, not after
- **Check dependencies**: Some issues depend on others (see #39 for dependency graph)
