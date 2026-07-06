---
description: Publish a new version of a document into the same review thread
argument-hint: '<file.md> [--artifact <artifactId>]'
allowed-tools: Bash(node:*)
---

Publish a revised markdown file as a new version of the last published artifact (or an explicit one). Reviewers see the new version in the same thread; their comments stay pinned to the version they were made on.

Raw slash-command arguments:
`$ARGUMENTS`

If `CLAUDE_PLUGIN_ROOT` is available, run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" revise $ARGUMENTS
```

In Codex, first read `skills/kspace/SKILL.md`, then run the equivalent command using that skill's root-relative path.

Print the returned review link and tell the user the revision is ready for another look.
