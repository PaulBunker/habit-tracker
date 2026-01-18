---
description: Migrate feature requests from docs to GitHub Issues
---

# Migrate Issues

Port items from `docs/planning/feature-requests.md` to GitHub Issues.

## Process

1. **Read the feature requests file**:
   ```
   docs/planning/feature-requests.md
   ```

2. **Parse items by status**:
   | Doc Status | GitHub Labels |
   |------------|---------------|
   | 🟢 Planned | `status:ready`, `priority:high` |
   | 🟡 Under Consideration | `status:ready`, `priority:medium` |
   | 🔵 Nice to Have | `status:ready`, `priority:low` |
   | ⚪ Deferred | Skip or `priority:low`, `status:blocked` |
   | ✅ Complete | Skip (already done) |

3. **Map item type to labels**:
   - Features → `type:feature`
   - Technical Debt → `type:refactor`
   - Bug fixes → `type:bug`

4. **Present migration plan**:
   - List items to migrate with proposed labels
   - Skip completed items
   - Ask user to confirm or adjust

5. **With approval, create issues**:
   ```bash
   gh issue create \
     --title "<item title>" \
     --body "Migrated from docs/planning/feature-requests.md

   ## Description
   <description from doc>

   ## Requirements
   <requirements if listed>

   ## Priority
   <effort/priority notes>
   " \
     --label "<labels>"
   ```

6. **After migration**:
   - Add comment to feature-requests.md noting migration date
   - Optionally archive completed sections

## Example

From doc:
```
#### 1. Habit Streaks 🟢
**Priority**: High
**Effort**: Medium
**Description**: Track consecutive days of habit completion
```

Creates:
```bash
gh issue create \
  --title "Habit Streaks" \
  --body "..." \
  --label "type:feature,priority:high,status:ready,ai:ready"
```

## Notes

- Run incrementally (one section at a time) to avoid rate limits
- Review each issue before creation
- Keep feature-requests.md as historical reference
