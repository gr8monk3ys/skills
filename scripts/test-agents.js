#!/usr/bin/env node

/**
 * Agent Prompt Test Suite
 * Validates agent prompts for quality, consistency, and best practices
 *
 * Usage: node scripts/test-agents.js
 */

const fs = require('fs');

const PLUGIN_PATH = '.claude-plugin/plugin.json';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

function test(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${colors.green}✓${colors.reset} ${description}`);
    return true;
  } else {
    failedTests++;
    console.log(`  ${colors.red}✗${colors.reset} ${description}`);
    if (details) console.log(`    ${colors.dim}${details}${colors.reset}`);
    return false;
  }
}

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

function getAgentContent(content) {
  // Remove frontmatter
  return content.replace(/^---\n[\s\S]*?\n---\n*/, '');
}

// ============================================
// Agent Tests
// ============================================

function testAgentStructure(name, content, frontmatter) {
  console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);

  const agentContent = getAgentContent(content);
  const wordCount = agentContent.split(/\s+/).length;

  // Frontmatter tests
  test('Has name in frontmatter', !!frontmatter?.name);
  test('Has description in frontmatter', !!frontmatter?.description);
  test('Description is actionable (starts with verb)',
    frontmatter?.description?.match(/^(Design|Create|Build|Optimize|Analyze|Research|Transform|Improve|Identify|Teach)/i),
    `Got: "${frontmatter?.description?.slice(0, 50)}..."`
  );

  // Structure tests
  const hasH1 = agentContent.includes('# ');
  const hasH2 = agentContent.includes('## ');
  test('Has main heading (# )', hasH1);
  test('Has sections (## )', hasH2);

  // Content quality tests
  const sections = agentContent.match(/## \w+/g) || [];
  test('Has at least 3 sections', sections.length >= 3, `Found ${sections.length} sections`);

  // Check for recommended sections
  const recommendedSections = ['Triggers', 'Focus Areas', 'Key Actions', 'Outputs', 'Boundaries'];
  const foundSections = recommendedSections.filter(s =>
    agentContent.toLowerCase().includes(s.toLowerCase())
  );
  test('Has standard agent sections', foundSections.length >= 3,
    `Found: ${foundSections.join(', ')}`
  );

  // Content length tests
  test('Prompt is substantial (500+ words)', wordCount >= 500, `Word count: ${wordCount}`);
  test('Prompt is not too long (< 5000 words)', wordCount < 5000, `Word count: ${wordCount}`);

  // Best practices tests
  test('Has "Will" section (capabilities)',
    agentContent.includes('**Will:**') || agentContent.includes('Will:'));
  test('Has "Will Not" section (boundaries)',
    agentContent.includes('**Will Not:**') || agentContent.includes('Will Not:'));

  // Pattern tests
  const hasBulletPoints = agentContent.includes('- ');
  const hasNumberedList = agentContent.match(/^\d+\./m);
  test('Uses bullet points or numbered lists', hasBulletPoints || hasNumberedList);

  // Code example tests (for technical agents)
  const technicalAgents = ['database-architect', 'api-architect', 'devops-engineer', 'backend-architect', 'frontend-architect'];
  if (technicalAgents.includes(name)) {
    const hasCodeBlock = agentContent.includes('```');
    test('Technical agent has code examples', hasCodeBlock);
  }

  // Avoid anti-patterns
  test('No TODO markers', !agentContent.includes('TODO') && !agentContent.includes('FIXME'));
  test('No placeholder text', !agentContent.includes('[INSERT') && !agentContent.includes('{{'));
  test('No personal pronouns (I, me, my)',
    !agentContent.match(/\b(I will|I can|my experience|me to)\b/i),
    'Agents should speak in third person'
  );
}

