---
description: Work on an issue in an isolated worktree
args: issue_number
---

# Worktree Work

Autonomous workflow: creates an isolated worktree, spawns an agent to implement the issue, creates PR, runs code review, and cleans up.

## Phase 1: Setup

### 1.1 Validate and fetch issue details

```bash
gh issue view $ARGUMENTS --json title,number,state,labels
```

Extract:
- `title` - for branch name slug (2-4 words, kebab-case)
- `labels` - to detect workflow type (documentation vs general)

### 1.2 Check for existing worktree

```bash
git worktree list | grep "issue-$ARGUMENTS"
```

If exists, report location and skip to Phase 2 using existing worktree path.

### 1.3 Create worktree

Branch format: `issue-<number>-<slug>`

```bash
mkdir -p ../habit-tracker-worktrees
git worktree add ../habit-tracker-worktrees/issue-<number>-<slug> -b issue-<number>-<slug>
```

### 1.4 Verify creation

```bash
git worktree list
```

Must show the new worktree. If not, debug and retry.

### 1.5 Configure ports

Determine next available ports by checking existing `.env.local` files:
- Base: 3002/5175
- Each additional worktree: increment by 1

```bash
cat > ../habit-tracker-worktrees/issue-<number>-<slug>/.env.local << 'EOF'
PORT=<next_port>
VITE_PORT=<next_vite_port>
VITE_API_URL=http://localhost:<next_port>
EOF
```

### 1.6 Capture worktree absolute path

Store the full absolute path for the agent (e.g., `/Users/paulbunker/habit-tracker-worktrees/issue-28-favicon-colors`).

---

## Phase 2: Spawn Implementation Agent

Use the **Task tool** to spawn a `general-purpose` agent with this prompt:

```
You are working on GitHub issue #<number> in an isolated worktree.

WORKTREE PATH: <absolute_path>
ISSUE: #<number> - <title>
WORKFLOW TYPE: <"documentation" if has documentation label, else "general">

## Setup (run first)

cd <absolute_path>
npm install
npm run build

## Workflow

1. **Update issue status**:
   gh issue edit <number> --add-label "status:in-progress" --remove-label "status:ready"

2. **Analyze the issue**:
   - Read the full issue: gh issue view <number>
   - Identify files to modify (use absolute paths: <absolute_path>/packages/...)
   - Determine acceptance criteria

3. **Implement with TDD**:
   - Write failing tests first
   - Implement to make tests pass
   - Run: cd <absolute_path> && npm test
   - Run: cd <absolute_path> && npm run lint

4. **Commit changes**:
   cd <absolute_path>
   git add -A
   git commit -m "<type>(<scope>): <description>

   Closes #<number>

   Co-Authored-By: Claude <noreply@anthropic.com>"

5. **Create PR**:
   cd <absolute_path>
   git push -u origin HEAD
   gh pr create --title "<type>(<scope>): <description>" --body "## Summary
   <bullet points>

   ## Test plan
   <verification steps>

   Closes #<number>

   🤖 Generated with Claude Code"

6. **Return the PR URL** when complete, or return error details if blocked.

## Error Handling

If any step fails:
- **npm install/build fails**: Check for missing dependencies, run `npm run build -w @habit-tracker/shared` first
- **Tests fail**: Fix the failing tests before proceeding. Do not skip tests.
- **Lint fails**: Fix lint errors. Do not use eslint-disable without justification.
- **PR creation fails**: Check if branch was pushed, verify gh auth status
- **Blocked by unclear requirements**: Return with specific questions for the user

If unrecoverable, return:
- What was completed
- What failed and why
- Suggested next steps

## Important

- Use ABSOLUTE PATHS for all file operations: <absolute_path>/packages/...
- Run all bash commands with cd <absolute_path> prefix
- Follow CLAUDE.md conventions in the worktree
```

Run the agent and wait for it to return the PR URL (or error details).

---

## Phase 3: Code Review Loop

After the agent returns with PR URL:

1. Extract PR number from URL
2. Run `/code-review <pr_number>`

### If issues found:

1. **Fix the issues** in the worktree:
   ```bash
   cd <worktree_path>
   # Make fixes
   git add -A
   git commit -m "fix: address code review feedback"
   git push
   ```

2. **Re-run code review**: `/code-review <pr_number>`

3. **Repeat until no issues found** - do NOT merge until code review passes

### If no issues found:

Proceed to Phase 4.

---

## Phase 4: Update Status

After PR is created and reviewed, update issue labels:

```bash
gh issue edit $ARGUMENTS --add-label "status:review" --remove-label "status:in-progress"
```

**Do NOT remove the worktree yet.** Keep it for addressing review feedback.

---

## Output

Report to user:
- PR URL
- Code review summary
- Any issues or blockers found
- Worktree location (for follow-up work)

---

## Reference: Cleanup (After PR Merged)

Run from the **main workspace** after the PR is merged:

### Remove worktree

```bash
git worktree remove ../habit-tracker-worktrees/issue-<number>-<slug>
```

### Delete local branch

```bash
git branch -d issue-<number>-<slug>
```

### Update issue status

```bash
gh issue edit <number> --add-label "status:done" --remove-label "status:review"
```

### Verify cleanup

```bash
git worktree list
```

Should show only the main worktree.
