---
name: kspace
description: Connect this agent to a user's KSpace and publish documents for human review (comments, approve / request changes).
---

Use this when the user asks to publish a plan, document, or artifact for human review, or asks to connect this agent to KSpace.

KSpace review loop: the agent publishes a document, a human reviews it at a link (comments, approve or request changes), and the agent can poll review events to continue the task. Everything happens through the `kspace` CLI at `${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs` (Codex: the skill-root-relative `bin/kspace.mjs`) — no npm install required, it is a zero-dependency Node script.

Config: `KSPACE_URL` (default `https://app.kspace.studio`). Credentials are stored in `~/.kspace/credentials.json` once connected.

## First use / not connected yet

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" login
```

This prints a URL and a short confirmation code, and tries to open the browser. Relay both to the user verbatim — they sign in or sign up on that page and confirm the code. The command blocks until they approve (or the code expires in ~10 minutes); do not consider the agent connected until it prints "Connected."

## Publishing a document for review

Requires a prior successful `login`. Write the document to a markdown file, then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" publish <file.md> --title "..." --ask "what to check"
```

`--title` and `--ask` (reviewer instructions) are optional. Prints the review link — share it with the user.

## Checking connection status

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" whoami
```

## Disconnecting

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" logout
```

Only run this when the user explicitly asks to disconnect — it deletes the stored credentials.
