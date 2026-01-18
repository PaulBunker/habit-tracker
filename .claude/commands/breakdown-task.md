---
description: Break down a large issue into sub-tasks
args: issue_number
---

# Breakdown Task

Split a large or complex issue into smaller, AI-solvable sub-tasks.

## Arguments

- `issue_number` (required): The GitHub issue number to break down

## Process

1. **Read the issue**:
   ```bash
   gh issue view $ARGUMENTS
   ```

2. **Analyze scope**:
   - How many files are affected?
   - How many distinct changes are needed?
   - What are the dependencies between changes?
   - Can changes be made independently?

3. **Propose breakdown**:
   Present a list of sub-tasks where each:
   - Is a single, focused change
   - Can be completed independently (or has clear dependencies)
   - Has clear acceptance criteria
   - Is small enough to be AI-ready

4. **With user approval, create sub-issues**:
   ```bash
   gh issue create \
     --title "[Sub-task] <description>" \
     --body "Parent issue: #<parent-number>

   ## Task
   <specific task description>

   ## Acceptance Criteria
   - [ ] <criterion 1>
   - [ ] <criterion 2>

   ## Files Likely Affected
   - <file1>
   - <file2>
   " \
     --label "ai:ready" \
     --label "status:ready"
   ```

5. **Update parent issue**:
   ```bash
   gh issue comment <parent-number> --body "Broken down into sub-tasks:
   - #<sub1>
   - #<sub2>
   - #<sub3>

   Complete sub-tasks in order, then close this parent issue."
   ```

   ```bash
   gh issue edit <parent-number> --remove-label "ai:needs-breakdown"
   ```

## Guidelines for Good Sub-tasks

- **Single responsibility**: Each sub-task does one thing
- **Testable**: Clear way to verify completion
- **Independent**: Minimal dependencies on other sub-tasks
- **Small**: Can be completed in one focused session
- **Ordered**: If dependencies exist, number them clearly

## Example Breakdown

Parent: "Add user authentication"

Sub-tasks:
1. Add user schema and database migration
2. Create registration endpoint
3. Create login endpoint with JWT
4. Add auth middleware
5. Protect existing routes
6. Add frontend login form
7. Add frontend auth state management
