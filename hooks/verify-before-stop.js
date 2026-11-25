#!/usr/bin/env node
/**
 * Verify gate: a session can't finish with failing checks.
 * Events: SessionStart (arg "start") and Stop.
 *
 * Opt-in per repo: runs only where `scripts/verify` exists at the git root.
 * At SessionStart it records HEAD. At Stop it runs `./scripts/verify` if the
 * session changed anything (dirty tree, or HEAD moved since start) and the
 * same tree hasn't already passed. On failure it blocks the stop and hands
 * Claude the tail of the output. After MAX_BLOCKS failed tries in a row it
 * lets the session end with a warning, so a broken environment can't loop.
 *
 * Skip for one session with CLAUDE_SKIP_VERIFY=1.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync, spawnSync } = require("child_process");

const MAX_BLOCKS = 3;
const TAIL_LINES = 60;
const STATE_DIR = path.join(os.tmpdir(), "claude-verify-gate");

function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function readState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function writeState(file, state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state));
}

function run(mode, input) {
  if (process.env.CLAUDE_SKIP_VERIFY === "1") return null;

  const root = git(["rev-parse", "--show-toplevel"], input.cwd || process.cwd());
  if (!root) return null;
  const verify = path.join(root, "scripts", "verify");
  if (!fs.existsSync(verify)) return null;

  const id = String(input.session_id || "unknown").replace(/[^\w.-]/g, "_");
  const stateFile = path.join(STATE_DIR, `${id}.json`);
  const state = readState(stateFile);
  const head = git(["rev-parse", "HEAD"], root);

  if (mode === "start") {
    if (!state.startHead) writeState(stateFile, { ...state, startHead: head });
    return null;
  }

  const status = git(["status", "--porcelain"], root) || "";
  const moved = state.startHead ? state.startHead !== head : false;
  if (!status && !moved) return null;

  // Fingerprint the tree so a passing state isn't re-verified every stop.
  const diff = git(["diff", "HEAD"], root) || "";
  const tree = crypto.createHash("sha256").update(`${head}\n${status}\n${diff}`).digest("hex");
  if (state.passed === tree) return null;

  const res = spawnSync(verify, [], { cwd: root, encoding: "utf8", shell: false, maxBuffer: 64 * 1024 * 1024 });
  if (res.status === 0) {
    writeState(stateFile, { ...state, passed: tree, blocks: 0 });
    return null;
  }

  const output = `${res.stdout || ""}${res.stderr || ""}${res.error ? res.error.message : ""}`;
  const tail = output.trimEnd().split("\n").slice(-TAIL_LINES).join("\n");
  const blocks = (state.blocks || 0) + 1;
  writeState(stateFile, { ...state, blocks });

  if (blocks > MAX_BLOCKS) {
    writeState(stateFile, { ...state, blocks: 0 });
    return {
      systemMessage: `scripts/verify still fails after ${MAX_BLOCKS} tries; stopping anyway. Don't call this work done.`,
    };
  }
  return {
    decision: "block",
    reason: `scripts/verify failed (try ${blocks} of ${MAX_BLOCKS}). Fix the cause, don't skip or weaken checks, then finish. Last output:\n${tail}`,
  };
}

let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(data || "{}");
  } catch {
    // no input: treat as empty
  }
  try {
    const out = run(process.argv[2] === "start" ? "start" : "stop", input);
    if (out) process.stdout.write(JSON.stringify(out));
  } catch (err) {
    console.error(`[Hook Error] verify-before-stop: ${err.message}`);
  }
  process.exit(0);
});
