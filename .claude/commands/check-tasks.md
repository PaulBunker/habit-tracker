---
description: Check GitHub Issues for available tasks
---

# Check Tasks

Review GitHub Issues to find work ready for AI assistance.

## Process

1. **List AI-ready issues first**:
   ```bash
   gh issue list --label "ai:ready" --label "status:ready" --json number,title,labels
   ```

2. **If none found, list all open issues**:
   ```bash
   gh issue list --state open --json number,title,labels,createdAt
   ```

3. **Prioritize by**:
   - `priority:high` first
   - Then by type (bugs before features)
   - Then by age (oldest first)

4. **Present summary**:
   - Count of available tasks
   - List with number, title, and key labels
   - Recommendation for which to tackle first

5. **Ask**: "Would you like me to start on any of these? Use `/start-task <number>` to begin."

## Notes

- Issues labeled `ai:needs-breakdown` should be split first using `/breakdown-task`
- Issues labeled `status:in-progress` are already being worked on
- Issues labeled `status:blocked` are waiting on external input
