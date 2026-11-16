import { band } from "./calculator.js";
// Content is filtered by conditions before selection. No random or remote text.
export function matches(entry, score, dataset) {
  if (!entry || typeof entry.text !== "string" || !entry.conditions)
    return false;
  const c = entry.conditions;
  if (c.overallMin !== undefined && score.overall < c.overallMin) return false;
  if (c.overallMax !== undefined && score.overall > c.overallMax) return false;
  if (
    c.categoryMin !== undefined &&
    !(score.categories[entry.category] >= c.categoryMin)
  )
    return false;
  if (
    c.categoryMax !== undefined &&
    !(score.categories[entry.category] <= c.categoryMax)
  )
    return false;
  if (c.questionType) {
    const question = dataset.questions.find(
      (q) => q.category === entry.category && q.type === c.questionType,
    );
    const value = question && score.evidence[question.id];
    if (!Number.isFinite(value)) return false;
    if (c.evidenceMin !== undefined && value < c.evidenceMin) return false;
    if (c.evidenceMax !== undefined && value > c.evidenceMax) return false;
  }
  return true;
}
function hash(text) {
  let value = 2166136261;
  for (const char of text)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
  return value;
}
function eligible(entries, score, dataset) {
  return (entries || []).filter((e) => matches(e, score, dataset));
}
function rotate(entries, seed) {
  if (!entries.length) return [];
  const offset = seed % entries.length;
  return [...entries.slice(offset), ...entries.slice(0, offset)];
}
function diverse(entries, limit, seed) {
  const selected = [],
    categories = new Set();
  for (const item of rotate(entries, seed)) {
    if (categories.has(item.category)) continue;
    selected.push(item);
    categories.add(item.category);
    if (selected.length === limit) break;
  }
  return selected;
}
export function interpretScores(score) {
  return {
    band: band(score.overall),
    aligned: Object.values(score.categories).filter((v) => v >= 75).length,
    different: Object.values(score.categories).filter((v) => v < 40).length,
  };
}
export function detectPatterns(dataset, score, seed = 0) {
  return diverse(eligible(dataset.patterns, score, dataset), 4, seed);
}
export function generateObservations(dataset, score, seed = 0) {
  const strengths = diverse(
    eligible(dataset.strengths, score, dataset),
    3,
    seed,
  );
  // Never call a category a friction point if it was already selected as a strength.
  // Evidence-specific checks further prevent unsupported claims about scenarios.
  const supported = new Set(strengths.map((item) => item.category));
  const challenges = diverse(
    eligible(dataset.challenges, score, dataset).filter(
      (item) => !supported.has(item.category),
    ),
    3,
    seed + 1,
  );
  return { strengths, challenges };
}
export function classify(dataset, score) {
  return (
    eligible(dataset.classifications, score, dataset)[0] || {
      id: "fallback-classification",
      text: "An uncharted connection",
    }
  );
}
export function composeVerdict(template, names, classification, balance) {
  // Function replacement avoids interpreting $ replacement tokens in nicknames.
  const values = { a: names[0], b: names[1], classification, balance };
  return template.replace(
    /\{(a|b|classification|balance)\}/g,
    (_, key) => values[key],
  );
}
export function buildVerdict(dataset, shared, score, names) {
  const seed = hash(JSON.stringify([dataset.id, score.evidence]));
  const get = (id) =>
    shared.templates?.find((t) => t.id === id)?.text ||
    "This playful profile reflects only the entered answers.";
  const interpretation = interpretScores(score);
  // Mixed category profiles are described as mixed even if the average is high.
  const balanceKey =
    interpretation.aligned && interpretation.different
      ? "mixed"
      : interpretation.band;
  const classification = classify(dataset, score);
  const observations = generateObservations(dataset, score, seed);
  const templates = rotate(eligible(dataset.verdicts, score, dataset), seed);
  return {
    classification,
    rarity:
      eligible(shared.rarity, score, dataset)[0]?.text || "A little sparkle",
    strengths: observations.strengths.length
      ? observations.strengths.map((e) => e.text)
      : [get("fallback-strength")],
    challenges: observations.challenges.length
      ? observations.challenges.map((e) => e.text)
      : [get("fallback-challenge")],
    patterns: detectPatterns(dataset, score, seed).map((e) => e.text),
    text: composeVerdict(
      templates[0]?.text || get("fallback-verdict"),
      names,
      classification.text,
      get(balanceKey),
    ),
  };
}
