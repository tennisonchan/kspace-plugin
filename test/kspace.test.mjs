import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Point HOME at a scratch dir before importing, since the module computes
// ~/.kspace once at import time from os.homedir().
const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "kspace-test-"));
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;

const { parseArgs, writeCreds, readCreds, writeLast, readLast, CRED_FILE, LAST_FILE } = await import(
  "../bin/kspace.mjs"
);

test("parseArgs separates flags with values from positionals", () => {
  const { flags, positionals } = parseArgs(["doc.md", "--title", "My title", "--ask", "check this"]);
  assert.deepEqual(positionals, ["doc.md"]);
  assert.deepEqual(flags, { title: "My title", ask: "check this" });
});

test("parseArgs handles a bare positional with no flags", () => {
  const { flags, positionals } = parseArgs(["doc.md"]);
  assert.deepEqual(positionals, ["doc.md"]);
  assert.deepEqual(flags, {});
});

test("writeCreds persists JSON readable via readCreds", () => {
  writeCreds({ url: "https://app.kspace.studio", token: "t_abc", workspaceId: "w_1" });
  assert.deepEqual(readCreds(), { url: "https://app.kspace.studio", token: "t_abc", workspaceId: "w_1" });
});

test("writeCreds restricts the credentials file to owner read/write only", () => {
  writeCreds({ url: "https://app.kspace.studio", token: "t_abc", workspaceId: "w_1" });
  const mode = fs.statSync(CRED_FILE).mode & 0o777;
  assert.equal(mode, 0o600);
});

test("readCreds returns null when no credentials file exists", () => {
  fs.rmSync(CRED_FILE, { force: true });
  assert.equal(readCreds(), null);
});

test("writeLast/readLast round-trip the last publish", () => {
  writeLast({ artifactId: "art_1", reviewRequestId: "rr_1", reviewUrl: "https://x/r/t", title: "Doc" });
  assert.deepEqual(readLast(), {
    artifactId: "art_1",
    reviewRequestId: "rr_1",
    reviewUrl: "https://x/r/t",
    title: "Doc",
  });
  fs.rmSync(LAST_FILE, { force: true });
  assert.equal(readLast(), null);
});

test("CLI dispatcher runs when invoked through a symlink (npm .bin shim)", () => {
  const binPath = fileURLToPath(new URL("../bin/kspace.mjs", import.meta.url));
  const linkPath = path.join(tmpHome, "kspace-link.mjs");
  fs.symlinkSync(binPath, linkPath);
  const out = execFileSync(process.execPath, [linkPath], { encoding: "utf8" });
  assert.match(out, /Usage: kspace/);
});

test("CLI dispatcher runs when invoked directly", () => {
  const binPath = fileURLToPath(new URL("../bin/kspace.mjs", import.meta.url));
  const out = execFileSync(process.execPath, [binPath], { encoding: "utf8" });
  assert.match(out, /Usage: kspace/);
});
