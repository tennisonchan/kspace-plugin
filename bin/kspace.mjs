#!/usr/bin/env node
// KSpace agent plugin — connect an agent to a user's KSpace and publish
// documents for review. Zero dependencies (Node 18+ built-ins only).
//
//   kspace login              Connect this agent (opens the browser to sign in)
//   kspace publish <file.md>  Publish a markdown file and print the review link
//     [--title "..."] [--ask "..."]  Optional title and reviewer instructions
//   kspace events             Show comments and the decision on the last publish
//     [--id <reviewRequestId>]        Or an explicit review request
//   kspace revise <file.md>   Publish a new version into the same review thread
//     [--artifact <artifactId>]       Defaults to the last published artifact
//   kspace setup              One-shot: install the Claude Code plugin (if the
//                             `claude` CLI is present) and connect this agent
//   kspace whoami             Show the connected space
//   kspace logout             Forget stored credentials
//
// Config: KSPACE_URL (default https://app.kspace.studio). Credentials are
// stored in ~/.kspace/credentials.json; the last publish in ~/.kspace/last.json.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const BASE_URL = (process.env.KSPACE_URL || "https://app.kspace.studio").replace(/\/$/, "");
export const CRED_DIR = path.join(os.homedir(), ".kspace");
export const CRED_FILE = path.join(CRED_DIR, "credentials.json");
export const LAST_FILE = path.join(CRED_DIR, "last.json");

