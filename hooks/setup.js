#!/usr/bin/env node
/**
 * Setup Hook - One-time Initialization
 * Runs only on first session, initializes project context
 * Event: Setup
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const PROJECT_CLAUDE_DIR = path.join(process.cwd(), ".claude");
const SETUP_MARKER = path.join(PROJECT_CLAUDE_DIR, ".setup-complete");
const LOGS_DIR = path.join(CLAUDE_DIR, "logs");

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] setup: ${context} - ${err.message}`);
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Check if setup has already been completed
function isSetupComplete() {
  return fs.existsSync(SETUP_MARKER);
}

// Get git status
function getGitStatus() {
  try {
    const branch = execSync("git branch --show-current", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const status = execSync("git status --porcelain", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const statusLines = status ? status.split("\n").length : 0;

    return {
      branch,
      changedFiles: statusLines,
      isClean: statusLines === 0,
    };
  } catch (err) {
    // Not a git repo
    return null;
  }
}

// Get recent commits
function getRecentCommits(count = 5) {
  try {
    const result = execSync(
      `git log --oneline -${count}`,
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();

    return result.split("\n").filter(Boolean);
  } catch (err) {
    return [];
  }
}

// Load GitHub issues if gh CLI is available
function getRecentIssues() {
  try {
    const result = execSync(
      "gh issue list --limit 5 --json number,title,state 2>/dev/null",
      {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    return JSON.parse(result);
  } catch (err) {
    // gh CLI not available or not in a GitHub repo
    return [];
  }
}

// Detect project type
function detectProjectType() {
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, "package.json"))) {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(cwd, "package.json"), "utf8")
      );
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.next) return "nextjs";
      if (deps.vue) return "vue";
      if (deps.react) return "react";
      return "node";
    } catch (err) {
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

// Initialize required directories
function initializeDirectories() {
  const dirs = [
    CLAUDE_DIR,
    LOGS_DIR,
    path.join(CLAUDE_DIR, "sessions"),
    path.join(CLAUDE_DIR, "skills"),
    path.join(CLAUDE_DIR, "instincts"),
    PROJECT_CLAUDE_DIR,
  ];

  for (const dir of dirs) {
    ensureDir(dir);
  }
}

// Create setup marker file
function createSetupMarker(context) {
  const marker = {
    timestamp: new Date().toISOString(),
    project_name: path.basename(process.cwd()),
    project_path: process.cwd(),
    project_type: context.projectType,
    git_branch: context.git?.branch || null,
  };

  fs.writeFileSync(SETUP_MARKER, JSON.stringify(marker, null, 2));
}

// Main execution
function main() {
  // Check if setup already completed
  if (isSetupComplete()) {
    console.error("[Setup] Already initialized, skipping setup");
    process.exit(0);
  }

  console.error("[Setup] First session detected, initializing...");

  // Initialize directories
  try {
    initializeDirectories();
    console.error("[Setup] Directories initialized");
  } catch (err) {
    logError("initializeDirectories", err);
  }

  // Gather context
  const context = {
    projectType: detectProjectType(),
    git: getGitStatus(),
    recentCommits: getRecentCommits(),
    issues: getRecentIssues(),
  };

  // Output context summary
  console.error(`[Setup] Project: ${path.basename(process.cwd())}`);
  console.error(`[Setup] Type: ${context.projectType}`);

  if (context.git) {
    console.error(`[Setup] Git branch: ${context.git.branch}`);
    console.error(`[Setup] Working tree: ${context.git.isClean ? "clean" : `${context.git.changedFiles} changed files`}`);

    if (context.recentCommits.length > 0) {
      console.error("[Setup] Recent commits:");
      context.recentCommits.slice(0, 3).forEach((commit) => {
        console.error(`  - ${commit}`);
      });
    }
  } else {
    console.error("[Setup] Not a git repository");
  }

  if (context.issues.length > 0) {
    console.error("[Setup] Open issues:");
    context.issues.forEach((issue) => {
      console.error(`  - #${issue.number}: ${issue.title}`);
    });
  }

  // Create marker file
  try {
    createSetupMarker(context);
    console.error("[Setup] Setup complete, marker created");
  } catch (err) {
    logError("createSetupMarker", err);
  }

  process.exit(0);
}

main();
