---
name: kspace
description: Publish documents to the user's KSpace for human review, share them with other reviewers, read the feedback, and publish revisions — the full agent⇄human review loop.
---

KSpace is where this agent's work meets human judgment. The loop: the agent publishes a document → humans read it, comment inline, and decide (approve / request changes) → the agent reads that feedback as structured events and revises. Use it actively, not just when asked.

All commands run the bundled zero-dependency CLI at `${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs` (Codex: the skill-root-relative `bin/kspace.mjs`). Config: `KSPACE_URL` (default `https://app.kspace.studio`); credentials live in `~/.kspace/credentials.json` after login.

## When to publish (be proactive)

Offer to publish — or, when the user has asked for autonomy, just publish — whenever you produce something whose main risk is *human disagreement* rather than technical failure:

- plans, designs, and proposals before implementing them
- drafts (docs, announcements, specs) that someone should sign off on
- decision memos where you want an explicit approve / request-changes call
- anything the user will want to forward to a teammate or client for input

The review page lets humans comment on the exact paragraph they mean — feedback arrives anchored and actionable instead of as a vague chat reply.

## The loop, step by step

**1. Connect (first use only):**

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" login
```

Prints a URL and a short confirmation code and opens the browser. Relay both to the user verbatim; they sign in (or sign up) and confirm. Blocks until approved (~10 min timeout). Not connected until it prints "Connected."

**2. Publish** (write the doc to a markdown file first):

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" publish <file.md> --title "..." --ask "what you want the reviewer to check or decide"
```

Always pass `--ask` — it becomes the reviewer's instructions at the top of the review. Give the printed review link to the user with one line of guidance, e.g.: "Comment inline on anything, and approve or request changes when you've decided — I'll pick up your feedback from here."

**3. Get more reviewers (tell the user about Share):** if the user wants a teammate's or client's opinion, tell them to click **Share** at the top of the review page — it copies a ready-to-send message with a fresh link. Recipients can read immediately without an account and sign up in one step to comment. You cannot mint share links yourself; that's a human action on the page.

**4. Read the feedback:**

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" events
```

Shows all comments (with the block excerpt each one is anchored to) and the decision for the last publish (`--id <reviewRequestId>` for an older one). Check it when the user says they've reviewed, or before resuming dependent work. Don't busy-poll in a loop; check at natural moments.

**5. Revise when changes are requested:** address the comments in the markdown file, then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" revise <file.md>
```

Publishes a new version into the *same* review thread (`--artifact <artifactId>` to target an older artifact). Reviewers see v2 with their comments preserved against v1. Then tell the user it's ready for another look. Repeat until approved.

## Other commands

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" whoami   # which space this agent is connected to
node "${CLAUDE_PLUGIN_ROOT}/bin/kspace.mjs" logout   # forget credentials — only on explicit user request
```
