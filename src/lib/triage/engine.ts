import rules from "../../../config/triage/ai_scoring_rules.json";

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface TriageFactor {
  factor_name: string;
  contribution: number;
  reason: string;
}

export interface TriageResult {
  score: number;
  priority: PriorityLevel;
  factors: TriageFactor[];
  rule_version: string;
}

export interface IntakePayload {
  age: number;
  symptoms: string;
  duration: string;
  conditions: string;
}

/**
 * Deterministic rules-based triage engine based on configured JSON factors.
 * This is a prototype simulation and DOES NOT replace medical diagnosis.
 */
export function calculateTriage(payload: IntakePayload): TriageResult {
  let score = 0;
  const factors: TriageFactor[] = [];
  const text = payload.symptoms.toLowerCase() + " " + payload.conditions.toLowerCase();
  
  // 1. Keyword Matching (Severity)
  let matchedCritical = false;
  let matchedHigh = false;
  let matchedMedium = false;

  for (const keyword of rules.keywords.critical) {
    if (text.includes(keyword)) matchedCritical = true;
  }
  for (const keyword of rules.keywords.high) {
    if (text.includes(keyword)) matchedHigh = true;
  }
  for (const keyword of rules.keywords.medium) {
    if (text.includes(keyword)) matchedMedium = true;
  }

  if (matchedCritical) {
    score += rules.weights.severity.critical_keyword_match;
    factors.push({
      factor_name: "Severe Symptom Indicator",
      contribution: rules.weights.severity.critical_keyword_match,
      reason: "Matched critical risk keyword in symptoms."
    });
  } else if (matchedHigh) {
    score += rules.weights.severity.high_keyword_match;
    factors.push({
      factor_name: "High Symptom Indicator",
      contribution: rules.weights.severity.high_keyword_match,
      reason: "Matched high risk keyword in symptoms."
    });
  } else if (matchedMedium) {
    score += rules.weights.severity.medium_keyword_match;
    factors.push({
      factor_name: "Medium Symptom Indicator",
      contribution: rules.weights.severity.medium_keyword_match,
      reason: "Matched medium risk keyword in symptoms."
    });
  }

  // 2. Duration Factor
  const dur = payload.duration.toLowerCase();
  if (dur.includes("sudden") || dur.includes("just now") || dur.includes("minutes")) {
    score += rules.weights.duration.sudden;
    factors.push({
      factor_name: "Sudden Onset",
      contribution: rules.weights.duration.sudden,
      reason: "Symptoms appeared very recently."
    });
  } else if (dur.includes("today") || dur.includes("morning") || dur.includes("hours")) {
    score += rules.weights.duration.recent;
    factors.push({
      factor_name: "Recent Onset",
      contribution: rules.weights.duration.recent,
      reason: "Symptoms appeared recently."
    });
  }

  // 3. Age Factor
  if (payload.age > 65) {
    score += rules.weights.age_factor.elderly_over_65;
    factors.push({
      factor_name: "Age Factor (65+)",
      contribution: rules.weights.age_factor.elderly_over_65,
      reason: "Patient is in an older age bracket."
    });
  } else if (payload.age < 5) {
    score += rules.weights.age_factor.child_under_5;
    factors.push({
      factor_name: "Age Factor (Under 5)",
      contribution: rules.weights.age_factor.child_under_5,
      reason: "Patient is an infant or toddler."
    });
  }

  // Cap score
  if (score > 100) score = 100;

  // 4. Threshold mapping
  let priority: PriorityLevel = "LOW";
  if (score >= rules.thresholds.critical) {
    priority = "CRITICAL";
  } else if (score >= rules.thresholds.high) {
    priority = "HIGH";
  } else if (score >= rules.thresholds.medium) {
    priority = "MEDIUM";
  }

  // Fallback factor if none matched
  if (factors.length === 0) {
    factors.push({
      factor_name: "Baseline",
      contribution: 0,
      reason: "No specific risk factors matched."
    });
  }

  return {
    score,
    priority,
    factors,
    rule_version: rules.version
  };
}
