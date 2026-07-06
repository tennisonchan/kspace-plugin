---
description: Show comments and the decision on the last published review
argument-hint: '[--id <reviewRequestId>]'
allowed-tools: Bash(node:*)
---

Read review feedback (comments and approve/request-changes decision) for the last publish, or an explicit review request.

Raw slash-command arguments:
`$ARGUMENTS`

If `CLAUDE_PLUGIN_ROOT` is available, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" events $ARGUMENTS
```

In Codex, first read `skills/kspace/SKILL.md`, then run the equivalent command using that skill's root-relative path.

Summarize the feedback for the user. If changes were requested, offer to revise and republish with `/kspace:revise`.
