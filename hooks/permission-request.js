#!/usr/bin/env node
/**
 * Permission Request Hook - Log and manage tool permissions
 * Logs all permission requests and supports auto-allow configuration
 * Event: PermissionRequest
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const LOGS_DIR = path.join(CLAUDE_DIR, "logs");
const PERMISSIONS_LOG = path.join(LOGS_DIR, "permissions.json");
const CONFIG_FILE = path.join(CLAUDE_DIR, "config", "permissions.json");
const MAX_LOG_ENTRIES = 1000;

// Default auto-allow tools (can be overridden by config or env)
const DEFAULT_AUTO_ALLOW = [
  "Read",
  "Glob",
  "Grep",
  "WebFetch",
  "WebSearch",
];

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] permission-request: ${context} - ${err.message}`);
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read JSON file safely
function readJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    logError(`readJson(${path.basename(filePath)})`, err);
  }
  return null;
}

// Write JSON file safely
function writeJson(filePath, data) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    logError(`writeJson(${path.basename(filePath)})`, err);
    return false;
  }
}

// Get auto-allow tools from config or env
function getAutoAllowTools() {
  // Check environment variable first (comma-separated list)
  const envTools = process.env.CLAUDE_AUTO_ALLOW_TOOLS;
  if (envTools) {
    return envTools.split(",").map((t) => t.trim()).filter(Boolean);
  }

  // Check config file
  const config = readJson(CONFIG_FILE);
  if (config && Array.isArray(config.autoAllow)) {
    return config.autoAllow;
  }

  return DEFAULT_AUTO_ALLOW;
}

// Read stdin with proper timeout handling
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    let resolved = false;

    const done = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read())) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      try {
        done(JSON.parse(data));
      } catch (err) {
        logError("stdin parse", err);
        done({});
      }
    });
    process.stdin.on("error", (err) => {
      logError("stdin read", err);
      done({});
    });

    // Timeout handling
    const checkTimeout = () => {
      if (!resolved) {
        if (data.length === 0) {
          done({});
        } else {
          setTimeout(() => done({}), 200);
        }
      }
    };
    setTimeout(checkTimeout, 500);
  });
}

// Log permission request to file
function logPermissionRequest(entry) {
  ensureDir(LOGS_DIR);

  let log = readJson(PERMISSIONS_LOG) || { entries: [] };

  // Add new entry
  log.entries.push(entry);

  // Trim old entries if needed
  if (log.entries.length > MAX_LOG_ENTRIES) {
    log.entries = log.entries.slice(-MAX_LOG_ENTRIES);
  }

  // Update metadata
  log.lastUpdated = new Date().toISOString();
  log.totalRequests = (log.totalRequests || 0) + 1;

  writeJson(PERMISSIONS_LOG, log);
}

// Format details for display
function formatDetails(input) {
  if (!input) return "N/A";

  // For file operations, show the file path
  if (input.file_path) {
    return input.file_path;
  }

  // For bash commands, show the command
  if (input.command) {
    const cmd = input.command;
    return cmd.length > 80 ? cmd.slice(0, 77) + "..." : cmd;
  }

  // For URLs
  if (input.url) {
    return input.url;
  }

  // For search/grep
  if (input.pattern) {
    return `pattern: ${input.pattern}`;
  }

  // Generic fallback
  const keys = Object.keys(input);
  if (keys.length > 0) {
    const first = input[keys[0]];
    if (typeof first === "string") {
      return first.length > 60 ? first.slice(0, 57) + "..." : first;
    }
  }

  return "N/A";
}

// Main execution
async function main() {
  const input = await readStdin();

  const toolName = input.tool_name || "unknown";
  const toolInput = input.tool_input || {};

  // Create log entry
  const entry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    details: formatDetails(toolInput),
    input: toolInput,
    project: path.basename(process.cwd()),
  };

  // Log to file
  try {
    logPermissionRequest(entry);
  } catch (err) {
    logError("logPermissionRequest", err);
  }

  // Output to stderr for visibility
  console.error(`[Permission] Requested: ${toolName} - ${entry.details}`);

  // Check auto-allow
  const autoAllowTools = getAutoAllowTools();
  if (autoAllowTools.includes(toolName)) {
    const response = {
      hookSpecificOutput: {
        permissionDecision: "allow",
        permissionDecisionReason: `Auto-allowed: ${toolName} is in the auto-allow list`,
      },
    };
    console.log(JSON.stringify(response));
    console.error(`[Permission] Auto-allowed: ${toolName}`);
    process.exit(0);
  }

  // No auto-decision, let Claude handle it normally
  process.exit(0);
}

main();
