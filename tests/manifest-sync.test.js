const { test } = require('node:test')
const assert = require('node:assert/strict')
const manifest = require('../scripts/lib/manifest')

test('manifest module exports required helpers', () => {
  assert.equal(typeof manifest.parseFrontmatter, 'function')
  assert.equal(typeof manifest.scanCategory, 'function')
  assert.equal(typeof manifest.scanHooks, 'function')
  assert.equal(typeof manifest.scanMonitors, 'function')
  assert.equal(typeof manifest.buildPluginJson, 'function')
  assert.equal(typeof manifest.replaceMarker, 'function')
  assert.equal(typeof manifest.renderTable, 'function')
  assert.equal(typeof manifest.scanSkills, 'function')
  assert.equal(typeof manifest.updateMarketplaceJson, 'function')
})

test('PROMOTED_BUCKETS is exported and is the single source of truth for shipped skill buckets', () => {
  assert.deepEqual(manifest.PROMOTED_BUCKETS, ['engineering', 'productivity'])
})

test('parseFrontmatter extracts name and single-line description', () => {
  const content = `---
name: api-new
description: Create a new Next.js API route with validation
model: claude-opus-4-5
---

Body content.
`
  const fm = manifest.parseFrontmatter(content)
  assert.equal(fm.name, 'api-new')
  assert.equal(fm.description, 'Create a new Next.js API route with validation')
})

test('parseFrontmatter handles multi-line description (block scalar) by taking first non-empty line', () => {
  const content = `---
name: api-development
description: |
  WHEN to auto-invoke: Creating API routes, building endpoints.
  WHEN NOT to invoke: Pure frontend work.
---
Body.`
  const fm = manifest.parseFrontmatter(content)
  assert.equal(fm.name, 'api-development')
  assert.equal(fm.description, 'WHEN to auto-invoke: Creating API routes, building endpoints.')
})

test('parseFrontmatter throws when frontmatter block is missing', () => {
  assert.throws(() => manifest.parseFrontmatter('no frontmatter here\n'), /frontmatter/i)
})

test('parseFrontmatter strips a single matching pair of surrounding double quotes', () => {
  const content = `---
name: resolving-merge-conflicts
description: "Use when you need to resolve an in-progress git merge/rebase conflict."
---

Body.
`
  const fm = manifest.parseFrontmatter(content)
  assert.equal(fm.description, 'Use when you need to resolve an in-progress git merge/rebase conflict.')
})

test('parseFrontmatter strips a single matching pair of surrounding single quotes', () => {
  const content = `---
name: x
description: 'hello world'
---
Body.`
  const fm = manifest.parseFrontmatter(content)
  assert.equal(fm.description, 'hello world')
})

test('parseFrontmatter leaves unquoted and unmatched-quote scalars alone', () => {
  const unquoted = manifest.parseFrontmatter(`---\nname: x\ndescription: plain text\n---\nBody.`)
  assert.equal(unquoted.description, 'plain text')

  const unmatched = manifest.parseFrontmatter(`---\nname: y\ndescription: "opens but never closes\n---\nBody.`)
  assert.equal(unmatched.description, '"opens but never closes')
})

const path = require('node:path')

test('scanCategory walks subdirectories and parses each .md', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/commands')
  const entries = manifest.scanCategory(fixtures)
  assert.equal(entries.length, 2)
  const names = entries.map(e => e.name).sort()
  assert.deepEqual(names, ['api-new', 'component-new'])
  const apiNew = entries.find(e => e.name === 'api-new')
  assert.equal(apiNew.description, 'Create a new Next.js API route with validation')
  assert.match(apiNew.path.replace(/\\/g, '/'), /commands\/api\/api-new\.md$/)
})

test('scanCategory results are stable-sorted by name', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/commands')
  const a = manifest.scanCategory(fixtures).map(e => e.name)
  const b = manifest.scanCategory(fixtures).map(e => e.name)
  assert.deepEqual(a, b)
  assert.deepEqual(a, [...a].sort())
})

test('scanHooks lists .js hook scripts but skips .json config', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/hooks')
  const hooks = manifest.scanHooks(fixtures)
  assert.equal(hooks.length, 1)
  assert.equal(hooks[0].name, 'auto-format')
  assert.match(hooks[0].path.replace(/\\/g, '/'), /hooks\/auto-format\.js$/)
})

