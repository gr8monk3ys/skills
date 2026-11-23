#!/usr/bin/env node

/**
 * Safe Deletion Wrapper (trash.js)
 *
 * Moves files to ~/.claude/trash/ instead of permanently deleting them.
 * Preserves directory structure and adds timestamp prefix to avoid collisions.
 * Auto-cleans files older than 30 days.
 *
 * Usage: node trash.js <file1> [file2] ...
 *
 * @example
 * node trash.js ./src/old-file.js ./tests/deprecated.test.js
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { logEvent } = require('./audit-logger')

// Configuration
const TRASH_DIR = path.join(os.homedir(), '.claude', 'trash')
const RETENTION_DAYS = 30
const LOG_CATEGORY = 'trash'

/**
 * Ensures the trash directory exists
 * @returns {void}
 */
function ensureTrashDir() {
  if (!fs.existsSync(TRASH_DIR)) {
    fs.mkdirSync(TRASH_DIR, { recursive: true })
  }
}

/**
 * Generates a timestamp prefix for collision avoidance
 * @returns {string} Timestamp in format YYYYMMDD_HHmmss_SSS
 */
function getTimestampPrefix() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const ms = String(now.getMilliseconds()).padStart(3, '0')

  return `${year}${month}${day}_${hours}${minutes}${seconds}_${ms}`
}

/**
 * Converts an absolute path to a relative structure for trash
 * Handles both Unix and Windows paths
 * @param {string} filePath - Absolute file path
 * @returns {string} Relative path structure
 */
function getRelativePath(filePath) {
  const absolutePath = path.resolve(filePath)

  // Remove drive letter on Windows (C:\ -> C_drive\)
  if (process.platform === 'win32') {
    return absolutePath.replace(/^([A-Za-z]):/, '$1_drive')
  }

  // Remove leading slash on Unix
  return absolutePath.replace(/^\//, '')
}

/**
 * Moves a file to trash
 * @param {string} filePath - Path to the file to trash
 * @returns {Object} Result object with success status and details
 */
function moveToTrash(filePath) {
  const absolutePath = path.resolve(filePath)

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      error: `File not found: ${filePath}`,
      source: absolutePath
    }
  }

  // Get file stats
  const stats = fs.statSync(absolutePath)
  const isDirectory = stats.isDirectory()

  // Generate trash path with timestamp prefix
  const timestamp = getTimestampPrefix()
  const relativePath = getRelativePath(absolutePath)
  const trashPath = path.join(TRASH_DIR, timestamp, relativePath)

  // Ensure parent directory exists in trash
  const trashParentDir = path.dirname(trashPath)
  if (!fs.existsSync(trashParentDir)) {
    fs.mkdirSync(trashParentDir, { recursive: true })
  }

  try {
    // Move file/directory to trash
    fs.renameSync(absolutePath, trashPath)

    // Log the deletion
    logEvent(LOG_CATEGORY, 'file_moved', {
      source: absolutePath,
      destination: trashPath,
      isDirectory,
      size: stats.size,
      originalMtime: stats.mtime.toISOString()
    })

    return {
      success: true,
      source: absolutePath,
      destination: trashPath,
      isDirectory
    }
  } catch {
    // If rename fails (cross-device), try copy and delete
    try {
      if (isDirectory) {
        copyDirRecursive(absolutePath, trashPath)
        fs.rmSync(absolutePath, { recursive: true, force: true })
      } else {
        fs.copyFileSync(absolutePath, trashPath)
        fs.unlinkSync(absolutePath)
      }

      logEvent(LOG_CATEGORY, 'file_moved', {
        source: absolutePath,
        destination: trashPath,
        isDirectory,
        size: stats.size,
        originalMtime: stats.mtime.toISOString(),
        method: 'copy_delete'
      })

      return {
        success: true,
        source: absolutePath,
        destination: trashPath,
        isDirectory
      }
    } catch (copyError) {
      return {
        success: false,
        error: copyError.message,
        source: absolutePath
      }
    }
  }
}

/**
 * Recursively copies a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

/**
 * Cleans up trash files older than RETENTION_DAYS
 * @returns {Object} Cleanup results
 */
