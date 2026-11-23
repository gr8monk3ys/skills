/**
 * Shared utilities for cross-platform hook support
 * Works on Windows, macOS, and Linux
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Constants
const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const SESSIONS_DIR = path.join(CLAUDE_DIR, "sessions");
const INSTINCTS_DIR = path.join(CLAUDE_DIR, "instincts");
const MEMORY_FILE = path.join(CLAUDE_DIR, "memory.json");

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

/**
 * Log with color
 */
function log(message, color = "") {
  console.log(`${color}${message}${colors.reset}`);
}

function success(msg) {
  log(`[OK] ${msg}`, colors.green);
}
function warn(msg) {
  log(`[WARN] ${msg}`, colors.yellow);
}
function error(msg) {
  log(`[ERROR] ${msg}`, colors.red);
}
function info(msg) {
  log(`[INFO] ${msg}`, colors.cyan);
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Read JSON file safely
 */
function readJson(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    warn(`Failed to parse JSON: ${filePath}`);
    return defaultValue;
  }
}

/**
 * Write JSON file with pretty formatting
 */
function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Parse JSON from stdin (for hook input)
 */
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
      } catch {
        resolve(null);
      }
    });
    // Timeout after 100ms if no stdin
    setTimeout(() => resolve(null), 100);
  });
}

/**
 * Get current git branch
 */
function getGitBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Get recent git changes (last N commits)
 */
function getRecentChanges(commits = 5) {
  try {
    // Check if we have enough commits
    const commitCount = parseInt(
      execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim(),
    );
    const actualCommits = Math.min(commits, commitCount);

    if (actualCommits === 0) return [];

    const result = execSync(
      `git diff --name-only HEAD~${actualCommits} HEAD 2>/dev/null || git diff --name-only HEAD`,
      { encoding: "utf8" },
    );
    return result.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get project type from package.json or other config files
 */
function detectProjectType() {
  const cwd = process.cwd();
  const types = [];

  // Check package.json
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = readJson(pkgPath, {});
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.next) types.push("nextjs");
    if (deps.react) types.push("react");
    if (deps["@supabase/supabase-js"]) types.push("supabase");
    if (deps.typescript) types.push("typescript");
    if (deps.tailwindcss) types.push("tailwind");
  }

  // Check other config files
  if (
    fs.existsSync(path.join(cwd, "requirements.txt")) ||
    fs.existsSync(path.join(cwd, "pyproject.toml"))
  ) {
    types.push("python");
  }
  if (fs.existsSync(path.join(cwd, "Cargo.toml"))) {
    types.push("rust");
  }
  if (fs.existsSync(path.join(cwd, "go.mod"))) {
    types.push("go");
  }

  return types;
}

/**
 * Get timestamp in ISO format
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * Generate session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Clean old sessions (keep last N, max M days old)
 */
function cleanOldSessions(maxSessions = 50, maxDays = 7) {
  ensureDir(SESSIONS_DIR);

  const files = fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      name: f,
      path: path.join(SESSIONS_DIR, f),
      mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;

  // Remove files beyond maxSessions or older than maxDays
  files.slice(maxSessions).forEach((f) => {
    fs.unlinkSync(f.path);
  });

  files.forEach((f) => {
    if (f.mtime.getTime() < cutoff) {
      try {
        fs.unlinkSync(f.path);
      } catch {
        // best-effort cleanup of old log files
      }
    }
  });
}

/**
 * Send desktop notification (cross-platform)
 */
function notify(title, message) {
  const platform = os.platform();

  try {
    if (platform === "darwin") {
      execSync(
        `osascript -e 'display notification "${message}" with title "${title}"'`,
      );
    } else if (platform === "linux") {
      execSync(`notify-send "${title}" "${message}"`);
    } else if (platform === "win32") {
      // Windows toast notification via PowerShell
      const script = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $template.SelectSingleNode("//text[@id='1']").InnerText = "${title}"
        $template.SelectSingleNode("//text[@id='2']").InnerText = "${message}"
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
      `;
      execSync(`powershell -Command "${script.replace(/\n/g, "; ")}"`, {
        stdio: "ignore",
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path matches sensitive file patterns
 */
function isSensitiveFile(filePath) {
  const sensitivePatterns = [
    /\.env$/i,
    /\.env\./i,
    /credentials/i,
    /secrets?/i,
    /\.pem$/i,
    /\.key$/i,
    /\.p12$/i,
    /\.pfx$/i,
    /password/i,
    /api[_-]?key/i,
    /\.ssh\//i,
    /id_rsa/i,
    /id_ed25519/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Validate JSON string
 */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format file path for display (shorten home dir)
 */
function formatPath(filePath) {
  const home = os.homedir();
  if (filePath.startsWith(home)) {
    return filePath.replace(home, "~");
  }
  return filePath;
}

/**
 * Run command and capture output
 */
function runCommand(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Check if a formatter is available
 */
function hasFormatter(name) {
  const commands = {
    prettier: "npx prettier --version",
    eslint: "npx eslint --version",
    biome: "npx biome --version",
  };

  return runCommand(commands[name]) !== null;
}

module.exports = {
  // Constants
  CLAUDE_DIR,
  SESSIONS_DIR,
  INSTINCTS_DIR,
  MEMORY_FILE,
  colors,

  // Logging
  log,
  success,
  warn,
  error,
  info,

  // File operations
  ensureDir,
  readJson,
  writeJson,
  readStdin,

  // Git operations
  getGitBranch,
  getRecentChanges,

  // Project detection
  detectProjectType,

  // Utilities
  timestamp,
  generateSessionId,
  cleanOldSessions,
  notify,
  isSensitiveFile,
  isValidJson,
  formatPath,
  runCommand,
  hasFormatter,
};