test('scanMonitors parses monitors.json, drops nameless entries, sorts by name', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/monitors')
  const monitors = manifest.scanMonitors(fixtures)
  assert.equal(monitors.length, 2)
  assert.deepEqual(monitors.map(mon => mon.name), ['alpha-watch', 'zeta-watch'])
  assert.equal(monitors[0].description, 'First alphabetically')
})

test('scanMonitors returns [] when monitors.json is absent', () => {
  const missing = path.join(__dirname, 'fixtures/manifest/commands')
  assert.deepEqual(manifest.scanMonitors(missing), [])
})

test('replaceMarker replaces content between paired markers', () => {
  const input = `Top text.

<!-- AUTOGEN:commands -->
old content here
<!-- /AUTOGEN:commands -->

Bottom text.
`
  const out = manifest.replaceMarker(input, 'commands', '| Command | Description |\n| --- | --- |\n| /foo | Bar |')
  assert.match(out, /Top text\./)
  assert.match(out, /Bottom text\./)
  assert.match(out, /\| \/foo \| Bar \|/)
  assert.doesNotMatch(out, /old content here/)
})

test('replaceMarker is idempotent', () => {
  const input = `<!-- AUTOGEN:x -->\nold\n<!-- /AUTOGEN:x -->`
  const once = manifest.replaceMarker(input, 'x', 'NEW')
  const twice = manifest.replaceMarker(once, 'x', 'NEW')
  assert.equal(once, twice)
})

test('replaceMarker throws when markers missing', () => {
  assert.throws(() => manifest.replaceMarker('no markers here', 'x', 'NEW'), /AUTOGEN:x/)
})

test('replaceMarker leaves other markers untouched', () => {
  const input = `<!-- AUTOGEN:a -->\noldA\n<!-- /AUTOGEN:a -->
<!-- AUTOGEN:b -->\noldB\n<!-- /AUTOGEN:b -->`
  const out = manifest.replaceMarker(input, 'a', 'NEW_A')
  assert.match(out, /oldB/)
  assert.match(out, /NEW_A/)
})

test('renderTable produces a 2-column markdown table', () => {
  const out = manifest.renderTable([
    { name: '/api-new', description: 'Create API route' },
    { name: '/component-new', description: 'Create component' },
  ])
  assert.equal(out, [
    '| Name | Description |',
    '| --- | --- |',
    '| `/api-new` | Create API route |',
    '| `/component-new` | Create component |',
  ].join('\n'))
})

test('renderTable escapes pipe characters in descriptions', () => {
  const out = manifest.renderTable([{ name: 'x', description: 'a | b' }])
  assert.match(out, /a \\\| b/)
})

test('buildPluginJson assembles a manifest with arrays and preserves mcpServers', () => {
  const inputs = {
    base: {
      name: 'lorenzos-claude-code',
      author: { name: 'Lorenzo' },
      mcpServers: { context7: { command: 'npx', args: [] } },
      profiles: { minimal: '.claude/profiles/mcp-minimal.json' },
    },
    version: '4.0.0',
    commands: [
      { name: 'api-new', description: 'Create API', path: '/abs/commands/api/api-new.md' },
    ],
    agents: [
      { name: 'code-reviewer', description: 'Reviews', path: '/abs/agents/code-reviewer.md' },
    ],
    skills: [
      { name: 'api-development', description: 'API patterns', path: '/abs/skills/engineering/api-development/SKILL.md' },
    ],
    repoRoot: '/abs',
  }
  const out = manifest.buildPluginJson(inputs)
  assert.equal(out.name, 'lorenzos-claude-code')
  assert.equal(out.version, '4.0.0')
  assert.equal(out.commands.length, 1)
  assert.deepEqual(out.commands, ['./commands/api/api-new.md'])
  assert.deepEqual(out.agents, ['./agents/code-reviewer.md'])
  assert.deepEqual(out.skills, ['./skills/engineering/api-development'])
  assert.deepEqual(out.mcpServers, { context7: { command: 'npx', args: [] } })
  assert.deepEqual(out.profiles, { minimal: '.claude/profiles/mcp-minimal.json' })
})

