const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const HOOK = path.join(__dirname, "..", "hooks", "verify-before-stop.js");

function repo(verifyBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vbs-"));
  const g = (...a) => execFileSync("git", a, { cwd: dir, stdio: "ignore" });
  g("init", "-q");
  g("config", "user.email", "t@t");
  g("config", "user.name", "t");
  fs.writeFileSync(path.join(dir, "a.txt"), "a\n");
  if (verifyBody !== null) {
    fs.mkdirSync(path.join(dir, "scripts"));
    fs.writeFileSync(path.join(dir, "scripts", "verify"), `#!/bin/sh\n${verifyBody}\n`, { mode: 0o755 });
  }
  g("add", ".");
  g("commit", "-qm", "init");
  return dir;
}

function hook(dir, session, mode) {
  const args = mode ? [HOOK, mode] : [HOOK];
  const r = spawnSync("node", args, {
    input: JSON.stringify({ session_id: session, cwd: dir }),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_SKIP_VERIFY: "" },
  });
  return r.stdout ? JSON.parse(r.stdout) : null;
}

const sid = () => `t${process.pid}${Math.random().toString(36).slice(2)}`;

test("no scripts/verify: never blocks", () => {
  const dir = repo(null);
  fs.writeFileSync(path.join(dir, "a.txt"), "b\n");
  assert.strictEqual(hook(dir, sid()), null);
});

test("clean tree, nothing changed: skips verify", () => {
  const dir = repo("exit 1");
  const s = sid();
  hook(dir, s, "start");
  assert.strictEqual(hook(dir, s), null);
});

test("changed tree with failing verify: blocks with output", () => {
  const dir = repo('echo "3 tests failed"; exit 1');
  const s = sid();
  hook(dir, s, "start");
  fs.writeFileSync(path.join(dir, "a.txt"), "b\n");
  const out = hook(dir, s);
  assert.strictEqual(out.decision, "block");
  assert.match(out.reason, /3 tests failed/);
});

test("changed tree with passing verify: allows stop", () => {
  const dir = repo("exit 0");
  const s = sid();
  hook(dir, s, "start");
  fs.writeFileSync(path.join(dir, "a.txt"), "b\n");
  assert.strictEqual(hook(dir, s), null);
});

test("gives up after three blocks so a broken env can't loop", () => {
  const dir = repo("exit 1");
  const s = sid();
  hook(dir, s, "start");
  fs.writeFileSync(path.join(dir, "a.txt"), "b\n");
  for (let i = 0; i < 3; i++) assert.strictEqual(hook(dir, s).decision, "block");
  const last = hook(dir, s);
  assert.strictEqual(last.decision, undefined);
  assert.match(last.systemMessage, /still fails/);
});
