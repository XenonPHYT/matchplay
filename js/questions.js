// DOM construction helper: dynamic strings are always text nodes, never HTML.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "on")
      for (const [event, handler] of Object.entries(value))
        node.addEventListener(event, handler);
    else if (value !== false && value !== null && value !== undefined)
      node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children.flat(Infinity))
    if (child !== null && child !== undefined && child !== false)
      node.append(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
  return node;
}
export function answered(question, answer) {
  const known = (id) => question.options.some((option) => option.id === id);
  return question.type === "individual"
    ? known(answer?.a) && known(answer?.b)
    : known(answer?.choice);
}
export function incomplete(dataset, answers) {
  return dataset.questions.filter((q) => !answered(q, answers[q.id]));
}
export function renderQuestion(dataset, session, onChange) {
  const question = dataset.questions[session.index];
  const answer = session.answers[question.id] || {};
  const count = dataset.questions.length;
  const section = el("section", { "aria-labelledby": "question-heading" });
  section.append(
    el(
      "div",
      { class: "question-top" },
      el("span", {}, `Question ${session.index + 1} of ${count}`),
      el(
        "span",
        {},
        `${count - incomplete(dataset, session.answers).length} answered`,
      ),
    ),
    el(
      "div",
      {
        class: "progress-track",
        role: "progressbar",
        "aria-label": "Questions answered",
        "aria-valuenow": count - incomplete(dataset, session.answers).length,
        "aria-valuemin": 0,
        "aria-valuemax": count,
      },
      el("div", {
        class: "progress-fill",
        style: `width:${(100 * (count - incomplete(dataset, session.answers).length)) / count}%`,
      }),
    ),
    el(
      "span",
      { class: "type-badge" },
      question.type === "individual"
        ? "Individual · Answer for both"
        : `${question.type} · About the pair`,
    ),
    el(
      "h2",
      { id: "question-heading", class: "question-title" },
      question.text,
    ),
    el("p", { id: "question-help", class: "question-help" }, question.help),
  );
  const columns = el("div", {
    class: question.type === "individual" ? "answer-columns" : "",
  });
  const slots = question.type === "individual" ? ["a", "b"] : ["choice"];
  for (const slot of slots) {
    const legend =
      slot === "choice"
        ? "Choose the imagined dynamic"
        : `Answer for ${session.people[slot === "a" ? 0 : 1].name}`;
    const fieldset = el(
      "fieldset",
      { "aria-describedby": "question-help" },
      el("legend", {}, legend),
    );
    for (const option of question.options) {
      const input = el("input", {
        type: "radio",
        name: `${question.id}-${slot}`,
        value: option.id,
        checked: answer[slot] === option.id,
        on: {
          change: () => {
            session.answers[question.id] = {
              ...session.answers[question.id],
              [slot]: option.id,
            };
            onChange();
          },
        },
      });
      fieldset.append(
        el("label", { class: "option" }, input, el("span", {}, option.text)),
      );
    }
    columns.append(fieldset);
  }
  section.append(columns);
  return section;
}
export function renderReview(dataset, session, onEdit) {
  const list = el("div", {});
  for (const [index, q] of dataset.questions.entries()) {
    const answer = session.answers[q.id] || {};
    const label = (id) =>
      q.options.find((o) => o.id === id)?.text || "Not answered";
    const content = el("div", {}, el("h3", {}, q.text));
    if (q.type === "individual") {
      content.append(
        el("p", {}, `${session.people[0].name}: ${label(answer.a)}`),
        el("p", {}, `${session.people[1].name}: ${label(answer.b)}`),
      );
    } else content.append(el("p", {}, label(answer.choice)));
    list.append(
      el(
        "div",
        { class: "review-item" },
        el("span", { class: "review-num" }, String(index + 1).padStart(2, "0")),
        content,
        el(
          "button",
          {
            class: "text-button",
            type: "button",
            "aria-label": `Edit question ${index + 1}`,
            on: { click: () => onEdit(index) },
          },
          "Edit",
        ),
      ),
    );
  }
  return list;
}
const sections = [
  "classifications",
  "strengths",
  "challenges",
  "patterns",
  "verdicts",
];
const conditionKeys = new Set([
  "overallMin",
  "overallMax",
  "categoryMin",
  "categoryMax",
  "questionType",
  "evidenceMin",
  "evidenceMax",
]);
export function validateDataset(dataset, mode) {
  if (
    dataset?.id !== mode ||
    !Array.isArray(dataset.categories) ||
    !dataset.categories.length ||
    !Array.isArray(dataset.questions) ||
    !dataset.questions.length
  )
    throw new Error(`Invalid dataset: ${mode}`);
  const ids = new Set();
  const unique = (entry) => {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !entry.id ||
      ids.has(entry.id)
    )
      throw new Error(`Duplicate or missing content ID: ${entry?.id}`);
    ids.add(entry.id);
  };
  const categories = new Set();
  for (const c of dataset.categories) {
    if (
      categories.has(c.id) ||
      !c.id ||
      typeof c.label !== "string" ||
      !(c.weight > 0) ||
      !Number.isFinite(c.weight)
    )
      throw new Error("Invalid category");
    categories.add(c.id);
  }
  for (const q of dataset.questions) {
    unique(q);
    if (
      q.mode !== mode ||
      !["individual", "comparative", "situational"].includes(q.type) ||
      !categories.has(q.category) ||
      typeof q.text !== "string" ||
      !q.text ||
      !(q.weight > 0) ||
      !Number.isFinite(q.weight) ||
      !Array.isArray(q.options) ||
      q.options.length < 2
    )
      throw new Error(`Invalid question ${q.id}`);
    const values = [];
    for (const option of q.options) {
      unique(option);
      if (!option.text) throw new Error(`Missing option text ${option.id}`);
      const value = q.type === "individual" ? option.value : option.score;
      if (
        !Number.isFinite(value) ||
        (q.type !== "individual" && (value < 0 || value > 100))
      )
        throw new Error(`Invalid option mapping ${option.id}`);
      values.push(value);
    }
    if (q.type === "individual" && Math.max(...values) === Math.min(...values))
      throw new Error(`Empty preference scale ${q.id}`);
  }
  for (const category of categories)
    if (!dataset.questions.some((q) => q.category === category))
      throw new Error(`Category without questions ${category}`);
  for (const section of sections) {
    if (!Array.isArray(dataset[section]) || !dataset[section].length)
      throw new Error(`Missing ${section}`);
    for (const entry of dataset[section]) {
      unique(entry);
      if (
        !entry.text ||
        !entry.type ||
        !Array.isArray(entry.tags) ||
        !entry.conditions ||
        (entry.category !== "overall" && !categories.has(entry.category))
      )
        throw new Error(`Invalid content entry ${entry.id}`);
      for (const [key, value] of Object.entries(entry.conditions)) {
        if (!conditionKeys.has(key))
          throw new Error(`Unknown condition ${key}`);
        if (key === "questionType") {
          if (
            !dataset.questions.some(
              (q) => q.category === entry.category && q.type === value,
            )
          )
            throw new Error(`Missing referenced question ${entry.id}`);
        } else if (!Number.isFinite(value) || value < 0 || value > 100)
          throw new Error(`Invalid condition ${entry.id}`);
      }
    }
  }
  for (let score = 0; score <= 100; score++) {
    const labels = dataset.classifications.filter(
      (e) =>
        score >= (e.conditions.overallMin ?? 0) &&
        score <= (e.conditions.overallMax ?? 100),
    );
    if (labels.length !== 1)
      throw new Error(`Classification gap/overlap at ${score}`);
    if (
      !dataset.verdicts.some(
        (e) =>
          score >= (e.conditions.overallMin ?? 0) &&
          score <= (e.conditions.overallMax ?? 100),
      )
    )
      throw new Error(`Verdict gap at ${score}`);
  }
  return true;
}
export function validateShared(shared) {
  if (
    shared?.id !== "shared" ||
    !Array.isArray(shared.templates) ||
    !Array.isArray(shared.rarity)
  )
    throw new Error("Invalid shared content");
  const ids = new Set();
  for (const e of [...shared.templates, ...shared.rarity]) {
    if (
      !e?.id ||
      ids.has(e.id) ||
      !e.text ||
      !e.type ||
      !e.conditions ||
      !Array.isArray(e.tags)
    )
      throw new Error("Invalid shared entry");
    ids.add(e.id);
  }
  for (const id of [
    "aligned",
    "mixed",
    "divergent",
    "fallback-strength",
    "fallback-challenge",
    "fallback-verdict",
    "disclaimer",
  ])
    if (!ids.has(id)) throw new Error(`Missing shared reference ${id}`);
  for (let n = 0; n <= 100; n++)
    if (
      shared.rarity.filter(
        (e) => n >= e.conditions.overallMin && n <= e.conditions.overallMax,
      ).length !== 1
    )
      throw new Error("Invalid sparkle bands");
  return true;
}
