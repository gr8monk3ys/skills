#!/usr/bin/env node

/**
 * Test runner for Lorenzo's Claude Code Plugin
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
};

let passed = 0;
let failed = 0;
let skipped = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}  ✓${colors.reset} ${name}`);
    passed++;
  } catch (err) {
    console.log(`${colors.red}  ✗${colors.reset} ${name}`);
    console.log(`    ${colors.dim}${err.message}${colors.reset}`);
    failed++;
  }
}

function skip(name) {
  console.log(
    `${colors.yellow}  ○${colors.reset} ${name} ${colors.dim}(skipped)${colors.reset}`,
  );
  skipped++;
}

function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }
}

function assertValidJson(filePath) {
  try {
    JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid JSON: ${filePath}`);
  }
}

// Run tests
console.log("\nLorenzo's Claude Code Plugin - Test Suite\n");

// Test: Package structure
console.log("Package Structure:");
test("package.json exists", () => {
  assertExists(path.join(__dirname, "..", "package.json"));
});
test("package.json is valid JSON", () => {
  assertValidJson(path.join(__dirname, "..", "package.json"));
});
test("bin/cli.js exists", () => {
  assertExists(path.join(__dirname, "..", "bin", "cli.js"));
});
test("scripts/lib/utils.js exists", () => {
  assertExists(path.join(__dirname, "..", "scripts", "lib", "utils.js"));
});

// Test: Plugin structure
console.log("\nPlugin Structure:");
test("plugin.json exists", () => {
  assertExists(path.join(__dirname, "..", ".claude-plugin", "plugin.json"));
});
test("plugin.json is valid JSON", () => {
  assertValidJson(path.join(__dirname, "..", ".claude-plugin", "plugin.json"));
});
test("marketplace.json exists", () => {
  assertExists(
    path.join(__dirname, "..", ".claude-plugin", "marketplace.json"),
  );
});
test("marketplace.json is valid JSON", () => {
  assertValidJson(
    path.join(__dirname, "..", ".claude-plugin", "marketplace.json"),
  );
});

// Test: Commands
console.log("\nCommands:");
const commandsDir = path.join(__dirname, "..", ".claude", "commands");
const commandFiles = [];

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findMarkdownFiles(fullPath);
    } else if (file.endsWith(".md")) {
      commandFiles.push(fullPath);
    }
  }
}
findMarkdownFiles(commandsDir);

test(`Found ${commandFiles.length} command files`, () => {
  if (commandFiles.length < 10) {
    throw new Error(
      `Expected at least 10 commands, found ${commandFiles.length}`,
    );
  }
});

test("All commands have frontmatter", () => {
  for (const file of commandFiles) {
    const content = fs.readFileSync(file, "utf8");
    if (!content.startsWith("---")) {
      throw new Error(`Missing frontmatter: ${file}`);
    }
  }
});

// Test: Agents
console.log("\nAgents:");
const agentsDir = path.join(__dirname, "..", ".claude", "agents");
const agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));

test(`Found ${agentFiles.length} agent files`, () => {
  if (agentFiles.length < 5) {
    throw new Error(`Expected at least 5 agents, found ${agentFiles.length}`);
  }
});

test("backend-architect has code examples", () => {
  const content = fs.readFileSync(
    path.join(agentsDir, "backend-architect.md"),
    "utf8",
  );
  if (!content.includes("```typescript")) {
    throw new Error("backend-architect should have TypeScript examples");
  }
});

test("frontend-architect has code examples", () => {
  const content = fs.readFileSync(
    path.join(agentsDir, "frontend-architect.md"),
    "utf8",
  );
  if (!content.includes("```typescript")) {
    throw new Error("frontend-architect should have TypeScript examples");
  }
});

// Test: Skills
console.log("\nSkills:");
const skillsDir = path.join(__dirname, "..", ".claude", "skills");
const skillFiles = [];
const buckets = ["engineering", "productivity"];
for (const bucket of buckets) {
  const bucketDir = path.join(skillsDir, bucket);
  if (fs.existsSync(bucketDir)) {
    const subdirs = fs.readdirSync(bucketDir);
    for (const subdir of subdirs) {
      const skillFile = path.join(bucketDir, subdir, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        skillFiles.push(skillFile);
      }
    }
  }
}

test(`Found ${skillFiles.length} skill files`, () => {
  if (skillFiles.length < 3) {
    throw new Error(`Expected at least 3 skills, found ${skillFiles.length}`);
  }
});

// Test: Hooks
console.log("\nHooks:");
const hooksDir = path.join(__dirname, "..", ".claude", "hooks");

test("hooks.json exists", () => {
  assertExists(path.join(hooksDir, "hooks.json"));
});

test("hooks.json is valid JSON", () => {
  assertValidJson(path.join(hooksDir, "hooks.json"));
});

// Test: Utilities library
console.log("\nUtilities:");
test("utils.js exports required functions", () => {
  const utils = require("../scripts/lib/utils");
  const required = [
    "readJson",
    "writeJson",
    "ensureDir",
    "timestamp",
    "isSensitiveFile",
    "isValidJson",
  ];
  for (const fn of required) {
    if (typeof utils[fn] !== "function") {
      throw new Error(`Missing function: ${fn}`);
    }
  }
});

test("isSensitiveFile detects .env files", () => {
  const utils = require("../scripts/lib/utils");
  if (!utils.isSensitiveFile(".env")) {
    throw new Error(".env should be detected as sensitive");
  }
  if (!utils.isSensitiveFile("credentials.json")) {
    throw new Error("credentials.json should be detected as sensitive");
  }
  if (utils.isSensitiveFile("package.json")) {
    throw new Error("package.json should not be detected as sensitive");
  }
});

test("isValidJson works correctly", () => {
  const utils = require("../scripts/lib/utils");
  if (!utils.isValidJson('{"foo": "bar"}')) {
    throw new Error("Valid JSON not detected");
  }
  if (utils.isValidJson("not json")) {
    throw new Error("Invalid JSON incorrectly validated");
  }
});

// Summary
console.log("\n" + "─".repeat(50));
console.log(`\n${colors.green}Passed: ${passed}${colors.reset}`);
if (failed > 0) {
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
}
if (skipped > 0) {
  console.log(`${colors.yellow}Skipped: ${skipped}${colors.reset}`);
}
console.log("");

process.exit(failed > 0 ? 1 : 0);
