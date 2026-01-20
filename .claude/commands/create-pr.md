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

3. **Check for doc updates** (optional):
   Run `/docs-check` to identify documentation that may need updates based on the changes.

4. **Push branch**:
   ```bash
   git push -u origin <branch-name>
   ```

5. **Extract issue number** from branch name (e.g., `issue-12-fix-bug` → `12`)

6. **Create PR**:
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

7. **Run code review**: `/code-review <pr_number>`

8. **If issues found - fix and re-review**:
   - Fix the issues identified
   - Commit and push: `git add -A && git commit -m "fix: address code review feedback" && git push`
   - Re-run: `/code-review <pr_number>`
   - **Repeat until no issues found**

9. **Update issue labels** (only after code review passes):
   ```bash
   gh issue edit <number> --add-label "status:review" --remove-label "status:in-progress"
   ```

10. **Report to user**:
    - PR URL
    - Code review result (passed/issues fixed)
    - Issue status update confirmation

## Notes

- PR title should reference the issue number with "Fix #N:" or "Closes #N:"
- The PR body should include "Closes #N" to auto-close the issue on merge
- If tests exist, ensure they pass before creating PR
- **Do NOT merge until code review passes with no issues**
