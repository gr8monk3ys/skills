#!/usr/bin/env node
/**
 * Post Tool Failure Hook
 * Handles tool failures separately from successes, logs them, and tracks patterns
 * Event: PostToolUseFailure
 *
 * Features:
 * - Logs failures to ~/.claude/logs/failures.json
 * - Sanitizes tool input parameters
 * - Tracks repeated failure patterns
 * - Suggests alternatives after 3+ failures on same tool
 *
 * Cross-platform Node.js implementation
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude')
const LOGS_DIR = path.join(CLAUDE_DIR, 'logs')
const FAILURES_FILE = path.join(LOGS_DIR, 'failures.json')
const FAILURE_THRESHOLD = 3
const MAX_LOG_ENTRIES = 500
const PATTERN_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

// Sensitive keys to sanitize from tool inputs
const SENSITIVE_KEYS = [
  'content',
  'password',
  'secret',
  'token',
  'key',
  'credential',
  'auth',
  'api_key',
  'apiKey',
  'private',
]

// Alternative suggestions for common tools
const TOOL_ALTERNATIVES = {
  Edit: [
    'Use Write tool to replace entire file if edit keeps failing',
    'Read the file again to verify current content',
    'Check if old_string matches exactly (whitespace, indentation)',
  ],
  Write: [
    'Check file permissions and directory existence',
    'Verify the directory path exists before writing',
    'Try writing to a different location first',
  ],
  Bash: [
    'Break command into smaller steps',
    'Check if required tools are installed',
    'Verify working directory and file paths',
    'Try running with explicit paths',
  ],
  Read: [
    'Verify the file path exists with Glob or Bash ls',
    'Check file permissions',
    'Try reading parent directory first',
  ],
  Grep: [
    'Simplify the regex pattern',
    'Try searching in a smaller scope',
    'Use Glob to find files first, then Read them',
  ],
  Glob: [
    'Verify the search directory exists',
    'Try a simpler pattern first',
    'Use Bash find as an alternative',
  ],
}

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] post-tool-failure: ${context} - ${err.message}`)
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Sanitize tool input parameters
function sanitizeInput(input) {
  if (!input || typeof input !== 'object') {
    return input
  }

  const sanitized = {}

  for (const [key, value] of Object.entries(input)) {
    const keyLower = key.toLowerCase()
    const isSensitive = SENSITIVE_KEYS.some((sk) => keyLower.includes(sk))

    if (isSensitive) {
      if (typeof value === 'string') {
        sanitized[key] = `[REDACTED - ${value.length} chars]`
      } else {
        sanitized[key] = '[REDACTED]'
      }
    } else if (typeof value === 'string' && value.length > 200) {
      // Truncate long strings
      sanitized[key] = value.slice(0, 200) + `... [truncated - ${value.length} chars total]`
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Extract brief error message from output
function extractBriefError(output) {
  if (!output) return 'Unknown error'

  const outputStr = String(output)

  // Try to find common error patterns
  const patterns = [
    /error:\s*(.+?)(?:\n|$)/i,
    /failed:\s*(.+?)(?:\n|$)/i,
    /exception:\s*(.+?)(?:\n|$)/i,
    /Error:\s*(.+?)(?:\n|$)/,
    /cannot\s+(.+?)(?:\n|$)/i,
    /unable\s+to\s+(.+?)(?:\n|$)/i,
    /no\s+such\s+(.+?)(?:\n|$)/i,
  ]

  for (const pattern of patterns) {
    const match = outputStr.match(pattern)
    if (match) {
      return match[1].trim().slice(0, 100)
    }
  }

  // Fallback: first line, truncated
  const firstLine = outputStr.split('\n')[0].trim()
  return firstLine.slice(0, 100) || 'Unknown error'
}

// Read failures log
function readFailures() {
  if (!fs.existsSync(FAILURES_FILE)) {
    return []
  }

  try {
    const data = fs.readFileSync(FAILURES_FILE, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    logError('readFailures', err)
    return []
  }
}

// Write failures log
function writeFailures(failures) {
  try {
    // Keep only the most recent entries
    const trimmed = failures.slice(-MAX_LOG_ENTRIES)
    fs.writeFileSync(FAILURES_FILE, JSON.stringify(trimmed, null, 2))
  } catch (err) {
    logError('writeFailures', err)
  }
}

// Count recent failures for a specific tool
function countRecentToolFailures(failures, toolName) {
  const cutoff = Date.now() - PATTERN_WINDOW_MS
  return failures.filter(
    (f) => f.tool === toolName && new Date(f.timestamp).getTime() > cutoff
  ).length
}

// Get alternative suggestions for a tool
function getAlternatives(toolName) {
  return TOOL_ALTERNATIVES[toolName] || [
    'Try a different approach to accomplish the same goal',
    'Break the task into smaller steps',
    'Verify prerequisites are met before retrying',
  ]
}

// Read stdin
async function readStdin() {
  return new Promise((resolve) => {
    let data = ''
    let resolved = false

    const done = (result) => {
      if (!resolved) {
        resolved = true
        resolve(result)
      }
    }

    process.stdin.setEncoding('utf8')
    process.stdin.on('readable', () => {
      let chunk
      while ((chunk = process.stdin.read())) {
        data += chunk
      }
    })
    process.stdin.on('end', () => {
      try {
        done(JSON.parse(data))
      } catch (err) {
        logError('stdin parse', err)
        done({})
      }
    })
    process.stdin.on('error', (err) => {
      logError('stdin read', err)
      done({})
    })

    // Timeout handling
    const checkTimeout = () => {
      if (!resolved) {
        if (data.length === 0) {
          done({})
        } else {
          setTimeout(() => done({}), 200)
        }
      }
    }
    setTimeout(checkTimeout, 500)
  })
}

// Main execution
async function main() {
  ensureDir(LOGS_DIR)

  const input = await readStdin()

  const toolName = input.tool_name || 'Unknown'
  const toolInput = input.tool_input || {}
  const toolOutput = input.tool_output || ''
  const exitCode = input.exit_code

  // Create failure entry
  const failureEntry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    error: extractBriefError(toolOutput),
    exitCode: exitCode,
    input: sanitizeInput(toolInput),
    fullOutput: String(toolOutput).slice(0, 500),
  }

  // Read existing failures and add new entry
  const failures = readFailures()
  failures.push(failureEntry)
  writeFailures(failures)

  // Output failure notification
  console.error(`[Failure] ${toolName} failed: ${failureEntry.error}`)

  // Check for repeated failures pattern
  const recentCount = countRecentToolFailures(failures, toolName)

  if (recentCount >= FAILURE_THRESHOLD) {
    console.error('')
    console.error('============================================================')
    console.error(`[Pattern Detected] ${toolName} has failed ${recentCount} times recently`)
    console.error('============================================================')
    console.error('')
    console.error('Consider these alternative approaches:')
    const alternatives = getAlternatives(toolName)
    alternatives.forEach((alt, i) => {
      console.error(`  ${i + 1}. ${alt}`)
    })
    console.error('')
    console.error(`Failure log: ${FAILURES_FILE}`)
    console.error('============================================================')
    console.error('')
  }

  process.exit(0)
}

main()
