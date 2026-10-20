const path = require("path");
const fs = require("fs");

let rules;
try {
  const rulesPath = path.join(__dirname, "..", "..", "..", "config", "triage", "ai_scoring_rules.json");
  rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
} catch (e) {
  // Safe fallback default rules
  rules = {
    version: "triage-v1.2",
    thresholds: { critical: 80, high: 60, medium: 40 },
    weights: {
      severity: { critical_keyword_match: 40, high_keyword_match: 25, medium_keyword_match: 10 },
      duration: { sudden: 30, recent: 20, ongoing: 10 },
      age_factor: { elderly_over_65: 15, child_under_5: 10 }
    },
    keywords: {
      critical: ["chest pain", "shortness of breath", "unconscious", "stroke", "bleeding profusely", "cardiac"],
      high: ["fever", "severe pain", "headache", "stiff neck", "vomiting", "abdominal pain"],
      medium: ["cough", "sprain", "rash", "dizzy", "mild pain"]
    }
  };
}

function calculateTriage(payload) {
  let score = 0;
  const factors = [];
  const text = (payload.symptoms || "").toLowerCase() + " " + (payload.conditions || "").toLowerCase();

  let matchedCritical = false;
  let matchedHigh = false;
  let matchedMedium = false;

  for (const keyword of rules.keywords.critical || []) {
    if (text.includes(keyword)) matchedCritical = true;
  }
  for (const keyword of rules.keywords.high || []) {
    if (text.includes(keyword)) matchedHigh = true;
  }
  for (const keyword of rules.keywords.medium || []) {
    if (text.includes(keyword)) matchedMedium = true;
  }

  if (matchedCritical) {
    const w = rules.weights.severity.critical_keyword_match;
    score += w;
    factors.push({ factor_name: "Severe Symptom Indicator", contribution: w, reason: "Matched critical risk keyword in symptoms." });
  } else if (matchedHigh) {
    const w = rules.weights.severity.high_keyword_match;
    score += w;
    factors.push({ factor_name: "High Symptom Indicator", contribution: w, reason: "Matched high risk keyword in symptoms." });
  } else if (matchedMedium) {
    const w = rules.weights.severity.medium_keyword_match;
    score += w;
    factors.push({ factor_name: "Medium Symptom Indicator", contribution: w, reason: "Matched medium risk keyword in symptoms." });
  }

  const dur = (payload.duration || "").toLowerCase();
  if (dur.includes("sudden") || dur.includes("just now") || dur.includes("minutes")) {
    const w = rules.weights.duration.sudden;
    score += w;
    factors.push({ factor_name: "Sudden Onset", contribution: w, reason: "Symptoms appeared very recently." });
  } else if (dur.includes("today") || dur.includes("morning") || dur.includes("hours")) {
    const w = rules.weights.duration.recent;
    score += w;
    factors.push({ factor_name: "Recent Onset", contribution: w, reason: "Symptoms appeared recently." });
  }

  const age = parseInt(payload.age) || 30;
  if (age > 65) {
    const w = rules.weights.age_factor.elderly_over_65;
    score += w;
    factors.push({ factor_name: "Age Factor (65+)", contribution: w, reason: "Patient is in an older age bracket." });
  } else if (age < 5) {
    const w = rules.weights.age_factor.child_under_5;
    score += w;
    factors.push({ factor_name: "Age Factor (Under 5)", contribution: w, reason: "Patient is an infant or toddler." });
  }

  if (score > 100) score = 100;

  let priority = "LOW";
  if (score >= rules.thresholds.critical) {
    priority = "CRITICAL";
  } else if (score >= rules.thresholds.high) {
    priority = "HIGH";
  } else if (score >= rules.thresholds.medium) {
    priority = "MEDIUM";
  }

  if (factors.length === 0) {
    factors.push({ factor_name: "Baseline", contribution: 0, reason: "No specific risk factors matched." });
  }

  return {
    score,
    priority,
    factors,
    rule_version: rules.version || "triage-v1.2",
  };
}

module.exports = { calculateTriage };
