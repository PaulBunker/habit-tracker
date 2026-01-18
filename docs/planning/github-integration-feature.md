# GitHub Integration Feature Plan

## Summary

Enable AI-driven development workflows using GitHub as the task management system. GitHub Issues become the source of truth for work to be done, and Claude Code skills define processes for efficiently splitting and solving tasks.

**Core Idea**: GitHub Issues → AI reads tasks → Skills define processes → Work gets done reliably

---

## Implementation Status

| Phase | Goal | Status |
|-------|------|--------|
| 1a | Create Repository | ✅ Complete |
| 1b | CLI Tools | ✅ Complete |
| 1c | Evaluate CI/CD | Deferred |
| 2 | Process Skills | ✅ Complete |

**Repository**: https://github.com/PaulBunker/habit-tracker (private)

---

## Label System

```
# Priority
priority:high
priority:medium
priority:low

# Type
type:bug
type:feature
type:docs
type:refactor

# Status
status:ready          # Ready to be picked up
status:in-progress    # Being worked on
status:blocked        # Waiting on something
status:review         # PR submitted, needs review

# AI-specific
ai:ready              # Well-defined enough for AI to tackle
ai:needs-breakdown    # Too large, needs sub-tasks
```

---

## Skills

### /check-tasks
Check GitHub Issues for available tasks. Lists issues ready for AI work, prioritized by urgency.

### /start-task \<number\>
Begin working on a specific issue. Creates a branch, updates issue status, and analyzes requirements.

### /create-pr
Submit completed work as a pull request. Links to the issue, updates status labels.

### /breakdown-task \<number\>
Split a large issue into smaller, AI-solvable sub-tasks.

---

## Workflow Example

```
User: /check-tasks
Claude: Found 3 tasks ready for AI:
  #12 [priority:high] Fix timezone bug in habit completion
  #15 [priority:medium] Add loading spinner to dashboard
  #18 [priority:low] Update README with new commands

Recommend starting with #12 (high priority bug).

User: /start-task 12
Claude: Reading issue #12...
  - Bug: habits marked complete in wrong timezone
  - Affects: packages/backend/src/services/habit-service.ts
  - Acceptance: tests pass for UTC+5 and UTC-5

Creating branch: issue-12-timezone-fix
Updating issue status to "in-progress"

Here's my plan:
1. Add timezone parameter to markComplete()
2. Write test cases for edge timezones
3. Fix the date comparison logic

Proceed?

User: yes
Claude: [implements fix]

User: /create-pr
Claude: Created PR #23: "Fix #12: Handle timezone in habit completion"
  - Links to issue #12
  - Updated issue status to "review"
  - PR URL: https://github.com/...
```

---

## gh CLI Quick Reference

```bash
# Issues (read)
gh issue list                           # List open issues
gh issue list --label "priority:high"   # Filter by label
gh issue view <number>                  # View details

# Issues (write)
gh issue create --title "..." --body "..."
gh issue edit <number> --add-label "..."
gh issue close <number>

# PRs
gh pr list
gh pr create
gh pr view <number>
gh pr checks <number>                   # CI status
```

---

## Future Considerations

1. **CI/CD**: Add GitHub Actions when test suite is stable and regressions become a concern
2. **Issue Templates**: Add structured templates for bugs/features
3. **Notifications**: Configure GitHub notifications or rely on /check-tasks
