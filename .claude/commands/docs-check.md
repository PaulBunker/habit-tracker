---
description: Check docs for needed updates (uses Haiku)
---

Spawn a Haiku agent to scan documentation and identify sections related to current work.

## Process

1. Summarize what changed or is being worked on

2. Spawn agent:
   ```
   Task(
     subagent_type: "Explore",
     model: "haiku",
     prompt: "Scan README.md, CLAUDE.md, and docs/ for content related to: <context>

     Return: relevant files/sections that may need updates. Be brief."
   )
   ```

3. Use findings as needed (update docs, note in issues, include in plans)
