#!/usr/bin/env node
/**
 * Subagent Stop Hook - Subagent Tracking System
 * Logs when subagents complete with duration and success/failure
 * Event: SubagentStop
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

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] subagent-stop: ${context} - ${err.message}`);
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

// Calculate duration in seconds
function calculateDuration(startMs, endMs) {
  return ((endMs - startMs) / 1000).toFixed(2);
}

// Find matching running subagent entry
function findRunningSubagent(data, subagentName) {
  // Find the most recent running entry for this subagent
  for (let i = data.subagents.length - 1; i >= 0; i--) {
    const entry = data.subagents[i];
    if (entry.name === subagentName && entry.status === "running") {
      return { entry, index: i };
    }
  }
  return null;
}

// Main execution
async function main() {
  ensureDir(LOGS_DIR);

  const input = await readStdin();
  const now = new Date();
  const timestamp = now.toISOString();
  const endMs = Date.now();

  // Extract subagent information from input
  const subagentName = input.subagent_name || input.agent_name || "unknown";
  const success = input.success !== false;
  const exitCode = input.exit_code || 0;
  const errorMessage = input.error || null;

  // Determine status
  const status = success && exitCode === 0 ? "completed" : "failed";

  // Load existing log
  const data = readJson(SUBAGENTS_LOG);

  // Find the matching running subagent
  const match = findRunningSubagent(data, subagentName);

  let duration;

  if (match) {
    // Update existing entry
    const { entry, index } = match;
    const startMs = entry.started_at_ms || endMs;
    duration = calculateDuration(startMs, endMs);

    data.subagents[index] = {
      ...entry,
      status,
      completed_at: timestamp,
      duration_seconds: parseFloat(duration),
      success,
      exit_code: exitCode,
      error: errorMessage,
    };
  } else {
    // No matching start entry found - create a complete entry
    duration = "0.00";
    data.subagents.push({
      id: `orphan_${Date.now()}`,
      name: subagentName,
      type: "unknown",
      started_at: timestamp,
      started_at_ms: endMs,
      status,
      completed_at: timestamp,
      duration_seconds: 0,
      success,
      exit_code: exitCode,
      error: errorMessage,
      note: "No matching start event found",
    });
  }

  // Save log
  writeJson(SUBAGENTS_LOG, data);

  // Output to stderr
  const statusText = status === "completed" ? "Completed" : "Failed";
  console.error(`[Subagent] ${statusText}: ${subagentName} in ${duration}s`);

  process.exit(0);
}

main();
