---
description: Connect this agent to a user's KSpace (device-authorization login)
argument-hint: ''
allowed-tools: Bash(node:*)
---

Connect this agent to the user's KSpace. If `CLAUDE_PLUGIN_ROOT` is available, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" login
```

In Codex, first read `skills/kspace/SKILL.md`, then run the equivalent command using that skill's root-relative path.

Relay the printed URL and confirmation code to the user verbatim and wait for the command to print "Connected." before treating the agent as connected.