function testAgentConsistency(agents) {
  console.log(`\n${colors.cyan}━━━ Consistency Tests ━━━${colors.reset}`);

  // Check all agents have similar structure
  const allFrontmatters = agents.map(a => a.frontmatter);

  // Check name format consistency
  const nameFormats = allFrontmatters.map(f => f?.name?.includes('-') ? 'kebab' : 'other');
  const allKebab = nameFormats.every(f => f === 'kebab');
  test('All agent names use kebab-case', allKebab);

  // Check category usage
  const withCategory = allFrontmatters.filter(f => f?.category).length;
  const withoutCategory = allFrontmatters.filter(f => !f?.category).length;
  if (withCategory > 0 && withoutCategory > 0) {
    test('Category field usage is consistent', false,
      `${withCategory} have category, ${withoutCategory} don't`);
  } else {
    test('Category field usage is consistent', true);
  }

  // Check for unique descriptions
  const descriptions = allFrontmatters.map(f => f?.description).filter(Boolean);
  const uniqueDescriptions = new Set(descriptions);
  test('All agent descriptions are unique', descriptions.length === uniqueDescriptions.size);
}

function testAgentCoverage(agents) {
  console.log(`\n${colors.cyan}━━━ Coverage Tests ━━━${colors.reset}`);

  const categories = {
    architecture: ['system-architect', 'backend-architect', 'frontend-architect', 'database-architect', 'api-architect'],
    quality: ['refactoring-expert', 'performance-engineer', 'security-engineer'],
    documentation: ['technical-writer', 'learning-guide'],
    research: ['tech-stack-researcher', 'deep-research-agent', 'requirements-analyst'],
    operations: ['devops-engineer'],
  };

  const agentNames = agents.map(a => a.name);

  for (const [category, expected] of Object.entries(categories)) {
    const found = expected.filter(name => agentNames.includes(name));
    test(`${category} category has agents (${found.length}/${expected.length})`,
      found.length > 0,
      found.length < expected.length ? `Missing: ${expected.filter(n => !found.includes(n)).join(', ')}` : ''
    );
  }
}

// ============================================
// Main
// ============================================

function main() {
  console.log('\n' + colors.cyan + '╔════════════════════════════════════════╗');
  console.log('║      Agent Prompt Test Suite           ║');
  console.log('╚════════════════════════════════════════╝' + colors.reset);

  // Load plugin config
  if (!fs.existsSync(PLUGIN_PATH)) {
    console.error(`${colors.red}Error: plugin.json not found${colors.reset}`);
    process.exit(1);
  }

  const plugin = JSON.parse(fs.readFileSync(PLUGIN_PATH, 'utf8'));
  const agents = [];

  // Load and test each agent
  for (const agent of plugin.agents || []) {
    if (!fs.existsSync(agent.path)) {
      console.log(`\n${colors.red}Skipping ${agent.name}: file not found${colors.reset}`);
      continue;
    }

    const content = fs.readFileSync(agent.path, 'utf8');
    const frontmatter = extractFrontmatter(content);

    agents.push({
      name: agent.name,
      path: agent.path,
      content,
      frontmatter,
    });

    testAgentStructure(agent.name, content, frontmatter);
  }

  // Run cross-agent tests
  testAgentConsistency(agents);
  testAgentCoverage(agents);

  // Summary
  console.log('\n' + colors.cyan + '━━━ Test Summary ━━━' + colors.reset + '\n');
  console.log(`  Total:   ${totalTests}`);
  console.log(`  ${colors.green}Passed:  ${passedTests}${colors.reset}`);
  console.log(`  ${colors.red}Failed:  ${failedTests}${colors.reset}`);
  if (skippedTests > 0) {
    console.log(`  ${colors.yellow}Skipped: ${skippedTests}${colors.reset}`);
  }

  const passRate = ((passedTests / (totalTests - skippedTests)) * 100).toFixed(1);
  console.log(`\n  Pass rate: ${passRate}%`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}Some tests failed.${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.green}All tests passed!${colors.reset}`);
  process.exit(0);
}

main();
