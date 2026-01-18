---
description: Start working on a GitHub Issue
args: issue_number
---

# Start Task

Begin working on a specific GitHub Issue.

## Arguments

- `issue_number` (required): The GitHub issue number to work on

## Process

1. **Read the issue**:
   ```bash
   gh issue view $ARGUMENTS
   ```

2. **Update status labels**:
   ```bash
   gh issue edit $ARGUMENTS --add-label "status:in-progress" --remove-label "status:ready"
   ```

3. **Create a feature branch**:
   ```bash
   git checkout -b issue-<number>-<short-description>
   ```
   Use a brief, kebab-case description from the issue title.

4. **Analyze the issue**:
   - What files need to change?
   - What's the acceptance criteria?
   - Are there any blockers or questions?

5. **If issue is clear**:
   - Present implementation plan
   - List files to modify
   - Ask for confirmation to proceed

6. **If issue needs clarification**:
   - List specific questions
   - Add comment to issue with questions:
     ```bash
     gh issue comment $ARGUMENTS --body "Questions before proceeding:\n- ..."
     ```
   - Update label:
     ```bash
     gh issue edit $ARGUMENTS --add-label "status:blocked" --remove-label "status:in-progress"
     ```

## Notes

- Always read the full issue before starting
- Check for linked issues or PRs that provide context
- If the issue is too large, suggest using `/breakdown-task` instead
