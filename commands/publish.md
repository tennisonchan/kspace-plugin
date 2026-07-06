---
description: Publish a markdown document to KSpace for human review
argument-hint: '<file.md> [--title "..."] [--ask "..."]'
allowed-tools: Bash(node:*)
---

Publish a markdown file for human review. Requires a prior successful `/kspace:login`.

Raw slash-command arguments:
`$ARGUMENTS`

If `CLAUDE_PLUGIN_ROOT` is available, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" publish $ARGUMENTS
```

In Codex, first read `skills/kspace/SKILL.md`, then run the equivalent command using that skill's root-relative path.

Print the returned review link for the user.
