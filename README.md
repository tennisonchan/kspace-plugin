# kspace-plugin

Connect an AI agent — Claude Code, Codex, or any CLI-capable agent — to a [KSpace](https://kspace.studio) for publishing artifacts (documents, plans) for human review. A human reviews at a link (comments, approve / request changes), and the agent polls structured review events to continue the task.

Zero runtime dependencies: `bin/kspace.mjs` only uses Node built-ins and global `fetch`.

## Install as a Claude Code / Codex plugin

```
/plugin marketplace add tennisonchan/kspace-plugin
/plugin install kspace
```

This gives the agent a `kspace` skill and the slash commands `/kspace:login`, `/kspace:publish`, `/kspace:events`, `/kspace:revise`, `/kspace:whoami`, `/kspace:logout` — the agent runs the bundled CLI directly, no separate install step.

## One-command setup

```bash
npx @kspace/plugin setup
```

Installs the Claude Code plugin (when the `claude` CLI is present) and connects the agent — the closest thing to one-click: open the browser when prompted, sign in, confirm the code.

## Install as a standalone CLI

```bash
npm install -g @kspace/plugin
kspace login
```

or run it ad hoc with `npx @kspace/plugin login` (any command works after `npx @kspace/plugin <cmd>`, since the package's only bin is `kspace`).

## Usage

```bash
kspace setup                                  # one-shot: install the Claude Code plugin + connect
kspace login                                  # connect this agent (opens the browser to sign in)
kspace publish doc.md --title "..." --ask "..."  # publish a markdown file, prints the review link
kspace events                                 # comments + decision on the last publish (--id for older)
kspace revise doc.md                          # publish a new version into the same review thread
kspace whoami                                 # show the connected space
kspace logout                                 # forget stored credentials
```

`publish → events → revise` is the whole collaboration loop: humans comment inline and approve or request changes on the review page (and can pull in more reviewers with the page's Share button — recipients read without an account); the agent reads that feedback with `events` and answers with `revise`.

`login` starts a device-authorization flow, like `gh auth login`: it prints a URL and a short confirmation code, opens the browser, and waits (~10 minutes) for the user to sign in and confirm the code on the KSpace side. Once approved, the agent receives a token scoped to that user's space and stores it in `~/.kspace/credentials.json` (mode `0600`).

## Configuration

| Variable | Purpose |
| --- | --- |
| `KSPACE_URL` | Base URL of the KSpace instance to connect to (default `https://app.kspace.studio`) |

## Security notes

- Only enter the confirmation code shown by *your own* `kspace login` run. A code from a link someone else sent you would connect their agent to your space, not yours.
- The connected token is scoped to `artifact:create`, `artifact:version:create`, and `review:event:read` — it cannot read or modify anything else in the space.
- Tokens expire after 1 year; run `kspace login` again to reconnect.

## Development

```bash
npm test   # node:test — arg parsing, credential file permissions
```

## License

MIT
