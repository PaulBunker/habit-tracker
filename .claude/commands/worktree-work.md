---
description: Work on an issue in an isolated worktree
args: issue_number
---

# Worktree Workflow

**PURPOSE**: Create an isolated worktree for parallel development on GitHub issue #$ARGUMENTS.

---

## STEP 1: Validate Issue [EXECUTE NOW]

Run this command to get the issue details:

```bash
gh issue view $ARGUMENTS --json title,number,state
```

**If the command fails**: Stop and tell the user the issue doesn't exist.

**If successful**: Extract the title and proceed.

---

## STEP 2: Generate Branch Name [EXECUTE NOW]

Create a slug from the issue title:
- Take 2-4 key words from the title
- Convert to lowercase kebab-case
- Format: `issue-$ARGUMENTS-<slug>`

**Examples**:
- "Add environment-specific favicons" → `issue-28-favicon-colors`
- "Fix authentication redirect bug" → `issue-42-auth-redirect-bug`
- "Update API documentation for v2" → `issue-15-api-docs-v2`

---

## STEP 3: Check for Existing Worktree [EXECUTE NOW]

```bash
git worktree list | grep "issue-$ARGUMENTS"
```

**If a worktree already exists**: Report its path and STOP here. Tell the user to `cd` to that path and run `claude`.

**If no worktree exists**: Proceed to Step 4.

---

## STEP 4: Create the Worktree [EXECUTE NOW - CRITICAL]

⚠️ **YOU MUST RUN THIS COMMAND** - do not skip or describe it:

```bash
git worktree add ../habit-tracker-worktrees/issue-<NUMBER>-<SLUG> -b issue-<NUMBER>-<SLUG>
```

Replace `<NUMBER>` and `<SLUG>` with actual values from Steps 1-2.

---

## STEP 5: Verify Creation [EXECUTE NOW]

Run this command to confirm the worktree was created:

```bash
git worktree list
```

**Expected output**: Should show the new worktree path.

**If verification fails**:
1. Check if the parent directory exists: `ls -la ../`
2. Try creating it: `mkdir -p ../habit-tracker-worktrees`
3. Retry Step 4

---

## STEP 6: Configure Ports [EXECUTE NOW]

Create `.env.local` in the worktree to avoid port conflicts:

```bash
cat > ../habit-tracker-worktrees/issue-<NUMBER>-<SLUG>/.env.local << 'EOF'
PORT=3002
VITE_PORT=5175
VITE_API_URL=http://localhost:3002
EOF
```

For additional worktrees, increment: 3003/5176, 3004/5177, etc.

---

## STEP 7: Output Instructions and STOP [FINAL STEP]

Print these instructions to the user, then **STOP EXECUTION**:

```
✅ Worktree created successfully!

📁 Location: ../habit-tracker-worktrees/issue-<NUMBER>-<SLUG>
🌿 Branch: issue-<NUMBER>-<SLUG>

TO START WORKING:
1. Open a NEW terminal window
2. Run: cd <FULL_PATH_TO_WORKTREE>
3. Run: npm install && npm run build
4. Run: claude
5. In the new Claude session, run: /start-task $ARGUMENTS

⚠️  Do NOT continue working in this session.
    The new worktree needs its own Claude session with fresh context.
```

**Replace placeholders** with actual values before outputting.

---

## Reference: Cleanup (After PR Merged)

Run from the **main workspace** after the PR is merged:

```bash
# Remove worktree
git worktree remove ../habit-tracker-worktrees/issue-<NUMBER>-<SLUG>

# Delete branch (if fully merged)
git branch -d issue-<NUMBER>-<SLUG>

# Verify cleanup
git worktree list
```

---

## Reference: Related Skills

| Skill | Use In New Session |
|-------|-------------------|
| `/start-task $ARGUMENTS` | Begin work on the issue |
| `/create-pr` | Create PR when work is complete |
| `/code-review <pr>` | Review the PR |
