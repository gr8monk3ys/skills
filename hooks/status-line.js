#!/usr/bin/env node
/**
 * Status Line Hook - Token and Context Tracking
 * Displays session statistics including token usage, cache rates, and context window
 * Event: Notification
 *
 * Cross-platform Node.js implementation
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude')
const STATE_DIR = path.join(CLAUDE_DIR, '.status-line')
const STATE_FILE = path.join(STATE_DIR, 'state.json')
const HISTORY_FILE = path.join(STATE_DIR, 'history.log')
const MAX_CONTEXT_TOKENS = 200000 // Claude's context window (adjust as needed)
const MAX_HISTORY_ENTRIES = 1000

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] status-line: ${context} - ${err.message}`)
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Read JSON file safely
function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    logError(`readJson(${path.basename(filePath)})`, err)
    return null
  }
}

// Write JSON file safely
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (err) {
    logError(`writeJson(${path.basename(filePath)})`, err)
  }
}

// Append to history log
function appendHistory(entry) {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    fs.appendFileSync(HISTORY_FILE, `${timestamp}|${JSON.stringify(entry)}\n`)

    // Trim history if too large
    trimHistory()
  } catch (err) {
    logError('appendHistory', err)
  }
}

// Trim history file to max entries
function trimHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return

    const content = fs.readFileSync(HISTORY_FILE, 'utf8')
    const lines = content.split('\n').filter(Boolean)

    if (lines.length > MAX_HISTORY_ENTRIES) {
      const trimmed = lines.slice(-MAX_HISTORY_ENTRIES)
      fs.writeFileSync(HISTORY_FILE, trimmed.join('\n') + '\n')
    }
  } catch (err) {
    logError('trimHistory', err)
  }
}

// Format number with K/M suffix
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// Calculate cache hit rate
function calculateCacheRate(state) {
  const cacheHits = state.cache_read_tokens || 0
  const totalInput = state.total_input_tokens || 0

  if (totalInput === 0) return 0

  // Cache rate is cached reads as percentage of total potential cache
  const cacheRate = (cacheHits / totalInput) * 100
  return Math.min(100, Math.round(cacheRate))
}

// Calculate context usage percentage
function calculateContextUsage(state) {
  const totalTokens = (state.total_input_tokens || 0) + (state.total_output_tokens || 0)
  const usage = (totalTokens / MAX_CONTEXT_TOKENS) * 100
  return Math.min(100, Math.round(usage))
}

// Get default state
function getDefaultState() {
  return {
    session_start: Date.now(),
    total_input_tokens: 0,
    total_output_tokens: 0,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    message_count: 0,
    last_update: Date.now()
  }
}

// Read stdin asynchronously
async function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('readable', () => {
      let chunk
      while ((chunk = process.stdin.read())) {
        data += chunk
      }
    })
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data))
      } catch (err) {
        logError('stdin parse', err)
        resolve({})
      }
    })
    process.stdin.on('error', (err) => {
      logError('stdin read', err)
      resolve({})
    })
    // Timeout after 500ms if no input
    setTimeout(() => resolve({}), 500)
  })
}

// Display status line
function displayStatus(state) {
  const inputTokens = state.total_input_tokens || 0
  const outputTokens = state.total_output_tokens || 0
  const cacheRate = calculateCacheRate(state)
  const contextUsage = calculateContextUsage(state)

  const statusLine = `[Status] Tokens: ${formatNumber(inputTokens)}/${formatNumber(outputTokens)} | Cache: ${cacheRate}% | Context: ${contextUsage}% used`

  console.error(statusLine)
}

// Main execution
async function main() {
  ensureDir(STATE_DIR)

  const input = await readStdin()

  // Load or initialize state
  let state = readJson(STATE_FILE) || getDefaultState()

  // Check if this is a new session (more than 1 hour since last update)
  const oneHour = 60 * 60 * 1000
  if (state.last_update && (Date.now() - state.last_update) > oneHour) {
    // Archive old state to history
    appendHistory({
      type: 'session_end',
      ...state
    })
    // Start fresh state
    state = getDefaultState()
  }

  // Extract token data from notification
  // Notification events may include usage data in various formats
  const notificationData = input.notification || input

  // Handle different notification types
  if (notificationData.type === 'usage' || notificationData.usage) {
    const usage = notificationData.usage || notificationData

    // Update cumulative token counts
    if (usage.input_tokens) {
      state.total_input_tokens += usage.input_tokens
    }
    if (usage.output_tokens) {
      state.total_output_tokens += usage.output_tokens
    }
    if (usage.cache_read_input_tokens) {
      state.cache_read_tokens += usage.cache_read_input_tokens
    }
    if (usage.cache_creation_input_tokens) {
      state.cache_creation_tokens += usage.cache_creation_input_tokens
    }

    state.message_count++
    state.last_update = Date.now()

    // Save updated state
    writeJson(STATE_FILE, state)

    // Log to history
    appendHistory({
      type: 'usage_update',
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      cache_read: usage.cache_read_input_tokens || 0,
      cache_creation: usage.cache_creation_input_tokens || 0
    })

    // Display status line
    displayStatus(state)
  } else if (notificationData.type === 'message') {
    // Handle message notifications
    state.message_count++
    state.last_update = Date.now()
    writeJson(STATE_FILE, state)

    // Display current status
    displayStatus(state)
  } else if (notificationData.type === 'reset' || notificationData.reset) {
    // Handle explicit reset request
    appendHistory({
      type: 'session_reset',
      ...state
    })
    state = getDefaultState()
    writeJson(STATE_FILE, state)
    console.error('[Status] Session statistics reset')
  } else {
    // For any other notification, just display current status
    if (state.total_input_tokens > 0 || state.total_output_tokens > 0) {
      displayStatus(state)
    }
  }

  process.exit(0)
}

main()
