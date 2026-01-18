---
description: Create a PR for completed work
---

# Create PR

Submit completed work as a pull request linked to the originating issue.

## Process

1. **Check git status**:
   ```bash
   git status
   git log --oneline origin/master..HEAD
   ```
   - Verify current branch (should be `issue-<number>-...`)
   - Check for uncommitted changes
   - Review commits since master

2. **Ensure changes are committed**:
   If there are uncommitted changes, commit them with a descriptive message.

3. **Push branch**:
   ```bash
   git push -u origin <branch-name>
   ```

4. **Extract issue number** from branch name (e.g., `issue-12-fix-bug` → `12`)

5. **Create PR**:
   ```bash
   gh pr create \
     --title "Fix #<number>: <description>" \
     --body "Closes #<number>

   ## Summary
   <1-3 bullet points describing the changes>

   ## Changes
   <list of files/areas modified>

   ## Testing
   <how the changes were tested>
   "
   ```

6. **Update issue labels**:
   ```bash
   gh issue edit <number> --add-label "status:review" --remove-label "status:in-progress"
   ```

7. **Report to user**:
   - PR URL
   - Issue status update confirmation
   - Any CI checks that will run

## Notes

- PR title should reference the issue number with "Fix #N:" or "Closes #N:"
- The PR body should include "Closes #N" to auto-close the issue on merge
- If tests exist, ensure they pass before creating PR
