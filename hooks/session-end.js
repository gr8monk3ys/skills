#!/usr/bin/env node
/**
 * Session End Hook - Memory Persistence System
 * Persists session state when Claude sessions complete
 * Event: Stop
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const SESSIONS_DIR = path.join(CLAUDE_DIR, "sessions");
const MAX_SESSIONS = 50;

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] session-end: ${context} - ${err.message}`);
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Get timestamp string
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").replace("T", "_").split(".")[0];
}

// Detect project type
function detectProjectType() {
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, "package.json"))) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(cwd, "package.json"), "utf8"),
      );
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.next) return "nextjs";
      if (deps.vue) return "vue";
      if (deps.react) return "react";
      return "node";
    } catch (err) {
      logError("detectProjectType", err);
      return "node";
    }
  }

  if (
    fs.existsSync(path.join(cwd, "requirements.txt")) ||
    fs.existsSync(path.join(cwd, "pyproject.toml"))
  ) {
    return "python";
  }

  if (fs.existsSync(path.join(cwd, "Cargo.toml"))) {
    return "rust";
  }

  if (fs.existsSync(path.join(cwd, "go.mod"))) {
    return "go";
  }

  return "unknown";
}

// Get git branch
function getGitBranch() {
  try {
    return execSync("git branch --show-current", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    // Not a git repo - this is normal, don't log as error
    return "";
  }
}

// Get recent files modified
function getRecentFiles() {
  try {
    const result = execSync(
      "git diff --name-only HEAD~5 2>/dev/null || git diff --name-only HEAD",
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    return result.trim().split("\n").filter(Boolean).slice(0, 10).join(",");
  } catch (err) {
    // No git history - this is normal, don't log as error
    return "";
  }
}

// Cleanup old sessions
function cleanupOldSessions() {
  try {
    const files = fs
      .readdirSync(SESSIONS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(SESSIONS_DIR, f),
        mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > MAX_SESSIONS) {
      const excess = files.length - MAX_SESSIONS;
      files.slice(MAX_SESSIONS).forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (err) {
          logError(`cleanup(${f.name})`, err);
        }
      });
      console.error(`[Memory] Cleaned up ${excess} old session(s)`);
    }
  } catch (err) {
    logError("cleanupOldSessions", err);
  }
}

// Main execution
function main() {
  ensureDir(SESSIONS_DIR);

  const timestamp = getTimestamp();
  const sessionFile = path.join(SESSIONS_DIR, `session_${timestamp}.json`);

  const sessionData = {
    timestamp: new Date().toISOString(),
    project_name: path.basename(process.cwd()),
    project_path: process.cwd(),
    project_type: detectProjectType(),
    git_branch: getGitBranch(),
    recent_files: getRecentFiles(),
    session_id: timestamp,
  };

  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  console.error(`[Memory] Session saved: ${sessionFile}`);

  cleanupOldSessions();

  process.exit(0);
}

main();
