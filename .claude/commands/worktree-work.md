---
description: Work on an issue in an isolated worktree
args: issue_number
---

# Worktree Workflow

Isolated parallel development using git worktrees. Enables multiple Claude sessions to work on different issues simultaneously without conflicts.

## Arguments

- `issue_number` (required): The GitHub issue number to work on

## Phase 1: Setup Worktree

1. **Validate the issue exists**:
   ```bash
   gh issue view $ARGUMENTS --json title,number,state
   ```
   Extract the title for branch naming.

2. **Generate branch/worktree name**:
   Format: `issue-<number>-<slug>` where slug is 2-4 words from the title in kebab-case.
   Example: `issue-28-favicon-colors`

3. **Check for existing worktree**:
   ```bash
   git worktree list | grep "issue-$ARGUMENTS"
   ```
   If exists, report its location and skip creation.

4. **Create the worktree**:
   ```bash
   git worktree add ../habit-tracker-worktrees/issue-<number>-<slug> -b issue-<number>-<slug>
   ```
   Creates both the worktree directory and branch.

5. **Setup the environment**:
   ```bash
   cd ../habit-tracker-worktrees/issue-<number>-<slug>
   ```
   Then follow CLAUDE.md for:
   - Installing dependencies
   - Build order (check "Build & Development Commands" and "Common Issues" sections)

6. **Configure ports** (to avoid conflicts with main workspace):
   Create `.env.local` in the worktree root:
   ```bash
   cat > .env.local << 'EOF'
   PORT=3002
   VITE_PORT=5175
   VITE_API_URL=http://localhost:3002
   EOF
   ```

   For additional worktrees, increment ports (3003/5176, 3004/5177, etc.).

7. **Output instructions to user**:
   ```
   Worktree created at: ../habit-tracker-worktrees/issue-<number>-<slug>

   To start working:
   1. Open a new terminal
   2. cd <full-path-to-worktree>
   3. Run: claude
   4. In that session: /start-task <issue_number>

   Dev server: npm run dev (ports 3002/5175)
   ```

## Phase 2: Working in the Worktree

Once in the worktree with a new Claude session:

1. **Start the task**: Run `/start-task <issue_number>`
   - This updates labels, analyzes the issue, creates implementation plan

2. **Follow TDD approach** per CLAUDE.md:
   - Write failing tests first
   - Implement to make tests pass
   - Refactor while keeping tests green

3. **Commit changes regularly** with descriptive messages

4. **Run tests before finalizing**:
   ```bash
   npm test
   npm run lint
   ```

## Phase 3: Create PR

1. **Create the PR**: Run `/create-pr`
   - Pushes branch, creates PR linked to issue
   - Updates issue labels to `status:review`

2. **Request code review** (optional): Run `/code-review <pr_number>`
   - Gets AI code review of the PR changes

3. **Address feedback**, commit fixes, push updates

## Phase 4: Cleanup (After PR Merged)

Run these commands from the **main workspace** (not the worktree):

1. **Fetch latest and verify merge**:
   ```bash
   git fetch origin
   git log --oneline origin/master | head -5
   ```

2. **Update issue status**:
   ```bash
   gh issue edit <number> --add-label "status:done" --remove-label "status:review"
   ```

3. **Remove the worktree**:
   ```bash
   git worktree remove ../habit-tracker-worktrees/issue-<number>-<slug>
   ```

4. **Delete the branch** (if fully merged):
   ```bash
   git branch -d issue-<number>-<slug>
   ```

5. **Confirm cleanup**:
   ```bash
   git worktree list
   ```
   Should show only the main worktree.

## Integration with Existing Skills

| Skill | When to Use |
|-------|-------------|
| `/start-task` | Run inside worktree to begin work |
| `/create-pr` | Create PR from worktree branch |
| `/code-review` | Review the PR (requires code-review skill) |
| `/check-tasks` | Find available issues before starting |
| `/docs-check` | Check if docs need updates |

## Important Notes

### Dependencies & Build
Each worktree needs its own dependency installation and build. Refer to CLAUDE.md sections:
- "Build & Development Commands" for install/build steps
- "Common Issues" for build order requirements

### Port Conflicts
Default dev ports (3001/5174) will conflict if running multiple workspaces. Use `.env.local` overrides:
- Worktree 1: 3002/5175
- Worktree 2: 3003/5176
- etc.

### Database Isolation
Dev mode uses a relative database path (`./packages/backend/data/dev/`), so each worktree has its own isolated database.

### New Claude Session Required
Worktrees are separate directories. You must:
1. `cd` to the worktree directory
2. Start a fresh `claude` session
3. That session's context will be the worktree

### Worktree Location
All worktrees are created in `../habit-tracker-worktrees/` relative to the main repo. This keeps them siblings to the main workspace for easy navigation.
