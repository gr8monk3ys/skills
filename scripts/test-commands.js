#!/usr/bin/env node

/**
 * Command Template Testing Script
 * Tests command markdown files for proper structure, placeholders, and content
 *
 * Usage: node scripts/test-commands.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
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

function warn(message) { log(colors.yellow, '⚠', message); }
function info(message) { log(colors.blue, 'ℹ', message); }

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

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

function recordTest(name, passed, message) {
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// ============================================
// Command-Specific Tests
// ============================================

function testFrontmatter(filePath, content) {
  const testName = `${path.basename(filePath)}: Frontmatter`;

  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    recordTest(testName, false, 'Missing frontmatter');
    return false;
  }

  // Check required fields
  if (!frontmatter.description && !frontmatter.model) {
    recordTest(testName, false, 'Missing description and model');
    return false;
  }

  if (!frontmatter.description) {
    recordTest(testName, false, 'Missing description field');
    return false;
  }

  if (!frontmatter.model) {
    testResults.warnings++;
    warn(`${testName}: Missing model field (will use default)`);
  }

  // Validate model value
  const validModels = ['opus', 'sonnet', 'haiku', 'inherit'];
  if (frontmatter.model && !validModels.includes(frontmatter.model)) {
    testResults.warnings++;
    warn(`${testName}: Unknown model "${frontmatter.model}"`);
  }

  recordTest(testName, true, 'Valid frontmatter');
  return true;
}

function testArgumentsPlaceholder(filePath, content) {
  const testName = `${path.basename(filePath)}: $ARGUMENTS placeholder`;

  // Skip this test for certain commands that don't need arguments
  const noArgsCommands = ['types-gen.md', 'wizard.md', 'lint.md'];
  if (noArgsCommands.some(cmd => filePath.includes(cmd))) {
    info(`${testName}: Skipped (command doesn't require arguments)`);
    return true;
  }

  if (!content.includes('$ARGUMENTS')) {
    testResults.warnings++;
    warn(`${testName}: Missing $ARGUMENTS placeholder`);
    return true; // Warning, not failure
  }

  recordTest(testName, true, 'Has $ARGUMENTS placeholder');
  return true;
}

function testContentStructure(filePath, content) {
  const testName = `${path.basename(filePath)}: Content structure`;

  // Check for reasonable content length
  if (content.length < 100) {
    recordTest(testName, false, 'Content too short (< 100 chars)');
    return false;
  }

  // Check for at least one heading
  if (!content.match(/^#+\s+/m)) {
    testResults.warnings++;
    warn(`${testName}: No markdown headings found`);
  }

  // Check for code blocks (most commands should have examples)
  const hasCodeBlocks = content.includes('```');
  if (!hasCodeBlocks) {
    testResults.warnings++;
    warn(`${testName}: No code examples found`);
  }

  recordTest(testName, true, 'Content structure looks good');
  return true;
}

function testModelConsistency(filePath, content) {
  const testName = `${path.basename(filePath)}: Model consistency`;

  const frontmatter = extractFrontmatter(content);
  if (!frontmatter || !frontmatter.model) {
    return true; // Skip if no model specified
  }

  // API commands should use opus for best results
  if (filePath.includes('/api/') && frontmatter.model !== 'opus') {
    testResults.warnings++;
    warn(`${testName}: API commands should use opus for best results`);
  }

  recordTest(testName, true, 'Model assignment appropriate');
  return true;
}

function testCommandQuality(filePath, content) {
  const testName = `${path.basename(filePath)}: Quality checks`;

  // Check for common issues
  const issues = [];

  // Check for placeholder text
  if (content.match(/TODO|FIXME|XXX/i)) {
    issues.push('Contains TODO/FIXME markers');
  }

  // Check for broken markdown links
  const brokenLinks = content.match(/\[([^\]]+)\]\(\)/g);
  if (brokenLinks) {
    issues.push(`Found ${brokenLinks.length} empty link(s)`);
  }

  // Check for extremely long lines (> 200 chars) which might indicate formatting issues
  const lines = content.split('\n');
  const longLines = lines.filter(line => {
    // Ignore code blocks and links
    if (line.trim().startsWith('```') || line.includes('http')) return false;
    return line.length > 200;
  });

  if (longLines.length > 3) {
    issues.push(`${longLines.length} very long lines (> 200 chars)`);
  }

  if (issues.length > 0) {
    testResults.warnings++;
    warn(`${testName}: ${issues.join(', ')}`);
  } else {
    recordTest(testName, true, 'Quality checks passed');
  }

  return true;
}

// ============================================
// Main Testing Function
// ============================================

function testCommand(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Run all tests
    testFrontmatter(filePath, content);
    testArgumentsPlaceholder(filePath, content);
    testContentStructure(filePath, content);
    testModelConsistency(filePath, content);
    testCommandQuality(filePath, content);

  } catch (error) {
    recordTest(filePath, false, `Error reading file: ${error.message}`);
  }
}

function findCommandFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findCommandFiles(fullPath));
    } else if (item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================
// Main Execution
// ============================================

function main() {
  console.log('\n' + colors.cyan + '╔════════════════════════════════════════╗');
  console.log('║   Command Template Test Suite          ║');
  console.log('╚════════════════════════════════════════╝' + colors.reset + '\n');

  const commandsDir = '.claude/commands';
  const commandFiles = findCommandFiles(commandsDir);

  info(`Found ${commandFiles.length} command files to test\n`);

  // Test each command file
  for (const file of commandFiles) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(colors.cyan + `\n━━━ Testing: ${relativePath} ━━━` + colors.reset);
    testCommand(file);
  }

  // Print summary
  console.log('\n' + colors.cyan + '━━━ Test Summary ━━━' + colors.reset + '\n');

  console.log(`${colors.green}✓ Passed:${colors.reset} ${testResults.passed}`);
  console.log(`${colors.red}✗ Failed:${colors.reset} ${testResults.failed}`);
  console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${testResults.warnings}`);

  // Show failed tests
  if (testResults.failed > 0) {
    console.log('\n' + colors.red + 'Failed Tests:' + colors.reset);
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
  }

  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n' + colors.red + '✗ Tests failed' + colors.reset);
    process.exit(1);
  } else {
    console.log('\n' + colors.green + '✓ All tests passed!' + colors.reset);
    process.exit(0);
  }
}

main();
