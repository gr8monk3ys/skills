#!/usr/bin/env node
/**
 * PreToolUse Hook: Block modifications to sensitive files
 * Prevents accidental edits to .env, secrets, credentials, and other sensitive files
 *
 * Usage: Configure in hooks.json under PreToolUse
 * Matcher: "Write|Edit"
 *
 * Cross-platform Node.js implementation
 */

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] block-sensitive-files: ${context} - ${err.message}`);
}

// Sensitive file patterns to block
const SENSITIVE_PATTERNS = [
  /\.env$/i,
  /\.env\..*/i,
  /secrets?\./i,
  /credentials?\./i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.aws\/credentials/i,
  /\.ssh\//i,
  /firebase.*\.json$/i,
  /serviceAccount.*\.json$/i,
  /google-credentials\.json$/i,
  /\.npmrc$/i,
  /\.pypirc$/i,
  /token\.json$/i,
];

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

// Main execution
async function main() {
  const input = await readStdin();
  const filePath = input.tool_input?.file_path || "";

  if (!filePath) {
    // No file path, allow the operation
    process.exit(0);
  }

  // Check if file matches any sensitive pattern
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(filePath)) {
      // Output JSON decision to deny
      const response = {
        hookSpecificOutput: {
          permissionDecision: "deny",
          permissionDecisionReason: `Blocked: '${filePath}' matches sensitive file pattern '${pattern}'. This file may contain secrets or credentials. Please modify it manually if needed.`,
        },
      };
      console.log(JSON.stringify(response));
      process.exit(2);
    }
  }

  // Allow the operation
  process.exit(0);
}

main();
