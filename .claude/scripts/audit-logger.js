/**
 * Audit Logger Utility
 *
 * Provides centralized logging functionality for Claude Code hooks and scripts.
 * Writes to ~/.claude/logs/{category}.json with automatic file rotation.
 *
 * @example
 * const { logEvent } = require('./audit-logger')
 * logEvent('trash', 'file_moved', { source: '/path/to/file', destination: '/path/to/trash' })
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// Configuration
const MAX_FILE_SIZE = 1024 * 1024 // 1MB
const LOGS_DIR = path.join(os.homedir(), '.claude', 'logs')

/**
 * Ensures the logs directory exists
 * @returns {void}
 */
function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }
}

/**
 * Gets the log file path for a category
 * @param {string} category - Log category name
 * @returns {string} Full path to the log file
 */
function getLogPath(category) {
  return path.join(LOGS_DIR, `${category}.json`)
}

/**
 * Gets the rotated log file path
 * @param {string} category - Log category name
 * @param {number} index - Rotation index
 * @returns {string} Full path to the rotated log file
 */
function getRotatedLogPath(category, index) {
  return path.join(LOGS_DIR, `${category}.${index}.json`)
}

/**
 * Rotates log files when size exceeds MAX_FILE_SIZE
 * @param {string} category - Log category name
 * @returns {void}
 */
function rotateLogFile(category) {
  const logPath = getLogPath(category)

  if (!fs.existsSync(logPath)) {
    return
  }

  const stats = fs.statSync(logPath)

  if (stats.size < MAX_FILE_SIZE) {
    return
  }

  // Find the next available rotation index
  let index = 1
  while (fs.existsSync(getRotatedLogPath(category, index))) {
    index++
  }

  // Rotate the current file
  const rotatedPath = getRotatedLogPath(category, index)
  fs.renameSync(logPath, rotatedPath)
}

/**
 * Reads existing log entries from a file
 * @param {string} logPath - Path to the log file
 * @returns {Array} Array of log entries
 */
function readLogEntries(logPath) {
  if (!fs.existsSync(logPath)) {
    return []
  }

  try {
    const content = fs.readFileSync(logPath, 'utf8')
    return JSON.parse(content)
  } catch {
    // If file is corrupted, start fresh
    return []
  }
}

/**
 * Writes log entries to a file
 * @param {string} logPath - Path to the log file
 * @param {Array} entries - Array of log entries
 * @returns {void}
 */
function writeLogEntries(logPath, entries) {
  fs.writeFileSync(logPath, JSON.stringify(entries, null, 2), 'utf8')
}

/**
 * Logs an event to the specified category log file
 * @param {string} category - Log category (e.g., 'trash', 'hooks', 'errors')
 * @param {string} event - Event name/type
 * @param {Object} data - Additional event data
 * @returns {Object} The logged entry
 */
function logEvent(category, event, data = {}) {
  ensureLogsDir()
  rotateLogFile(category)

  const logPath = getLogPath(category)
  const entries = readLogEntries(logPath)

  const entry = {
    timestamp: new Date().toISOString(),
    event,
    data,
    pid: process.pid,
    platform: process.platform
  }

  entries.push(entry)
  writeLogEntries(logPath, entries)

  return entry
}

/**
 * Gets all log entries for a category
 * @param {string} category - Log category
 * @param {Object} options - Query options
 * @param {Date} options.since - Only return entries after this date
 * @param {number} options.limit - Maximum number of entries to return
 * @returns {Array} Array of log entries
 */
function getEvents(category, options = {}) {
  ensureLogsDir()

  const logPath = getLogPath(category)
  let entries = readLogEntries(logPath)

  // Include rotated files if needed
  let index = 1
  while (fs.existsSync(getRotatedLogPath(category, index))) {
    const rotatedEntries = readLogEntries(getRotatedLogPath(category, index))
    entries = rotatedEntries.concat(entries)
    index++
  }

  // Filter by date if specified
  if (options.since) {
    const sinceDate = new Date(options.since)
    entries = entries.filter(e => new Date(e.timestamp) >= sinceDate)
  }

  // Apply limit
  if (options.limit && options.limit > 0) {
    entries = entries.slice(-options.limit)
  }

  return entries
}

/**
 * Clears all log entries for a category
 * @param {string} category - Log category
 * @returns {void}
 */
function clearLogs(category) {
  ensureLogsDir()

  const logPath = getLogPath(category)

  // Remove main log file
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath)
  }

  // Remove rotated files
  let index = 1
  while (fs.existsSync(getRotatedLogPath(category, index))) {
    fs.unlinkSync(getRotatedLogPath(category, index))
    index++
  }
}

/**
 * Gets the logs directory path
 * @returns {string} Path to logs directory
 */
function getLogsDir() {
  return LOGS_DIR
}

module.exports = {
  logEvent,
  getEvents,
  clearLogs,
  getLogsDir,
  MAX_FILE_SIZE
}
