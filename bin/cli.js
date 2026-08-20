#!/usr/bin/env node

/**
 * Lorenzo's Claude Code Plugin CLI
 *
 * Commands:
 *   install   - Install plugin to ~/.claude/
 *   update    - Update existing installation
 *   uninstall - Remove plugin from ~/.claude/
 *   doctor    - Verify installation and dependencies
 *   version   - Show version information
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { PROMOTED_BUCKETS } = require("../scripts/lib/manifest");

const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const PLUGIN_SOURCE = path.join(__dirname, "..");
const VERSION = require("../package.json").version;

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function log(message, color = "") {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`  ✓ ${message}`, colors.green);
}

function warn(message) {
  log(`  ⚠ ${message}`, colors.yellow);
}

function error(message) {
  log(`  ✗ ${message}`, colors.red);
}

function info(message) {
  log(`  → ${message}`, colors.cyan);
}

function heading(message) {
  log(`\n${message}`, colors.bright);
}

/**
 * Copy directory recursively with proper handling
 */
function copyDirSync(src, dest, options = {}) {
  const { overwrite = true, filter = () => true } = options;

  if (!fs.existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (!filter(srcPath, entry)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, options);
    } else {
      if (fs.existsSync(destPath) && !overwrite) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Remove directory recursively
 */
function removeDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Install the plugin to ~/.claude/
 */
function install() {
  heading("Installing Lorenzo's Claude Code Plugin v" + VERSION);

  const sourceClaude = path.join(PLUGIN_SOURCE, ".claude");
  const sourcePlugin = path.join(PLUGIN_SOURCE, ".claude-plugin");

  // Check source exists
  if (!fs.existsSync(sourceClaude)) {
    error("Plugin source not found. Please reinstall the package.");
    process.exit(1);
  }

  // Create .claude directory if needed
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    info("Created ~/.claude directory");
  }

  // Backup existing if present
  const backupDir = path.join(CLAUDE_DIR, ".backup-" + Date.now());
  const existingDirs = ["commands", "agents", "skills", "hooks"];
  let hasExisting = false;

  for (const dir of existingDirs) {
    if (fs.existsSync(path.join(CLAUDE_DIR, dir))) {
      hasExisting = true;
      break;
    }
  }

  if (hasExisting) {
    warn("Existing configuration found - creating backup");
    fs.mkdirSync(backupDir, { recursive: true });
    for (const dir of existingDirs) {
      const srcDir = path.join(CLAUDE_DIR, dir);
      if (fs.existsSync(srcDir)) {
        copyDirSync(srcDir, path.join(backupDir, dir));
      }
    }
    success(`Backup created at ${backupDir}`);
  }

  // Copy plugin files
  info("Installing commands, agents, skills, and hooks...");

  const componentsToCopy = [
    { name: "commands", src: path.join(sourceClaude, "commands") },
    { name: "agents", src: path.join(sourceClaude, "agents") },
    { name: "hooks", src: path.join(sourceClaude, "hooks") },
    { name: "rules", src: path.join(sourceClaude, "rules") },
    { name: "memory", src: path.join(sourceClaude, "memory") },
    { name: "profiles", src: path.join(sourceClaude, "profiles") },
  ];

  for (const component of componentsToCopy) {
    if (fs.existsSync(component.src)) {
      copyDirSync(component.src, path.join(CLAUDE_DIR, component.name));
      success(`Installed ${component.name}`);
    }
  }

  // Skills ship from promoted buckets only, flattened to ~/.claude/skills/<name>/
  for (const bucket of PROMOTED_BUCKETS) {
    const bucketDir = path.join(sourceClaude, "skills", bucket);
    if (!fs.existsSync(bucketDir)) continue;
    for (const entry of fs.readdirSync(bucketDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      copyDirSync(
        path.join(bucketDir, entry.name),
        path.join(CLAUDE_DIR, "skills", entry.name),
      );
    }
    success(`Installed skills (${bucket})`);
  }

  // Copy plugin manifest
  if (fs.existsSync(sourcePlugin)) {
    const pluginDir = path.join(CLAUDE_DIR, "plugins", "lorenzos-claude-code");
    fs.mkdirSync(pluginDir, { recursive: true });
    copyDirSync(sourcePlugin, pluginDir);
    success("Installed plugin manifest");
  }

  // Create/update settings if needed
  const settingsPath = path.join(CLAUDE_DIR, "settings.json");
  if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
      enabledPlugins: {
        "lorenzos-claude-code": true,
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    success("Created default settings.json");
  }

  heading("Installation Complete!");
  log("");
  log("  Next steps:", colors.dim);
  log("    1. Restart Claude Code to load the plugin");
  log("    2. Try /component-new to create a React component");
  log("    3. Run `lorenzo-claude doctor` to verify installation");
  log("");
}

/**
 * Update existing installation
 */
function update() {
  heading("Updating Lorenzo's Claude Code Plugin to v" + VERSION);

  // Just reinstall - install handles backup
  install();
}

/**
 * Remove the plugin from ~/.claude/
 */
function uninstall() {
  heading("Uninstalling Lorenzo's Claude Code Plugin");

  const componentsToRemove = [
    "commands",
    "agents",
    "skills",
    "hooks",
    "rules",
    "memory",
    "profiles",
    path.join("plugins", "lorenzos-claude-code"),
  ];

  for (const component of componentsToRemove) {
    const componentPath = path.join(CLAUDE_DIR, component);
    if (fs.existsSync(componentPath)) {
      removeDirSync(componentPath);
      success(`Removed ${component}`);
    }
  }

  heading("Uninstall Complete!");
  log("");
  log("  Your ~/.claude/settings.json was preserved.");
  log("  Remove manually if no longer needed.");
  log("");
}

/**
 * Verify installation and check dependencies
 */
function doctor() {
  heading("Claude Code Plugin Health Check");

  let issues = 0;

  // Check Node version
  const nodeVersion = process.versions.node.split(".")[0];
  if (parseInt(nodeVersion) >= 18) {
    success(`Node.js v${process.versions.node} (>= 18 required)`);
  } else {
    error(`Node.js v${process.versions.node} is too old (>= 18 required)`);
    issues++;
  }

  // Check ~/.claude exists
  if (fs.existsSync(CLAUDE_DIR)) {
    success("~/.claude directory exists");
  } else {
    error("~/.claude directory not found");
    issues++;
  }

  // Check components
  const components = [
    { name: "commands", expected: 17 },
    { name: "agents", expected: 6 },
    { name: "skills", expected: 14 },
    { name: "hooks", expected: 15 }, // hooks.json + 14 hook scripts
  ];

  for (const component of components) {
    const componentPath = path.join(CLAUDE_DIR, component.name);
    if (fs.existsSync(componentPath)) {
      const files = fs
        .readdirSync(componentPath, { recursive: true })
        .filter(
          (f) =>
            f.endsWith(".md") ||
            f.endsWith(".json") ||
            f.endsWith(".js") ||
            f.endsWith(".sh"),
        );

      if (files.length >= component.expected * 0.5) {
        success(`${component.name}: ${files.length} files found`);
      } else {
        warn(
          `${component.name}: Only ${files.length} files (expected ~${component.expected})`,
        );
      }
    } else {
      error(`${component.name}: Directory not found`);
      issues++;
    }
  }

  // Check hooks.json
  const hooksJson = path.join(CLAUDE_DIR, "hooks", "hooks.json");
  if (fs.existsSync(hooksJson)) {
    try {
      JSON.parse(fs.readFileSync(hooksJson, "utf8"));
      success("hooks.json is valid JSON");
    } catch (e) {
      error("hooks.json is invalid JSON");
      issues++;
    }
  } else {
    warn("hooks.json not found");
  }

  // Summary
  heading("Summary");
  if (issues === 0) {
    log("");
    success("All checks passed! Plugin is healthy.");
    log("");
  } else {
    log("");
    error(`${issues} issue(s) found. Run 'lorenzo-claude install' to fix.`);
    log("");
    process.exit(1);
  }
}

/**
 * Show version
 */
function showVersion() {
  log(`Lorenzo's Claude Code Plugin v${VERSION}`);
}

/**
 * Show help
 */
function showHelp() {
  log("");
  log("Lorenzo's Claude Code Plugin", colors.bright);
  log(`Version ${VERSION}`, colors.dim);
  log("");
  log("Usage: lorenzo-claude <command>", colors.cyan);
  log("");
  log("Commands:");
  log("  install     Install plugin to ~/.claude/");
  log("  update      Update existing installation");
  log("  uninstall   Remove plugin from ~/.claude/");
  log("  doctor      Verify installation health");
  log("  version     Show version information");
  log("  help        Show this help message");
  log("");
  log("Aliases:");
  log("  lcc         Short alias for lorenzo-claude");
  log("");
  log("Examples:");
  log("  npx @gr8monk3ys/claude-code-plugin install");
  log("  lorenzo-claude doctor");
  log("  lcc update");
  log("");
}

// Main CLI handler
const command = process.argv[2];

switch (command) {
  case "install":
  case "i":
    install();
    break;
  case "update":
  case "u":
    update();
    break;
  case "uninstall":
  case "remove":
    uninstall();
    break;
  case "doctor":
  case "check":
    doctor();
    break;
  case "version":
  case "-v":
  case "--version":
    showVersion();
    break;
  case "help":
  case "-h":
  case "--help":
  case undefined:
    showHelp();
    break;
  default:
    error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}
