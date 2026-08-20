#!/usr/bin/env node
/**
 * PostToolUse Hook: Auto-format files after edits
 * Runs prettier/eslint on modified files to maintain code style
 *
 * Usage: Configure in hooks.json under PostToolUse
 * Matcher: "Write|Edit"
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] auto-format: ${context} - ${err.message}`);
}

// File extensions to format
const FORMAT_EXTENSIONS = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "javascript",
  ".tsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".json": "json",
  ".css": "css",
  ".scss": "css",
  ".less": "css",
  ".md": "markdown",
  ".mdx": "markdown",
  ".html": "html",
  ".htm": "html",
  ".yml": "yaml",
  ".yaml": "yaml",
};

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

// Check if command exists
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    // On Windows, try where instead
    try {
      execSync(`where ${cmd}`, { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }
}

// Run formatter
function runFormatter(filePath, formatType) {
  // Check for prettier in node_modules or globally
  try {
    if (fs.existsSync("node_modules/.bin/prettier")) {
      execSync(`npx prettier --write "${filePath}"`, { stdio: "pipe" });
      console.error(`Formatted ${filePath} with prettier`);
      return true;
    }
  } catch (err) {
    // Prettier failed, try next formatter
  }

  // Check for biome
  try {
    if (fs.existsSync("node_modules/.bin/biome")) {
      execSync(`npx @biomejs/biome format --write "${filePath}"`, {
        stdio: "pipe",
      });
      console.error(`Formatted ${filePath} with biome`);
      return true;
    }
  } catch (err) {
    // Biome failed, try next formatter
  }

  // Check for eslint (JS/TS only)
  if (formatType === "javascript") {
    try {
      if (fs.existsSync("node_modules/.bin/eslint")) {
        execSync(`npx eslint --fix "${filePath}"`, { stdio: "pipe" });
        console.error(`Fixed ${filePath} with eslint`);
        return true;
      }
    } catch (err) {
      // ESLint failed
    }
  }

  return false;
}

// Main execution
async function main() {
  const input = await readStdin();
  const filePath = input.tool_input?.file_path || "";

  if (!filePath || !fs.existsSync(filePath)) {
    process.exit(0);
  }

  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  const formatType = FORMAT_EXTENSIONS[ext];

  if (!formatType) {
    // Unknown extension, skip formatting
    process.exit(0);
  }

  // Run formatter
  runFormatter(filePath, formatType);

  process.exit(0);
}

main();
