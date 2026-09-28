const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const {
  askLaya,
  calculateConfidence,
  layaConfig,
  layaQuestion,
  promptText,
} = require('../hooks/skill-activator')

const SKILLS = [
  { name: 'database-operations', keywords: ['database', 'schema', 'sql'] },
  { name: 'frontend-development', keywords: ['component', 'react'] },
]
const CONFIG = layaConfig({ SKILL_ACTIVATOR_LAYA_URL: 'http://laya.test:8000/' })

function fakeLaya(answer, { ok = true, calls = [] } = {}) {
  return async (url, init) => {
    calls.push({ url, init })
    return { ok, json: async () => ({ answers: { skill: answer } }) }
  }
}

test('laya is off without SKILL_ACTIVATOR_LAYA_URL', async () => {
  assert.equal(layaConfig({}), null)
  const calls = []
  assert.equal(await askLaya('add a table', SKILLS, null, fakeLaya({}, { calls })), null)
  assert.equal(calls.length, 0)
})

test('laya config normalises the endpoint and applies defaults', () => {
  assert.equal(CONFIG.endpoint, 'http://laya.test:8000/v1/systemone')
  assert.equal(CONFIG.timeoutMs, 800)
  assert.equal(CONFIG.minConfidence, 0.5)
})

test('laya is asked one choice question over the skills plus "none"', async () => {
  const calls = []
  const config = layaConfig({
    SKILL_ACTIVATOR_LAYA_URL: 'http://laya.test',
    SKILL_ACTIVATOR_LAYA_API_KEY: 'k',
  })
  await askLaya('add a table', SKILLS, config, fakeLaya({ choice: 'none' }, { calls }))
  assert.equal(calls[0].init.headers.authorization, 'Bearer k')
  const body = JSON.parse(calls[0].init.body)
  assert.equal(body.state, 'add a table')
  assert.equal(body.questions.skill.type, 'choice')
  assert.deepEqual(Object.keys(body.questions.skill.criteria), [
    'database-operations',
    'frontend-development',
    'none',
  ])
})

test('a confident laya pick is returned', async () => {
  const pick = await askLaya(
    'store user profiles',
    SKILLS,
    CONFIG,
    fakeLaya({ choice: 'database-operations', answer_confidence: 0.8 })
  )
  assert.deepEqual(pick, { skill: 'database-operations', confidence: 0.8 })
})

test('"none", unknown skills, low confidence and failures are no vote', async () => {
  for (const answer of [
    { choice: 'none', answer_confidence: 0.9 },
    { choice: 'made-up-skill', answer_confidence: 0.9 },
    { choice: 'database-operations', answer_confidence: 0.2 },
  ]) {
    assert.equal(await askLaya('x', SKILLS, CONFIG, fakeLaya(answer)), null)
  }
  assert.equal(await askLaya('x', SKILLS, CONFIG, fakeLaya({}, { ok: false })), null)
  const failing = async () => {
    throw new Error('ECONNREFUSED')
  }
  assert.equal(await askLaya('x', SKILLS, CONFIG, failing), null)
})

test('a laya vote alone never reaches the suggest threshold', () => {
  const empty = { keywords: [], patterns: [], filePaths: [], directories: [], intents: [] }
  const weights = require('../hooks/skill-rules.json').weights
  const score = calculateConfidence({ ...empty, laya: { confidence: 0.99 } }, weights, 0)
  assert.equal(score, weights.laya)
  assert.ok(score < require('../hooks/skill-rules.json').confidenceThreshold.suggest)
})

test('promptText reads the hook payload, falling back to raw text', () => {
  assert.equal(promptText(JSON.stringify({ prompt: 'hi' })), 'hi')
  assert.equal(promptText('plain text'), 'plain text')
})

test('layaQuestion falls back from description to keywords to name', () => {
  const q = layaQuestion([{ name: 'a', description: 'desc' }, { name: 'b', keywords: ['x', 'y'] }, { name: 'c' }])
  assert.deepEqual(q.criteria, { a: 'desc', b: 'x, y', c: 'c', none: q.criteria.none })
})

test('the hook still runs as a script with laya unset', () => {
  const env = { ...process.env }
  delete env.SKILL_ACTIVATOR_LAYA_URL
  const out = execFileSync('node', ['hooks/skill-activator.js'], {
    cwd: path.join(__dirname, '..'),
    input: JSON.stringify({ prompt: 'write a row level security policy' }),
    encoding: 'utf8',
    env,
  })
  assert.match(out, /database-operations/)
})
