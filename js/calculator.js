/** Pure, deterministic scoring. Each of seven categories has equal overall weight.
 * Three equally weighted questions per category: individual preference distance
 * on an ordinal 0–3 scale => (1 - |a-b|/3)*100; comparative and situational
 * options => 100,70,35,0. These are editorial entertainment assumptions, not
 * validated psychology. Overall averages unrounded category values, rounded once.
 * Missing/unknown IDs always throw; they are never assigned a score.
 */
export function evidenceScore(question, answer) {
  const option = (id) => question.options.find((item) => item.id === id);
  if (question.type === "individual") {
    const a = option(answer?.a),
      b = option(answer?.b);
    if (!a || !b) throw new Error(`Both answers are required: ${question.id}`);
    const values = question.options.map((item) => item.value);
    const range = Math.max(...values) - Math.min(...values);
    if (!Number.isFinite(range) || range <= 0)
      throw new Error(`Invalid preference scale: ${question.id}`);
    return Math.max(
      0,
      Math.min(100, (1 - Math.abs(a.value - b.value) / range) * 100),
    );
  }
  const selected = option(answer?.choice);
  if (!selected || !Number.isFinite(selected.score))
    throw new Error(`An answer is required: ${question.id}`);
  return selected.score;
}
export function calculate(dataset, answers) {
  const evidence = {};
  for (const question of dataset.questions)
    evidence[question.id] = evidenceScore(question, answers[question.id]);
  const rawCategories = {};
  for (const category of dataset.categories) {
    const questions = dataset.questions.filter(
      (q) => q.category === category.id,
    );
    const denominator = questions.reduce((sum, q) => sum + q.weight, 0);
    if (!denominator) throw new Error(`No scoring questions: ${category.id}`);
    rawCategories[category.id] =
      questions.reduce((sum, q) => sum + evidence[q.id] * q.weight, 0) /
      denominator;
  }
  const totalWeight = dataset.categories.reduce((sum, c) => sum + c.weight, 0);
  if (!totalWeight) throw new Error("No scoring categories");
  return {
    overall: Math.round(
      dataset.categories.reduce(
        (sum, c) => sum + rawCategories[c.id] * c.weight,
        0,
      ) / totalWeight,
    ),
    categories: Object.fromEntries(
      Object.entries(rawCategories).map(([id, value]) => [
        id,
        Math.round(value),
      ]),
    ),
    evidence,
  };
}
export function band(score) {
  return score >= 75 ? "aligned" : score >= 40 ? "mixed" : "divergent";
}
