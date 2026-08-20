#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const m = require('./lib/manifest')

const REPO_ROOT = path.resolve(__dirname, '..')
const PLUGIN_JSON = path.join(REPO_ROOT, '.claude-plugin', 'plugin.json')
const MARKETPLACE_JSON = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json')
const PACKAGE_JSON = path.join(REPO_ROOT, 'package.json')
const README = path.join(REPO_ROOT, 'README.md')
const CLAUDE_MD = path.join(REPO_ROOT, 'CLAUDE.md')
const PROMOTED = m.PROMOTED_BUCKETS

const CHECK = process.argv.includes('--check')

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')) }
function diffOrWrite(file, nextContent) {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  if (cur === nextContent) return { changed: false, file }
  if (CHECK) return { changed: true, file, drift: true }
  fs.writeFileSync(file, nextContent)
  return { changed: true, file, wrote: true }
}

function main() {
  const pkg = readJson(PACKAGE_JSON)
  const basePlugin = readJson(PLUGIN_JSON)

  const commands = m.scanCategory(path.join(REPO_ROOT, 'commands'))
  const agents = m.scanCategory(path.join(REPO_ROOT, 'agents'))
  const skills = m.scanSkills(path.join(REPO_ROOT, 'skills'), PROMOTED)
  const hooks = m.scanHooks(path.join(REPO_ROOT, 'hooks'))
  const monitors = m.scanMonitors(path.join(REPO_ROOT, '.claude/monitors'))

  const next = m.buildPluginJson({
    base: {
      name: basePlugin.name,
      description: pkg.description,
      author: basePlugin.author,
      license: basePlugin.license,
      repository: basePlugin.repository,
      homepage: basePlugin.homepage,
      keywords: pkg.keywords,
      mcpServers: basePlugin.mcpServers,
    },
    version: pkg.version,
    commands,
    agents,
    skills,
    repoRoot: REPO_ROOT,
  })

  const nextJson = JSON.stringify(next, null, 2) + '\n'
  const results = []
  results.push(diffOrWrite(PLUGIN_JSON, nextJson))

  // marketplace.json is JSON, so it can't carry AUTOGEN comment markers like
  // README/CLAUDE.md. Its count prefix inside `description` is regenerated
  // by parsing, editing in place, and re-serializing instead, through the
  // same diffOrWrite drift mechanism as every other target.
  const marketplace = readJson(MARKETPLACE_JSON)
  const nextMarketplace = m.updateMarketplaceJson(marketplace, {
    commands: commands.length,
    agents: agents.length,
    skills: skills.length,
    hooks: hooks.length,
    monitors: monitors.length,
  })
  const nextMarketplaceJson = JSON.stringify(nextMarketplace, null, 2) + '\n'
  results.push(diffOrWrite(MARKETPLACE_JSON, nextMarketplaceJson))

  const blocks = {
    commands: toCommandRows(commands),
    agents: toRows(agents),
    skills: toRows(skills),
    hooks: toHookRows(hooks),
    monitors: toRows(monitors),
    counts: renderCounts(commands, agents, skills, hooks, monitors),
  }
  // Drift prevention only works if the markers themselves are present. Each
  // target file declares the markers it must carry; missing markers are an
  // error (not a silent skip), so deleting a marker is treated like any
  // other drift and fails CI.
  const required = [
    [README, ['counts', 'commands', 'agents', 'skills', 'hooks', 'monitors']],
    [CLAUDE_MD, ['counts', 'commands', 'agents', 'skills']],
  ]

  const missingMarkers = []
  for (const [target, names] of required) {
    if (!fs.existsSync(target)) continue
    let content = fs.readFileSync(target, 'utf8')
    for (const name of names) {
      if (!content.includes(`<!-- AUTOGEN:${name} -->`)) {
        missingMarkers.push({ file: target, name })
        continue
      }
      content = m.replaceMarker(content, name, blocks[name])
    }
    results.push(diffOrWrite(target, content))
  }

  if (missingMarkers.length) {
    console.error('Required AUTOGEN markers are missing:')
    for (const { file, name } of missingMarkers) {
      console.error(`  - ${path.relative(REPO_ROOT, file)}: <!-- AUTOGEN:${name} --> ... <!-- /AUTOGEN:${name} -->`)
    }
    process.exit(1)
  }

  const drifted = results.filter(r => r.drift)
  if (CHECK && drifted.length) {
    console.error('Manifest drift detected. Run `node scripts/sync-manifest.js` to update:')
    for (const d of drifted) console.error('  -', path.relative(REPO_ROOT, d.file))
    process.exit(1)
  }
  for (const r of results) {
    if (r.wrote) console.log('updated', path.relative(REPO_ROOT, r.file))
  }
}

function toCommandRows(items) {
  return m.renderTable(items.map(c => ({ name: '/' + c.name, description: c.description })))
}
function toRows(items) {
  return m.renderTable(items.map(c => ({ name: c.name, description: c.description })))
}
function toHookRows(items) {
  return m.renderTable(items.map(c => ({ name: c.name, description: '' })))
}
function renderCounts(commands, agents, skills, hooks, monitors) {
  return [
    `**${commands.length} commands**`,
    `**${agents.length} agents**`,
    `**${skills.length} skills**`,
    `**${hooks.length} hooks**`,
    `**${monitors.length} monitors**`,
  ].join(' · ')
}

main()
