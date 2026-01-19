---
description: Create a new GitHub Issue with exploration and planning
args: problem_description
---

# Create Issue

Intelligently create a GitHub issue by exploring the problem, validating it's worth tracking, and adding appropriate context and labels.

## Arguments

- `problem_description` (required): Description of the bug, feature, or documentation need

## Process

### 1. Explore the Problem

Before creating the issue, investigate the codebase to understand the problem:

- Search for relevant code, configuration, and tests
- Identify potential root causes or affected areas
- Note any related patterns or existing implementations
- Check if there's already code addressing this (maybe partially)

### 2. Check for Duplicates

```bash
gh issue list --state all --search "$ARGUMENTS"
```

If similar issues exist, report them instead of creating a duplicate.

### 3. Validate Issue Criteria

Determine:
- **Type**: Is it a bug, feature request, documentation need, or question?
- **Actionable**: Is there enough information to act on it?
- **Scope**: Is it a single issue or should it be broken down?

If the problem is unclear or too vague, ask clarifying questions before proceeding.

### 4. Create High-Level Plan

Based on exploration findings:
- If fix is clear: outline implementation steps
- If unclear: outline investigation steps needed
- Identify files likely to be affected

### 5. Determine Labels

**Type labels** (pick one):
- `bug` - Something isn't working as expected
- `enhancement` - New feature or improvement
- `documentation` - Documentation improvements
- `question` - Needs clarification or discussion

**Priority labels** (pick one based on impact):
- `priority:high` - Affects core functionality, blocks users
- `priority:medium` - Important but has workarounds
- `priority:low` - Nice to have, minor inconvenience

**AI labels** (pick one):
- `ai:ready` - Clear enough for AI to implement directly
- `ai:needs-breakdown` - Too large, needs to be split into sub-tasks

**Status label**:
- `status:ready` - Ready to be worked on

### 6. Create the Issue

```bash
gh issue create \
  --title "<concise, descriptive title>" \
  --body "## Problem Description
<User's original problem description>

## Investigation Findings
<What was discovered during codebase exploration>
<Relevant files, configurations, or code patterns found>

## Proposed Approach
<High-level plan to fix or investigate>

### Files to create/modify:
- `path/to/file.ts` (new or modify)

<If creating directory structures, use a code block:>
\`\`\`
packages/example/
├── config.ts
├── index.ts
└── utils/
\`\`\`

<If adding scripts to package.json, show them:>
\`\`\`json
{
  \"scripts\": {
    \"example\": \"command here\"
  }
}
\`\`\`

## Acceptance Criteria
- [ ] <How we'll know it's resolved>
- [ ] <Additional criteria if needed>
" \
  --label "<type>,<priority>,<ai-label>,status:ready"
```

### 7. Return Results

Report:
- The issue URL
- Summary of what was found during exploration
- The labels applied and why

## Guidelines

- **Be thorough in exploration**: The more context you add, the easier the issue is to work on
- **Be concise in the title**: Aim for under 60 characters
- **Be specific in acceptance criteria**: Make it testable
- **Prefer `ai:ready`**: Only use `ai:needs-breakdown` if truly too large
- **Ask before creating**: If uncertain about anything, clarify first
- **Use code blocks for scannability**: When creating new directories, adding scripts, or showing config snippets, use fenced code blocks - they're easier to read than prose

## Example

**Input**: `/create-issue "test items appearing in deployed version"`

**Exploration would check**:
- Environment configuration (.env files)
- Database seeding/migration code
- Production vs development environment separation
- Any test data initialization code

**Resulting issue might be**:
- Title: "Remove test data from production database"
- Labels: `bug`, `priority:high`, `ai:ready`, `status:ready`
- Body includes findings about where test data originates