function cleanupOldTrash() {
  if (!fs.existsSync(TRASH_DIR)) {
    return { cleaned: 0, errors: [] }
  }

  const now = Date.now()
  const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000
  let cleaned = 0
  const errors = []

  // Get all timestamp directories in trash
  const entries = fs.readdirSync(TRASH_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const entryPath = path.join(TRASH_DIR, entry.name)

    // Extract timestamp from directory name (format: YYYYMMDD_HHmmss_SSS)
    const match = entry.name.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_(\d{3})/)

    if (!match) {
      continue
    }

    const [, year, month, day, hours, minutes, seconds] = match
    const entryDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )

    const age = now - entryDate.getTime()

    if (age > maxAge) {
      try {
        fs.rmSync(entryPath, { recursive: true, force: true })
        cleaned++

        logEvent(LOG_CATEGORY, 'cleanup', {
          path: entryPath,
          age_days: Math.floor(age / (24 * 60 * 60 * 1000))
        })
      } catch (error) {
        errors.push({ path: entryPath, error: error.message })
      }
    }
  }

  return { cleaned, errors }
}

/**
 * Lists all items in trash
 * @returns {Array} Array of trash items
 */
function listTrash() {
  if (!fs.existsSync(TRASH_DIR)) {
    return []
  }

  const items = []
  const entries = fs.readdirSync(TRASH_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const entryPath = path.join(TRASH_DIR, entry.name)
    const stats = fs.statSync(entryPath)

    items.push({
      timestamp: entry.name,
      path: entryPath,
      created: stats.birthtime || stats.mtime
    })
  }

  return items.sort((a, b) => b.created - a.created)
}

/**
 * Restores a file from trash to its original location
 * @param {string} trashTimestamp - Timestamp directory name
 * @param {string} relativePath - Relative path within the timestamp directory
 * @returns {Object} Restore result
 */
function restoreFromTrash(trashTimestamp, relativePath) {
  const trashPath = path.join(TRASH_DIR, trashTimestamp, relativePath)

  if (!fs.existsSync(trashPath)) {
    return {
      success: false,
      error: `File not found in trash: ${trashPath}`
    }
  }

  // Reconstruct original path
  let originalPath
  if (process.platform === 'win32') {
    originalPath = relativePath.replace(/^([A-Za-z])_drive/, '$1:')
  } else {
    originalPath = '/' + relativePath
  }

  // Check if original location is available
  if (fs.existsSync(originalPath)) {
    return {
      success: false,
      error: `Original location already exists: ${originalPath}`
    }
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(originalPath)
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true })
  }

  try {
    fs.renameSync(trashPath, originalPath)

    logEvent(LOG_CATEGORY, 'file_restored', {
      source: trashPath,
      destination: originalPath
    })

    return {
      success: true,
      source: trashPath,
      destination: originalPath
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Main CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: node trash.js <file1> [file2] ...')
    console.log('')
    console.log('Options:')
    console.log('  --list         List all items in trash')
    console.log('  --cleanup      Remove items older than 30 days')
    console.log('  --help         Show this help message')
    process.exit(1)
  }

  // Handle special commands
  if (args[0] === '--list') {
    const items = listTrash()
    if (items.length === 0) {
      console.log('[Trash] Trash is empty')
    } else {
      console.log('[Trash] Items in trash:')
      items.forEach(item => {
        console.log(`  ${item.timestamp} - ${item.path}`)
      })
    }
    process.exit(0)
  }

  if (args[0] === '--cleanup') {
    ensureTrashDir()
    const result = cleanupOldTrash()
    console.log(`[Trash] Cleaned up ${result.cleaned} old item(s)`)
    if (result.errors.length > 0) {
      result.errors.forEach(err => {
        console.error(`[Trash] Error: ${err.path} - ${err.error}`)
      })
    }
    process.exit(0)
  }

  if (args[0] === '--help') {
    console.log('Safe Deletion Wrapper')
    console.log('')
    console.log('Moves files to ~/.claude/trash/ instead of permanently deleting them.')
    console.log('Files are automatically cleaned up after 30 days.')
    console.log('')
    console.log('Usage: node trash.js <file1> [file2] ...')
    console.log('')
    console.log('Options:')
    console.log('  --list         List all items in trash')
    console.log('  --cleanup      Remove items older than 30 days')
    console.log('  --help         Show this help message')
    process.exit(0)
  }

  // Ensure trash directory exists
  ensureTrashDir()

  // Run cleanup before adding new items
  cleanupOldTrash()

  // Process each file
  let hasErrors = false

  for (const filePath of args) {
    const result = moveToTrash(filePath)

    if (result.success) {
      console.log(`[Trash] Moved ${result.source} to trash`)
    } else {
      console.error(`[Trash] Error: ${result.error}`)
      hasErrors = true
    }
  }

  process.exit(hasErrors ? 1 : 0)
}

// Export for use as a module
module.exports = {
  moveToTrash,
  listTrash,
  restoreFromTrash,
  cleanupOldTrash,
  TRASH_DIR,
  RETENTION_DAYS
}
