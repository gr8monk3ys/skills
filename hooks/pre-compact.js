#!/usr/bin/env node
/**
 * Pre-Compact Hook
 * Saves critical context before compaction to prevent knowledge loss
 * Event: PreCompact
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const MEMORY_DIR = path.join(CLAUDE_DIR, "memory");
const CONTEXT_FILE = path.join(MEMORY_DIR, "pre-compact-context.md");
const ARCHIVE_DIR = path.join(MEMORY_DIR, "archives");
const MAX_ARCHIVES = 10;

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] pre-compact: ${context} - ${err.message}`);
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

// Get git status safely
function getGitStatus() {
  try {
    return execSync("git status --short", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "Not a git repository";
  }
}

// Get recent commits safely
function getRecentCommits() {
  try {
    return execSync("git log --oneline -10", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "No git history";
  }
}

// Find recently modified files
function getRecentFiles() {
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".md"];
  const files = [];

  function walkDir(dir, depth = 0) {
    if (depth > 3) return; // Limit depth
    if (!fs.existsSync(dir)) return;

    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules") continue;

        const fullPath = path.join(dir, entry);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          walkDir(fullPath, depth + 1);
        } else if (extensions.includes(path.extname(entry))) {
          files.push({
            path: fullPath,
            mtime: stats.mtimeMs,
          });
        }
      }
    } catch (err) {
      // Directory read failed - this is normal for some directories
    }
  }

  walkDir(".");

  return files
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 20)
    .map((f) => f.path);
}

// Main execution
function main() {
  ensureDir(MEMORY_DIR);
  ensureDir(ARCHIVE_DIR);

  const timestamp = getTimestamp();

  console.error("=============================================");
  console.error("[Pre-Compact] Preserving context before compaction");
  console.error("=============================================");

  // Archive previous context if exists
  if (fs.existsSync(CONTEXT_FILE)) {
    const archivePath = path.join(ARCHIVE_DIR, `context_${timestamp}.md`);
    fs.renameSync(CONTEXT_FILE, archivePath);
    console.error("[Pre-Compact] Archived previous context");
  }

  // Build context file content
  const recentFiles = getRecentFiles();
  const gitStatus = getGitStatus();
  const recentCommits = getRecentCommits();

  const content = `# Pre-Compaction Context Snapshot

This file preserves critical context from before the last compaction.
Use this to restore understanding if needed after /compact.

## Timestamp
${timestamp}

## Active Work Context

The following information was preserved before compaction:

### Key Decisions Made
- [Review git log for recent commits]

### Files Recently Modified
\`\`\`
${recentFiles.join("\n") || "No recent files found"}
\`\`\`

### Git Status at Compaction
\`\`\`
${gitStatus}
\`\`\`

### Recent Commits
\`\`\`
${recentCommits}
\`\`\`

## How to Use This File

After compaction, if you need to restore context:
1. Read this file to understand what was being worked on
2. Check the recent commits for context
3. Review modified files to understand current state

To restore this context to Claude, use:
\`\`\`
/memory restore pre-compact
\`\`\`
`;

  fs.writeFileSync(CONTEXT_FILE, content);

  console.error(`[Pre-Compact] Context saved to ${CONTEXT_FILE}`);
  console.error("[Pre-Compact] Ready for compaction - context preserved");
  console.error("");

  // Clean up old archives (keep last MAX_ARCHIVES)
  try {
    const archives = fs
      .readdirSync(ARCHIVE_DIR)
      .filter((f) => f.startsWith("context_") && f.endsWith(".md"))
      .sort()
      .reverse();

    if (archives.length > MAX_ARCHIVES) {
      archives.slice(MAX_ARCHIVES).forEach((f) => {
        try {
          fs.unlinkSync(path.join(ARCHIVE_DIR, f));
        } catch (err) {
          logError(`cleanup(${f})`, err);
        }
      });
    }
  } catch (err) {
    logError("archive cleanup", err);
  }

  process.exit(0);
}

main();