test('scanSkills returns only promoted-bucket skills, reading SKILL.md only', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills')
  const entries = manifest.scanSkills(fixtures, ['engineering', 'productivity'])
  assert.deepEqual(entries.map(e => e.name), ['alpha', 'beta'])
  const alpha = entries.find(e => e.name === 'alpha')
  assert.equal(alpha.bucket, 'engineering')
  assert.equal(alpha.description, 'Alpha engineering skill')
  assert.match(alpha.path.replace(/\\/g, '/'), /skills\/engineering\/alpha\/SKILL\.md$/)
})

test('scanSkills ignores bucket READMEs, support files, and non-promoted buckets', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills')
  const entries = manifest.scanSkills(fixtures, ['engineering', 'productivity'])
  assert.ok(!entries.some(e => e.name === 'old-skill'))
  assert.ok(!entries.some(e => e.name === 'notes'))
  assert.ok(!entries.some(e => e.name === 'README'))
})

test('scanSkills tolerates a missing bucket directory', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills')
  const entries = manifest.scanSkills(fixtures, ['engineering', 'does-not-exist'])
  assert.deepEqual(entries.map(e => e.name), ['alpha'])
})

test('scanSkills throws on a stray flat .md file dropped directly in a bucket', () => {
  // Separate fixture tree from tests/fixtures/manifest/skills/ so the tests
  // above (asserting on that tree's exact contents) keep passing unchanged.
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills-invalid')
  assert.throws(
    () => manifest.scanSkills(fixtures, ['engineering', 'productivity']),
    /SKILL\.md/
  )
})

test('updateMarketplaceJson rewrites the count prefix and features, preserving key order and other fields', () => {
  const input = {
    description: 'top-level description, untouched',
    name: 'lorenzos-claude-code',
    plugins: [
      {
        author: { name: 'Lorenzo' },
        description: '17 commands, 6 agents, 4 skills, 14 hooks, 2 monitors. Scaffolds Next.js + React + Supabase code.',
        features: { agents: 6, commands: 17, hooks: 14, mcpServers: 4, monitors: 2, skills: 4 },
        name: 'lorenzos-claude-code',
      },
    ],
  }
  const out = manifest.updateMarketplaceJson(input, {
    commands: 17,
    agents: 6,
    skills: 14,
    hooks: 14,
    monitors: 2,
  })
  const plugin = out.plugins[0]
  assert.deepEqual(plugin.features, { agents: 6, commands: 17, hooks: 14, mcpServers: 4, monitors: 2, skills: 14 })
  assert.deepEqual(Object.keys(plugin.features), ['agents', 'commands', 'hooks', 'mcpServers', 'monitors', 'skills'])
  assert.equal(
    plugin.description,
    '17 commands, 6 agents, 14 skills, 14 hooks, 2 monitors. Scaffolds Next.js + React + Supabase code.'
  )
  assert.equal(out.description, 'top-level description, untouched')
  assert.equal(plugin.author.name, 'Lorenzo')
  // Original input is not mutated.
  assert.equal(input.plugins[0].features.skills, 4)
})

const { execFileSync } = require('node:child_process')

test('sync-manifest --check passes against committed state', () => {
  const repoRoot = path.join(__dirname, '..')
  execFileSync('node', ['scripts/sync-manifest.js', '--check'], { cwd: repoRoot, stdio: 'pipe' })
})

test('toPluginPath returns a ./-prefixed repo-relative path', () => {
  const p = manifest.toPluginPath('/repo', '/repo/commands/nextjs/api-new.md')
  assert.equal(p, './commands/nextjs/api-new.md')
})

test('toPluginPath strips the SKILL.md suffix for skills', () => {
  const p = manifest.toPluginPath('/repo', '/repo/skills/engineering/wizard/SKILL.md', { stripSkillFile: true })
  assert.equal(p, './skills/engineering/wizard')
})

test('buildPluginJson emits path strings, not objects', () => {
  const next = manifest.buildPluginJson({
    base: { name: 'p' },
    version: '1.0.0',
    commands: [{ name: 'c', description: 'd', path: '/repo/commands/api/c.md' }],
    agents: [{ name: 'a', description: 'd', path: '/repo/agents/a.md' }],
    skills: [{ name: 's', description: 'd', path: '/repo/skills/engineering/s/SKILL.md' }],
    repoRoot: '/repo',
  })
  assert.deepEqual(next.commands, ['./commands/api/c.md'])
  assert.deepEqual(next.agents, ['./agents/a.md'])
  assert.deepEqual(next.skills, ['./skills/engineering/s'])
})
