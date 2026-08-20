#!/usr/bin/env node
/**
 * PreToolUse Hook: Validate JSON syntax before writing
 * Ensures JSON files have valid syntax before being written
 *
 * Usage: Configure in hooks.json under PreToolUse
 * Matcher: "Write"
 *
 * Cross-platform Node.js implementation
 */

const path = require("path");

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] validate-json: ${context} - ${err.message}`);
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

    // Timeout based on whether we've received any data
    // Start with 500ms, extend if data is flowing
    const checkTimeout = () => {
      if (!resolved) {
        if (data.length === 0) {
          done({});
        } else {
          // Data received but not complete, wait a bit more
          setTimeout(() => done({}), 200);
        }
      }
    };
    setTimeout(checkTimeout, 500);
  });
}

// Main execution
async function main() {
  const input = await readStdin();
  const filePath = input.tool_input?.file_path || "";
  const content = input.tool_input?.content || "";

  if (!filePath) {
    process.exit(0);
  }

  // Get file extension
  const ext = path.extname(filePath).toLowerCase();

  // Only validate JSON files
  if (ext !== ".json") {
    process.exit(0);
  }

  // Validate JSON syntax
  try {
    JSON.parse(content);
  } catch (err) {
    // Invalid JSON - block the write
    const response = {
      hookSpecificOutput: {
        permissionDecision: "deny",
        permissionDecisionReason: `Invalid JSON syntax in '${filePath}'. Error: ${err.message}. Please fix the JSON before writing.`,
      },
    };
    console.log(JSON.stringify(response));
    process.exit(2);
  }

  // Valid JSON, allow the operation
  process.exit(0);
}

main();
