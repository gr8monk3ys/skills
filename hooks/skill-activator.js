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

// ---------------------------------------------------------------------------
// Optional laya dimension
//
// laya (https://github.com/NandhaKishorM/laya) is a small decision model served
// over HTTP by `laya-serve`. Given the prompt and one `choice` question whose
// options are the skills, it picks the likeliest skill in a single forward pass
// without generating text. It catches prompts that mean a skill without using
// any of its keywords.
//
// Off unless SKILL_ACTIVATOR_LAYA_URL is set. Its pick adds `weights.laya`
// points (default 4) to one skill, the same as a single intent match, so it can
// tip a borderline skill over a threshold but never activates one alone
// (4 < suggest threshold 5). Laya's accuracy is about 0.7-0.8, so it gets a
// vote, not the decision. Any failure (timeout, non-2xx, bad body) is ignored.
// ---------------------------------------------------------------------------

const LAYA_NONE = "none";
const DEFAULT_LAYA_WEIGHT = 4;

function layaConfig(env = process.env) {
  const url = (env.SKILL_ACTIVATOR_LAYA_URL || "").trim();
  if (!url) return null;
  const base = url.replace(/\/+$/, "");
  const timeout = Number(env.SKILL_ACTIVATOR_LAYA_TIMEOUT_MS);
  const minConfidence = Number(env.SKILL_ACTIVATOR_LAYA_MIN_CONFIDENCE);
  return {
    endpoint: base.endsWith("/v1/systemone") ? base : `${base}/v1/systemone`,
    apiKey: (env.SKILL_ACTIVATOR_LAYA_API_KEY || "").trim(),
    // A UserPromptSubmit hook sits in front of every prompt: keep it short.
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 800,
    minConfidence:
      Number.isFinite(minConfidence) && minConfidence > 0 && minConfidence <= 1
        ? minConfidence
        : 0.5,
  };
}

// The prompt text itself. Claude Code sends the hook a JSON payload; fall back
// to the raw input so a plain-text invocation still works.
function promptText(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.prompt === "string") return parsed.prompt;
  } catch (err) {
    // not JSON
  }
  return raw;
}

function layaQuestion(skills) {
  const criteria = {};
  for (const skill of skills) {
    criteria[skill.name] =
      skill.description || (skill.keywords || []).slice(0, 8).join(", ") || skill.name;
  }
  criteria[LAYA_NONE] = "none of these; a general question or unrelated task";
  return {
    type: "choice",
    instructions: "Which skill best fits what this request is asking for?",
    criteria,
  };
}

// Returns { skill, confidence } or null.
async function askLaya(prompt, skills, config, fetchImpl = globalThis.fetch) {
  if (!config || !prompt.trim() || typeof fetchImpl !== "function") return null;
  try {
    const headers = { "content-type": "application/json" };
    if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
    const res = await fetchImpl(config.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ state: prompt, questions: { skill: layaQuestion(skills) } }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const answer = body && body.answers && body.answers.skill;
    if (!answer || typeof answer.choice !== "string" || answer.choice === LAYA_NONE) return null;
    if (!skills.some((s) => s.name === answer.choice)) return null;
    const confidence =
      typeof answer.answer_confidence === "number" ? answer.answer_confidence : 0;
    if (confidence < config.minConfidence) return null;
    return { skill: answer.choice, confidence };
  } catch (err) {
    return null;
  }
}

// Calculate confidence score for a skill
function calculateConfidence(skillMatches, weights, priority) {
  let score = 0;

  score += skillMatches.keywords.length * weights.keyword;
  score += skillMatches.patterns.length * weights.pattern;
  score += skillMatches.filePaths.length * weights.filePath;
  score += skillMatches.directories.length * weights.directory;
  score += skillMatches.intents.length * weights.intent;
  if (skillMatches.laya) {
    score += weights.laya ?? DEFAULT_LAYA_WEIGHT;
  }

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
  if (skillMatches.laya) {
    const p = skillMatches.laya.confidence.toFixed(2);
    details.push(`laya:p=${p} (+${weights.laya ?? DEFAULT_LAYA_WEIGHT}pts)`);
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

  // Optional laya vote (no-op unless SKILL_ACTIVATOR_LAYA_URL is set)
  const layaPick = await askLaya(promptText(prompt), skills, layaConfig());

  // Evaluate each skill
  const evaluations = [];

  for (const skill of skills) {
    const skillMatches = {
      laya: layaPick && layaPick.skill === skill.name ? layaPick : null,
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

if (require.main === module) {
  main();
}

module.exports = { askLaya, calculateConfidence, layaConfig, layaQuestion, promptText };
