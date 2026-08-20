#!/usr/bin/env node
/**
 * Subagent Start Hook - Subagent Tracking System
 * Logs when subagents are spawned with name/type and timestamp
 * Event: SubagentStart
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const LOGS_DIR = path.join(CLAUDE_DIR, "logs");
const SUBAGENTS_LOG = path.join(LOGS_DIR, "subagents.json");
const MAX_ENTRIES = 100;

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] subagent-start: ${context} - ${err.message}`);
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read JSON file safely
function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { subagents: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    logError(`readJson(${path.basename(filePath)})`, err);
    return { subagents: [] };
  }
}

// Write JSON file safely
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    logError(`writeJson(${path.basename(filePath)})`, err);
  }
}

// Format timestamp for display
function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Read stdin
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read())) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        logError("stdin parse", err);
        resolve({});
      }
    });
    process.stdin.on("error", (err) => {
      logError("stdin read", err);
      resolve({});
    });
    setTimeout(() => resolve({}), 500);
  });
}

// Cleanup old entries to prevent unbounded growth
function cleanupOldEntries(data) {
  if (data.subagents.length > MAX_ENTRIES) {
    // Keep most recent entries
    data.subagents = data.subagents.slice(-MAX_ENTRIES);
  }
  return data;
}

// Main execution
async function main() {
  ensureDir(LOGS_DIR);

  const input = await readStdin();
  const now = new Date();
  const timestamp = now.toISOString();

  // Extract subagent information from input
  const subagentName = input.subagent_name || input.agent_name || "unknown";
  const subagentType = input.subagent_type || input.agent_type || "agent";
  const sessionId = input.session_id || `${Date.now()}`;

  // Load existing log
  const data = readJson(SUBAGENTS_LOG);

  // Create new entry
  const entry = {
    id: `${sessionId}_${Date.now()}`,
    name: subagentName,
    type: subagentType,
    started_at: timestamp,
    started_at_ms: Date.now(),
    status: "running",
    completed_at: null,
    duration_seconds: null,
  };

  // Add to log
  data.subagents.push(entry);

  // Cleanup old entries
  cleanupOldEntries(data);

  // Save log
  writeJson(SUBAGENTS_LOG, data);

  // Output to stderr
  const displayTime = formatTime(now);
  console.error(`[Subagent] Started: ${subagentName} at ${displayTime}`);

  process.exit(0);
}

main();
