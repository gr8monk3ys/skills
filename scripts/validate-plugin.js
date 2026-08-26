#!/usr/bin/env node

/**
 * Plugin Validation Script
 * Validates plugin.json and auto-discovered commands, agents, and skills
 *
 * Updated to match official Claude Code plugin schema where commands/agents/skills
 * are auto-discovered from directories, not declared in plugin.json.
 *
 * Usage: node scripts/validate-plugin.js
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_PATH = '.claude-plugin/plugin.json';
const COMMANDS_DIR = 'commands';
const AGENTS_DIR = 'agents';
const SKILLS_DIR = 'skills';
// Only these buckets ship (see scripts/lib/manifest.js). misc/ is kept unshipped on purpose.
const PROMOTED_BUCKETS = ['engineering', 'productivity'];

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function success(message) { log(colors.green, '✓', message); }
function error(message) { log(colors.red, '✗', message); }
function warn(message) { log(colors.yellow, '⚠', message); }
function info(message) { log(colors.blue, 'ℹ', message); }

let errors = [];
let warnings = [];

// ============================================
// Plugin.json Validation
// ============================================

function validatePluginJson() {
  console.log('\n' + colors.cyan + '━━━ Validating plugin.json ━━━' + colors.reset + '\n');

  if (!fs.existsSync(PLUGIN_PATH)) {
    error(`plugin.json not found at ${PLUGIN_PATH}`);
    errors.push('Missing plugin.json');
    return null;
  }

  let plugin;
  try {
    const content = fs.readFileSync(PLUGIN_PATH, 'utf8');
    plugin = JSON.parse(content);
    success('Valid JSON syntax');
  } catch (e) {
    error(`Invalid JSON: ${e.message}`);
    errors.push('Invalid JSON in plugin.json');
    return null;
  }

  // Required fields (updated for new schema)
  const requiredFields = ['name', 'version', 'description', 'author'];
  for (const field of requiredFields) {
    if (!plugin[field]) {
      error(`Missing required field: ${field}`);
      errors.push(`Missing field: ${field}`);
    } else {
      success(`Has required field: ${field}`);
    }
  }

  // Author must be an object with name property
  if (plugin.author) {
    if (typeof plugin.author === 'string') {
      error('Author must be an object, not a string');
      errors.push('Invalid author format');
    } else if (typeof plugin.author === 'object') {
      if (!plugin.author.name) {
        error('Author object must have a "name" property');
        errors.push('Missing author.name');
      } else {
        success(`Author: ${plugin.author.name}`);
      }
    }
  }

  // Version format
  if (plugin.version && !/^\d+\.\d+\.\d+$/.test(plugin.version)) {
    warn(`Version "${plugin.version}" doesn't follow semver format (x.y.z)`);
    warnings.push('Non-semver version format');
  }

  // Warn if old-style arrays are present
  if (plugin.commands && Array.isArray(plugin.commands)) {
    warn('commands array in plugin.json is deprecated - commands are auto-discovered from directories');
    warnings.push('Deprecated commands array');
  }
  if (plugin.agents && Array.isArray(plugin.agents)) {
    warn('agents array in plugin.json is deprecated - agents are auto-discovered from directories');
    warnings.push('Deprecated agents array');
  }
  // plugin.skills is intentional: Claude Code honours directory-path entries
  // there, and sync-manifest emits the promoted buckets into it.

  return plugin;
}

// ============================================
// Helper Functions
// ============================================

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

function findMdFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findMdFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ============================================
// Command Validation (Directory-based)
// ============================================

function validateCommands() {
  console.log('\n' + colors.cyan + '━━━ Validating Commands (auto-discovered) ━━━' + colors.reset + '\n');

  if (!fs.existsSync(COMMANDS_DIR)) {
    warn(`Commands directory not found: ${COMMANDS_DIR}`);
    return 0;
  }

  const commandFiles = findMdFiles(COMMANDS_DIR);
  info(`Found ${commandFiles.length} command files`);

  let validCount = 0;

  for (const filePath of commandFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);
    const fileName = path.basename(filePath, '.md');

    if (!frontmatter) {
      error(`No frontmatter in ${filePath}`);
      errors.push(`Missing frontmatter: ${filePath}`);
      continue;
    }

    if (!frontmatter.description) {
      warn(`No description in frontmatter: ${filePath}`);
      warnings.push(`Missing description: ${filePath}`);
    }

    // Check for $ARGUMENTS placeholder (optional but recommended)
    if (!content.includes('$ARGUMENTS')) {
      // Only warn for commands that likely need arguments
      const likelyNeedsArgs = !['memory', 'context', 'map', 'rules', 'ledger'].includes(fileName);
      if (likelyNeedsArgs) {
        warn(`No $ARGUMENTS placeholder in ${filePath}`);
        warnings.push(`Missing $ARGUMENTS: ${filePath}`);
      }
    }

    success(`Command valid: ${fileName}`);
    validCount++;
  }

  return commandFiles.length;
}

// ============================================
// Agent Validation (Directory-based)
// ============================================

function validateAgents() {
  console.log('\n' + colors.cyan + '━━━ Validating Agents (auto-discovered) ━━━' + colors.reset + '\n');

  if (!fs.existsSync(AGENTS_DIR)) {
    warn(`Agents directory not found: ${AGENTS_DIR}`);
    return 0;
  }

  const agentFiles = findMdFiles(AGENTS_DIR);
  info(`Found ${agentFiles.length} agent files`);

  let validCount = 0;

  for (const filePath of agentFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);
    const fileName = path.basename(filePath, '.md');

    if (!frontmatter) {
      error(`No frontmatter in ${filePath}`);
      errors.push(`Missing frontmatter: ${filePath}`);
      continue;
    }

    if (!frontmatter.name) {
      warn(`No name in frontmatter: ${filePath}`);
      warnings.push(`Missing name in frontmatter: ${filePath}`);
    }

    if (!frontmatter.description) {
      warn(`No description in frontmatter: ${filePath}`);
      warnings.push(`Missing description: ${filePath}`);
    }

    // Check agent content structure
    const hasSection = (section) => content.includes(`## ${section}`) || content.includes(`# ${section}`);

    if (!hasSection('Triggers') && !hasSection('Focus Areas') && !hasSection('Behavioral Mindset') && !hasSection('Core')) {
      warn(`Agent ${fileName} may be missing standard sections`);
      warnings.push(`Missing sections: ${fileName}`);
    }

    success(`Agent valid: ${fileName}`);
    validCount++;
  }

  return agentFiles.length;
}

// ============================================
// Skills Validation (Directory-based)
// ============================================

function validateSkills() {
  console.log('\n' + colors.cyan + '━━━ Validating Skills (auto-discovered) ━━━' + colors.reset + '\n');

  if (!fs.existsSync(SKILLS_DIR)) {
    warn(`Skills directory not found: ${SKILLS_DIR}`);
    return 0;
  }

  // Skills live at skills/<bucket>/<skill>/SKILL.md; only promoted buckets ship.
  const skillDirs = [];
  for (const bucket of PROMOTED_BUCKETS) {
    const bucketDir = path.join(SKILLS_DIR, bucket);
    if (!fs.existsSync(bucketDir)) continue;
    for (const d of fs.readdirSync(bucketDir, { withFileTypes: true })) {
      if (d.isDirectory()) skillDirs.push(path.join(bucket, d.name));
    }
  }

  info(`Found ${skillDirs.length} skill directories`);

  let validCount = 0;

  for (const skillDir of skillDirs) {
    const skillPath = path.join(SKILLS_DIR, skillDir, 'SKILL.md');

    if (!fs.existsSync(skillPath)) {
      error(`Missing SKILL.md in ${skillDir}`);
      errors.push(`Missing SKILL.md: ${skillDir}`);
      continue;
    }

    const content = fs.readFileSync(skillPath, 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
      error(`No frontmatter in ${skillPath}`);
      errors.push(`Missing frontmatter: ${skillPath}`);
      continue;
    }

    if (!frontmatter.name) {
      warn(`No name in frontmatter: ${skillPath}`);
      warnings.push(`Missing name: ${skillPath}`);
    }

    if (!frontmatter.description) {
      warn(`No description in frontmatter: ${skillPath}`);
      warnings.push(`Missing description: ${skillPath}`);
    }

    success(`Skill valid: ${skillDir}`);
    validCount++;
  }

  return skillDirs.length;
}

// ============================================
// MCP Server Validation
// ============================================

function validateMcpServers(plugin) {
  console.log('\n' + colors.cyan + '━━━ Validating MCP Servers ━━━' + colors.reset + '\n');

  if (!plugin.mcpServers || typeof plugin.mcpServers !== 'object') {
    info('No mcpServers defined in plugin.json');
    return 0;
  }

  const servers = Object.entries(plugin.mcpServers);
  info(`Found ${servers.length} MCP servers`);

  for (const [name, config] of servers) {
    if (!config.command) {
      error(`MCP server "${name}" missing command`);
      errors.push(`Invalid MCP server: ${name}`);
      continue;
    }

    if (!config.args || !Array.isArray(config.args)) {
      warn(`MCP server "${name}" missing args array`);
      warnings.push(`MCP server missing args: ${name}`);
    }

    success(`MCP server valid: ${name}`);
  }

  return servers.length;
}

// ============================================
// Symlink Validation
// ============================================

function validateSymlinks() {
  console.log('\n' + colors.cyan + '━━━ Validating Directory Structure ━━━' + colors.reset + '\n');

  const expectedSymlinks = ['commands', 'agents', 'skills'];

  for (const link of expectedSymlinks) {
    const linkPath = path.join('.', link);
    try {
      const stats = fs.lstatSync(linkPath);
      if (stats.isSymbolicLink()) {
        const target = fs.readlinkSync(linkPath);
        success(`Symlink: ${link} -> ${target}`);
      } else if (stats.isDirectory()) {
        success(`Directory exists: ${link}`);
      }
    } catch (e) {
      warn(`Missing ${link} directory or symlink at root`);
      warnings.push(`Missing: ${link}`);
    }
  }
}

// ============================================
// Main
// ============================================

function main() {
  console.log('\n' + colors.cyan + '╔════════════════════════════════════════════════╗');
  console.log('║   Lorenzo\'s Claude Code Plugin Validator v2   ║');
  console.log('╚════════════════════════════════════════════════╝' + colors.reset);

  const plugin = validatePluginJson();
  if (!plugin) {
    console.log('\n' + colors.red + 'Validation aborted due to critical errors.' + colors.reset);
    process.exit(1);
  }

  validateSymlinks();

  const commandCount = validateCommands();
  const agentCount = validateAgents();
  const skillCount = validateSkills();
  const mcpCount = validateMcpServers(plugin);

  // Summary
  console.log('\n' + colors.cyan + '━━━ Summary ━━━' + colors.reset + '\n');

  info(`Total: ${commandCount} commands, ${agentCount} agents, ${skillCount} skills, ${mcpCount} MCP servers`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log(colors.green + '\n✓ All validations passed!' + colors.reset);
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.log(colors.yellow + `\n⚠ ${warnings.length} warning(s):` + colors.reset);
    warnings.slice(0, 10).forEach(w => console.log(`  - ${w}`));
    if (warnings.length > 10) {
      console.log(`  ... and ${warnings.length - 10} more`);
    }
  }

  if (errors.length > 0) {
    console.log(colors.red + `\n✗ ${errors.length} error(s):` + colors.reset);
    errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main();
