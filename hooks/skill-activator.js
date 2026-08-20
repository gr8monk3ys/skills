#!/usr/bin/env node
/**
 * Skill Auto-Evaluation Hook
 * Multi-dimensional skill analysis with confidence scoring
 * Event: UserPromptSubmit
 *
 * Analyzes prompts across 5 dimensions:
 * - Keywords (direct word matches)
 * - Patterns (regex matches)
 * - File paths (extracted from prompt)
 * - Directories (map to skill areas)
 * - Intents (goal/action detection)
 *
 * Cross-platform Node.js implementation
 */

const fs = require("fs");
const path = require("path");

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] skill-activator: ${context} - ${err.message}`);
}

// Load skill rules from JSON file
function loadRules() {
  const rulesPath = path.join(__dirname, "skill-rules.json");
  try {
    if (fs.existsSync(rulesPath)) {
      return JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    }
  } catch (err) {
    logError("loadRules", err);
  }
  return null;
}

// Extract file paths from prompt text
function extractFilePaths(prompt) {
  const paths = [];

  // Match common file path patterns
  const patterns = [
    // Unix-style paths: src/components/Button.tsx
    /(?:^|[\s"'`(])([a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)+\.[a-zA-Z0-9]+)/g,
    // Windows-style paths: src\components\Button.tsx
    /(?:^|[\s"'`(])([a-zA-Z0-9._-]+(?:\\[a-zA-Z0-9._-]+)+\.[a-zA-Z0-9]+)/g,
    // Relative paths: ./src/api/route.ts
    /(?:^|[\s"'`(])(\.\.?\/[a-zA-Z0-9._/-]+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      paths.push(match[1]);
    }
  }

  return [...new Set(paths)]; // Dedupe
}

// Match keywords in prompt (case-insensitive, word boundaries)
function matchKeywords(prompt, keywords) {
  const matches = [];
  const promptLower = prompt.toLowerCase();

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    // Check for word boundary or phrase match
    if (promptLower.includes(keywordLower)) {
      matches.push(keyword);
    }
  }

  return matches;
}

// Match regex patterns in prompt
function matchPatterns(prompt, patterns) {
  const matches = [];

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, "i");
      if (regex.test(prompt)) {
        matches.push(pattern);
      }
    } catch (err) {
      // Invalid regex, skip
    }
  }

  return matches;
}

// Check if any extracted file paths match skill directories
function matchDirectories(filePaths, directories) {
  const matches = [];

  for (const filePath of filePaths) {
    for (const dir of directories) {
      if (filePath.includes(dir) || filePath.startsWith(dir)) {
        matches.push({ path: filePath, directory: dir });
      }
    }
  }

  return matches;
}

// Detect user intents using regex patterns
function matchIntents(prompt, intents) {
  const matches = [];
  const promptLower = prompt.toLowerCase();

  for (const intent of intents) {
    try {
      const regex = new RegExp(intent, "i");
      if (regex.test(promptLower)) {
        matches.push(intent);
      }
    } catch (err) {
      // Invalid regex, skip
    }
  }

  return matches;
}

// Calculate confidence score for a skill
function calculateConfidence(skillMatches, weights, priority) {
  let score = 0;

  score += skillMatches.keywords.length * weights.keyword;
  score += skillMatches.patterns.length * weights.pattern;
  score += skillMatches.filePaths.length * weights.filePath;
  score += skillMatches.directories.length * weights.directory;
  score += skillMatches.intents.length * weights.intent;

  // Add priority bonus for high-priority skills
  if (priority >= 90) {
    score += 2;
  }

  return score;
}

// Format match details for output
function formatMatches(skillMatches, weights) {
  const details = [];

  for (const kw of skillMatches.keywords) {
    details.push(`keyword:${kw} (+${weights.keyword}pts)`);
  }
  for (const p of skillMatches.patterns) {
    details.push(`pattern:${p} (+${weights.pattern}pts)`);
  }
  for (const fp of skillMatches.filePaths) {
    details.push(`filepath:${fp} (+${weights.filePath}pts)`);
  }
  for (const d of skillMatches.directories) {
    details.push(`directory:${d.directory} (+${weights.directory}pts)`);
  }
  for (const i of skillMatches.intents) {
    details.push(`intent:${i} (+${weights.intent}pts)`);
  }

  return details;
}

