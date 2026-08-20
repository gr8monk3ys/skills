'use strict'

const fs = require('node:fs')
const path = require('node:path')

// Single source of truth for which skill buckets ship in plugin.json, the
// README/CLAUDE.md AUTOGEN tables, and `lcc install`. sync-manifest.js,
// bin/cli.js, and tests/run-all.js all import this instead of hardcoding
// their own copy of the list.
const PROMOTED_BUCKETS = ['engineering', 'productivity']

// The four Claude Code plugin primitives, which live at the REPO ROOT because
// that is where Claude Code discovers them. Everything else the plugin carries
// stays under `.claude/`, which is this repo's own configuration rather than
// what ships. sync-manifest.js and bin/cli.js both import this so "where does a
// primitive live" is answered once — the same reason PROMOTED_BUCKETS exists.
const ROOT_PRIMITIVES = ['commands', 'agents', 'skills', 'hooks']

function unquote(value) {
  if (value.length >= 2) {
    const first = value[0]
    const last = value[value.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1)
    }
  }
  return value
}
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) {
    throw new Error('Missing YAML frontmatter (expected --- ... --- block at top of file)')
  }
  const block = match[1]
  const out = {}
  const lines = block.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    let value = kv[2]
    if (value === '|' || value === '>') {
      for (let j = i + 1; j < lines.length; j++) {
        const cont = lines[j]
        if (!/^\s/.test(cont)) break
        const stripped = cont.trim()
        if (stripped) { value = stripped; break }
      }
    }
    out[key] = unquote(value.trim())
  }
  return out
}
function scanCategory(dir) {
  const out = []
  function walk(current) {
    if (!fs.existsSync(current)) return
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf8')
        const fm = parseFrontmatter(content)
        const name = fm.name || path.basename(entry.name, '.md')
        out.push({ name, description: fm.description || '', path: full })
      }
    }
  }
  walk(dir)
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}
function scanHooks(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.js')) continue
    const name = path.basename(entry.name, '.js')
    out.push({ name, path: path.join(dir, entry.name) })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}
function scanMonitors(dir) {
  const file = path.join(dir, 'monitors.json')
  if (!fs.existsSync(file)) return []
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    throw new Error(`Invalid monitors.json (${file}): ${err.message}`)
  }
  const list = Array.isArray(parsed) ? parsed : []
  const out = list
    .filter(entry => entry && typeof entry.name === 'string')
    .map(entry => ({
      name: entry.name,
      description: typeof entry.description === 'string' ? entry.description : '',
    }))
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}
function toPluginPath(repoRoot, skillFilePath) {
  const rel = path.relative(repoRoot, skillFilePath).split(path.sep).join('/')
  return './' + rel.replace(/\/SKILL\.md$/, '')
}
// Claude Code only honours directory-path manifest entries: `skills` entries
// (./skills/<bucket>/<name>, a directory) resolve; `commands`/`agents`
// entries (./commands/<name>.md, ./agents/<name>.md — file paths) are
// silently ignored whether declared or not, verified empirically against
// CLI 2.1.237 (`claude plugin details` reports the true installed count for
// skills but 0 for an explicitly-declared agents array, matching auto-
// discovery once the array is removed). So plugin.json carries `skills`
// only; `commands` and `agents` are left to convention-based auto-discovery
// from the (flat) `commands/` and `agents/` directories at the plugin root.
// sync-manifest.js still scans those two — the AUTOGEN tables and the count
// line are built from its own scan results, not from here.
function buildPluginJson({ base, version, skills, repoRoot }) {
  return {
    ...base,
    version,
    skills: skills.map(i => toPluginPath(repoRoot, i.path)),
  }
}
function replaceMarker(content, name, replacement) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // `escaped` only contains literal AUTOGEN section names from this repo's own
  // markdown files (commands, agents, skills, hooks, counts) — not user input.
  // Regex metachars are pre-escaped; the pattern is fully bounded.
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
  const re = new RegExp(
    `(<!-- AUTOGEN:${escaped} -->)([\\s\\S]*?)(<!-- /AUTOGEN:${escaped} -->)`,
    'g'
  )
  if (!re.test(content)) {
    throw new Error(`Missing AUTOGEN markers for "${name}". Add <!-- AUTOGEN:${name} --> ... <!-- /AUTOGEN:${name} --> to the file.`)
  }
  re.lastIndex = 0
  return content.replace(re, `$1\n${replacement}\n$3`)
}
function renderTable(rows) {
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
  const lines = ['| Name | Description |', '| --- | --- |']
  for (const row of rows) {
    lines.push(`| \`${esc(row.name)}\` | ${esc(row.description)} |`)
  }
  return lines.join('\n')
}
function scanSkills(dir, buckets) {
  const out = []
  // Best-effort display prefix (e.g. ".claude/skills") for error messages.
  // Purely cosmetic — falls back gracefully for shorter fixture paths.
  const displayRoot = dir.split(path.sep).slice(-2).join('/')
  for (const bucket of buckets) {
    const bucketDir = path.join(dir, bucket)
    if (!fs.existsSync(bucketDir)) continue
    for (const entry of fs.readdirSync(bucketDir, { withFileTypes: true })) {
      if (entry.isFile()) {
        // A directory without SKILL.md is a legitimate support dir and is
        // skipped silently below. A *flat* .md file dropped directly into a
        // bucket is not — it would otherwise vanish with no message anywhere.
        if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
          const skillName = path.basename(entry.name, '.md')
          const found = `${displayRoot}/${bucket}/${entry.name}`
          const expected = `${displayRoot}/${bucket}/${skillName}/SKILL.md`
          throw new Error(
            `Skill files live at <bucket>/<name>/SKILL.md — found a flat file: ${found} (expected ${expected})`
          )
        }
        continue
      }
      if (!entry.isDirectory()) continue
      const skillFile = path.join(bucketDir, entry.name, 'SKILL.md')
      if (!fs.existsSync(skillFile)) continue
      const fm = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'))
      out.push({
        name: fm.name || entry.name,
        description: fm.description || '',
        path: skillFile,
        bucket,
      })
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}
function updateMarketplaceJson(parsed, counts) {
  const { commands, agents, skills, hooks, monitors } = counts
  const next = JSON.parse(JSON.stringify(parsed))
  const countPrefix = `${commands} commands, ${agents} agents, ${skills} skills, ${hooks} hooks, ${monitors} monitors`
  for (const plugin of Array.isArray(next.plugins) ? next.plugins : []) {
    if (typeof plugin.description === 'string') {
      plugin.description = plugin.description.replace(
        /^\d+ commands, \d+ agents, \d+ skills, \d+ hooks, \d+ monitors\b/,
        countPrefix
      )
    }
  }
  return next
}

module.exports = {
  PROMOTED_BUCKETS,
  ROOT_PRIMITIVES,
  parseFrontmatter,
  scanCategory,
  scanHooks,
  scanMonitors,
  toPluginPath,
  buildPluginJson,
  replaceMarker,
  renderTable,
  scanSkills,
  updateMarketplaceJson,
}
