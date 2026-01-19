---
description: Work on the next Documentation-as-Code issue
---

# Documentation Work

Work on documentation issues from the Documentation-as-Code project (#34-38).

## Arguments

- `issue_number` (optional): Specific issue to work on. If omitted, finds the next open issue.

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

### 2. Start Work

Update issue status and create a branch:

```bash
# Add in-progress label
gh issue edit <number> --add-label "status:in-progress" --remove-label "status:ready"

# Create branch
git checkout -b docs/issue-<number>-<short-description>
```

### 3. Review TSDoc Patterns

Before writing documentation, review these patterns:

**For interfaces/types** (Issues #34, #35):
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

### 4. Implement Documentation

Follow TDD approach:
1. Read the target files listed in the issue
2. Add TSDoc comments following the patterns above
3. Ensure all exported items are documented

### 5. Verify Documentation

After making changes, verify the docs generate correctly:

```bash
# Generate docs (after Phase 1 infrastructure is complete)
npm run docs:generate

# Check for warnings
npm run docs:generate 2>&1 | grep -i "warning"

# Preview locally (optional)
npm run docs:dev
```

### 6. Create PR

When documentation is complete:

```bash
git add -A
git commit -m "docs: <description>

Closes #<issue-number>

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin HEAD

gh pr create --title "Closes #<number>: <description>" --body "## Summary
- Added TSDoc comments to <files>

## Verification
- [ ] \`npm run docs:generate\` completes without warnings
- [ ] Generated docs show new descriptions

Closes #<number>"
```

## Notes

- **Phase 1 (#34) is special**: It sets up infrastructure. No docs to generate yet.
- **Phases 2-5 (#35-38)**: Add TSDoc to existing code, then verify with doc generation.
- **Keep descriptions concise**: One line for simple properties, full block for complex items.
- **Include examples**: At least one `@example` per major interface or function.