// Read stdin (the user's prompt)
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read())) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", (err) => {
      logError("stdin read", err);
      resolve("");
    });
    setTimeout(() => resolve(data || ""), 500);
  });
}

// Main execution
async function main() {
  const prompt = await readStdin();

  if (!prompt || prompt.trim().length === 0) {
    process.exit(0);
  }

  const rules = loadRules();
  if (!rules) {
    // Fallback to basic hint if rules can't be loaded
    console.error("[skill-activator] Could not load skill-rules.json");
    process.exit(0);
  }

  const { weights, skills, confidenceThreshold } = rules;
  const activateThreshold = confidenceThreshold.activate || 8;
  const suggestThreshold = confidenceThreshold.suggest || 5;

  // Extract file paths from prompt
  const extractedPaths = extractFilePaths(prompt);

  // Evaluate each skill
  const evaluations = [];

  for (const skill of skills) {
    const skillMatches = {
      keywords: matchKeywords(prompt, skill.keywords || []),
      patterns: matchPatterns(prompt, skill.patterns || []),
      filePaths: extractedPaths.filter((p) =>
        (skill.directories || []).some((d) => p.includes(d))
      ),
      directories: matchDirectories(extractedPaths, skill.directories || []),
      intents: matchIntents(prompt, skill.intents || []),
    };

    const confidence = calculateConfidence(
      skillMatches,
      weights,
      skill.priority || 0
    );

    if (confidence >= suggestThreshold) {
      evaluations.push({
        name: skill.name,
        confidence,
        priority: skill.priority || 0,
        status: confidence >= activateThreshold ? "activate" : "suggest",
        matches: formatMatches(skillMatches, weights),
      });
    }
  }

  // Sort by confidence (descending), then by priority
  evaluations.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.priority - a.priority;
  });

  // Output evaluation results
  if (evaluations.length > 0) {
    console.log("");
    console.log("<skill-evaluation>");
    console.log(`  <threshold activate="${activateThreshold}" suggest="${suggestThreshold}" />`);
    console.log(`  <analyzed-paths>${extractedPaths.length > 0 ? extractedPaths.join(", ") : "none"}</analyzed-paths>`);
    console.log("");

    for (const evaluation of evaluations) {
      const statusIcon = evaluation.status === "activate" ? "→" : "?";
      console.log(`  <skill name="${evaluation.name}" confidence="${evaluation.confidence}" status="${evaluation.status}">`);

      if (evaluation.matches.length > 0) {
        console.log("    <matches>");
        for (const match of evaluation.matches.slice(0, 5)) {
          console.log(`      ${match}`);
        }
        if (evaluation.matches.length > 5) {
          console.log(`      ... and ${evaluation.matches.length - 5} more`);
        }
        console.log("    </matches>");
      }

      if (evaluation.status === "activate") {
        console.log(`    <recommendation>ACTIVATE: Use Skill tool to load /${evaluation.name}</recommendation>`);
      } else {
        console.log(`    <recommendation>Consider /${evaluation.name} if relevant</recommendation>`);
      }

      console.log("  </skill>");
      console.log("");
    }

    // Summary
    const toActivate = evaluations.filter((e) => e.status === "activate");
    const toSuggest = evaluations.filter((e) => e.status === "suggest");

    console.log("  <summary>");
    if (toActivate.length > 0) {
      console.log(`    Skills to activate: ${toActivate.map((e) => e.name).join(", ")}`);
    }
    if (toSuggest.length > 0) {
      console.log(`    Also consider: ${toSuggest.map((e) => e.name).join(", ")}`);
    }
    console.log("  </summary>");
    console.log("</skill-evaluation>");
  }

  process.exit(0);
}

main();
