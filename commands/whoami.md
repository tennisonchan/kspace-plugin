---
description: Show which KSpace this agent is connected to
argument-hint: ''
allowed-tools: Bash(node:*)
---

If `CLAUDE_PLUGIN_ROOT` is available, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" whoami
```

In Codex, first read `skills/kspace/SKILL.md`, then run the equivalent command using that skill's root-relative path.