export function readCreds() {
  try {
    return JSON.parse(fs.readFileSync(CRED_FILE, "utf8"));
  } catch {
    return null;
  }
}
export function writeCreds(creds) {
  fs.mkdirSync(CRED_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CRED_FILE, JSON.stringify(creds, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(CRED_FILE, 0o600); // tighten even if the file pre-existed
  } catch {
    /* best effort */
  }
}
export function readLast() {
  try {
    return JSON.parse(fs.readFileSync(LAST_FILE, "utf8"));
  } catch {
    return null;
  }
}
export function writeLast(last) {
  fs.mkdirSync(CRED_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(LAST_FILE, JSON.stringify(last, null, 2), { mode: 0o600 });
}
function die(msg) {
  console.error(msg);
  process.exit(1);
}
async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `request failed: ${res.status}`);
  return data;
}
function openBrowser(url) {
  // No shell: the URL is passed as an argv entry so shell metacharacters can't
  // be reinterpreted. On Windows, cmd's `start` needs an (empty) title arg.
  const [cmd, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  } catch {
    /* fall back to the printed URL */
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login() {
  const start = await api("/v1/plugin/auth/start", { method: "POST" });
  console.log("\n  Connect this agent to your KSpace:\n");
  console.log(`    1. Open:  ${start.verificationUrlComplete}`);
  console.log(`    2. Confirm the code:  ${start.userCode}\n`);
  openBrowser(start.verificationUrlComplete);

  const deadline = Date.now() + start.expiresIn * 1000;
  process.stdout.write("  Waiting for approval");
  while (Date.now() < deadline) {
    await sleep(start.interval * 1000);
    process.stdout.write(".");
    const poll = await api("/v1/plugin/auth/poll", { method: "POST", body: { deviceCode: start.deviceCode } });
    if (poll.status === "approved") {
      writeCreds({ url: BASE_URL, token: poll.token, workspaceId: poll.workspaceId });
      console.log("\n\n  ✓ Connected. This agent can now publish reviews.\n");
      return;
    }
    if (poll.status === "expired") die("\n\n  The connection request expired. Run `kspace login` again.");
  }
  die("\n\n  Timed out waiting for approval. Run `kspace login` again.");
}

export function parseArgs(args) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) die(`  Missing value for ${a}`);
      flags[a.slice(2)] = value;
      i++; // skip the value so it isn't treated as the file
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

async function publish(args) {
  const creds = readCreds();
  if (!creds?.token) die("  Not connected. Run `kspace login` first.");
  const { flags, positionals } = parseArgs(args);
  if (positionals.length !== 1) {
    die('  Usage: kspace publish <file.md> [--title "..."] [--ask "..."]');
  }
  const file = positionals[0];
  const body = fs.readFileSync(file, "utf8");
  const title = flags.title || path.basename(file).replace(/\.[^.]+$/, "");
  const ask = flags.ask;
  const result = await api("/v1/artifacts", {
    method: "POST",
    token: creds.token,
    body: {
      artifact: { type: "document", title, contentType: "text/markdown", body },
      review: {
        nextAction: { type: "approval", title: `Review: ${title}`, ...(ask ? { description: ask } : {}) },
      },
    },
  });
  writeLast({
    artifactId: result.artifactId,
    reviewRequestId: result.reviewRequestId,
    reviewUrl: result.reviewUrl,
    title,
  });
  console.log(`\n  Published "${title}"`);
  console.log(`  Review link: ${result.reviewUrl}`);
  console.log(`  Check feedback later with: kspace events\n`);
}

async function events(args) {
  const creds = readCreds();
  if (!creds?.token) die("  Not connected. Run `kspace login` first.");
  const { flags } = parseArgs(args);
  const last = readLast();
  const id = flags.id || last?.reviewRequestId;
  if (!id) die("  No review to check. Publish first, or pass --id <reviewRequestId>.");
  const data = await api(`/v1/review-requests/${encodeURIComponent(id)}/events`, { token: creds.token });
  if (!data.events.length) {
    console.log(`\n  No activity yet on "${last?.title ?? id}". Reviewers haven't commented or decided.\n`);
    return;
  }
  console.log(`\n  Review activity for "${last?.title ?? id}":\n`);
  for (const e of data.events) {
    const p = e.payload;
    if (e.type === "comment.created") {
      const where = p.anchor?.type === "block" ? ` (on: ${(p.anchor.excerpt ?? "a block").slice(0, 60)})` : "";
      console.log(`  💬 ${p.author?.displayName ?? "someone"}${where}:`);
      console.log(`     ${String(p.body ?? "").split("\n").join("\n     ")}`);
    } else if (e.type === "review.submitted") {
      const mark = p.decision === "approved" ? "✅ approved" : `❌ ${p.decision ?? p.status}`;
      console.log(`  ${mark} by ${p.reviewer?.displayName ?? "someone"}${p.comment ? `: ${p.comment}` : ""}`);
    } else {
      console.log(`  • ${e.type}`);
    }
  }
  console.log("");
}

async function revise(args) {
  const creds = readCreds();
  if (!creds?.token) die("  Not connected. Run `kspace login` first.");
  const { flags, positionals } = parseArgs(args);
  if (positionals.length !== 1) die("  Usage: kspace revise <file.md> [--artifact <artifactId>]");
  const last = readLast();
  const artifactId = flags.artifact || last?.artifactId;
  if (!artifactId) die("  No artifact to revise. Publish first, or pass --artifact <artifactId>.");
  const body = fs.readFileSync(positionals[0], "utf8");
  const result = await api(`/v1/artifacts/${encodeURIComponent(artifactId)}/versions`, {
    method: "POST",
    token: creds.token,
    body: { artifact: { body } },
  });
  writeLast({
    artifactId: result.artifactId,
    reviewRequestId: result.reviewRequestId,
    reviewUrl: result.reviewUrl,
    title: last?.title ?? "revision",
  });
  console.log(`\n  Published v${result.versionNumber} into the same review thread.`);
  console.log(`  Review link: ${result.reviewUrl}\n`);
}

async function setup() {
  // One-shot onboarding: install the Claude Code plugin when the CLI is
  // available, then connect this agent. No shell — fixed argv only.
  const claude = spawnSync("claude", ["--version"], { stdio: "ignore" });
  if (claude.error || claude.status !== 0) {
    console.log("\n  Claude Code CLI not found — skipping plugin install.");
    console.log("  (In Claude Code, run: /plugin marketplace add tennisonchan/kspace-plugin)\n");
  } else {
    const run = (args, label) => {
      const res = spawnSync("claude", args, { stdio: "inherit" });
      if (res.status !== 0) console.error(`  ${label} did not complete — you can run it manually later.`);
      return res.status === 0;
    };
    console.log("\n  Installing the kspace plugin into Claude Code…\n");
    run(["plugin", "marketplace", "add", "tennisonchan/kspace-plugin"], "marketplace add");
    run(["plugin", "install", "kspace@kspace-plugin"], "plugin install");
  }
  if (readCreds()?.token) {
    console.log("  Already connected — you're all set.\n");
    return;
  }
  await login();
}

async function whoami() {
  const creds = readCreds();
  if (!creds?.token) die("  Not connected. Run `kspace login`.");
  console.log(`  Connected to ${creds.url} (space ${creds.workspaceId}).`);
}
function logout() {
  try {
    fs.rmSync(CRED_FILE);
  } catch {
    /* nothing to remove */
  }
  console.log("  Forgot stored credentials.");
}

// Only run the CLI dispatcher when invoked directly (`node kspace.mjs ...` or
// via the npm bin shim), not when imported as a module (e.g. by tests).
// realpath both sides: npm invokes the bin through a .bin/kspace symlink, so
// argv[1] and import.meta.url differ until resolved.
const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();
if (isMain) {
  const [cmd, ...args] = process.argv.slice(2);
  const run = {
    setup,
    login,
    publish: () => publish(args),
    events: () => events(args),
    revise: () => revise(args),
    whoami,
    logout,
  }[cmd];
  if (!run) {
    console.log("Usage: kspace <setup|login|publish|events|revise|whoami|logout>");
    process.exit(cmd ? 1 : 0);
  }
  run().catch((err) => die(`  ${err.message}`));
}
