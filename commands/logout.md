---
description: Disconnect this agent from KSpace (deletes stored credentials)
argument-hint: ''
allowed-tools: Bash(node:*)
---

Only run this when the user explicitly asks to disconnect the agent — it deletes stored credentials.

If `CLAUDE_PLUGIN_ROOT` is available, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" logout
```

In Codex, first read `skills/kspace/SKILL.md`, then run the equivalent command using that skill's root-relative path.
