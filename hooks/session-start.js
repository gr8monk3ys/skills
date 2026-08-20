#!/usr/bin/env node
/**
 * Session Start Hook - Memory Persistence System
 * Restores previous context when Claude sessions begin
 * Event: SessionStart
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Configuration - supports CLAUDE_HOME env var
const CLAUDE_DIR = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
const SESSIONS_DIR = path.join(CLAUDE_DIR, "sessions");
const LEARNED_SKILLS_DIR = path.join(CLAUDE_DIR, "skills", "learned");
const MAX_AGE_DAYS = 7;

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] session-start: ${context} - ${err.message}`);
}

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Find files matching criteria
function findFiles(dir, extension, maxAgeDays = null) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  const cutoff = maxAgeDays ? Date.now() - maxAgeDays * 24 * 60 * 60 * 1000 : 0;

  try {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(extension)) continue;

      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (maxAgeDays && stats.mtimeMs < cutoff) continue;

      files.push({
        path: filePath,
        name: file,
        mtime: stats.mtimeMs,
      });
    }
  } catch (err) {
    logError(`findFiles(${dir})`, err);
  }

  return files.sort((a, b) => b.mtime - a.mtime);
}

// Read JSON file safely
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    logError(`readJson(${path.basename(filePath)})`, err);
    return null;
  }
}

// Main execution
function main() {
  ensureDir(SESSIONS_DIR);
  ensureDir(LEARNED_SKILLS_DIR);

  // Find recent sessions
  const recentSessions = findFiles(SESSIONS_DIR, ".json", MAX_AGE_DAYS);

  if (recentSessions.length > 0) {
    console.error(
      `[Memory] Found ${recentSessions.length} recent session(s) from the past ${MAX_AGE_DAYS} days`,
    );

    const latestSession = recentSessions[0];
    console.error(`[Memory] Latest session: ${latestSession.name}`);

    // Extract key context from the latest session
    const sessionData = readJson(latestSession.path);
    if (sessionData && sessionData.project_context) {
      console.error(
        `[Memory] Project context available: ${sessionData.project_context}`,
      );
    }
  }

  // Find learned skills
  const learnedSkills = findFiles(LEARNED_SKILLS_DIR, ".md");

  if (learnedSkills.length > 0) {
    console.error(
      `[Memory] ${learnedSkills.length} learned skill(s) available from previous sessions`,
    );
    for (const skill of learnedSkills) {
      const skillName = path.basename(skill.name, ".md");
      console.error(`[Memory] - ${skillName}`);
    }
  }

  // Check for project-specific memory
  if (fs.existsSync(".claude/memory.json")) {
    console.error("[Memory] Project-specific memory file found");
  }

  // Output nothing to stdout (success)
  process.exit(0);
}

main();
