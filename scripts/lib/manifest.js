'use strict'

const fs = require('node:fs')
const path = require('node:path')

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
    out[key] = value.trim()
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
function buildPluginJson({ base, version, commands, agents, skills, repoRoot }) {
  const toEntry = item => ({
    name: item.name,
    path: path.relative(repoRoot, item.path).split(path.sep).join('/'),
    description: item.description,
  })
  return {
    ...base,
    version,
    commands: commands.map(toEntry),
    agents: agents.map(toEntry),
    skills: skills.map(toEntry),
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
  for (const bucket of buckets) {
    const bucketDir = path.join(dir, bucket)
    if (!fs.existsSync(bucketDir)) continue
    for (const entry of fs.readdirSync(bucketDir, { withFileTypes: true })) {
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

module.exports = { parseFrontmatter, scanCategory, scanHooks, scanMonitors, buildPluginJson, replaceMarker, renderTable, scanSkills }
