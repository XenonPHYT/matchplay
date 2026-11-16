import {
  el,
  renderQuestion,
  renderReview,
  incomplete,
  answered,
  validateDataset,
  validateShared,
} from "./questions.js";
import {
  session,
  setNames,
  replacePhoto,
  removePhoto,
  resetSession,
  clearAnswers,
  hasSession,
} from "./session.js";
import { calculate } from "./calculator.js";
import { buildVerdict } from "./verdict.js";
const main = document.querySelector("#main");
const announcer = document.querySelector("#announcer");
const resetButton = document.querySelector("#reset");
let data = {},
  shared,
  stage = "home",
  pendingAction = null,
  result = null,
  firstRender = true;
const modeTitle = () => (session.mode === "romantic" ? "Romantic" : "Platonic");
const currentData = () => data[session.mode];
const text = (id) => shared.templates.find((e) => e.id === id)?.text || "";
function button(label, handler, kind = "secondary", extra = {}) {
  return el(
    "button",
    { type: "button", class: kind, on: { click: handler }, ...extra },
    label,
  );
}
function announce(message) {
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}
function show(node, newStage) {
  stage = newStage;
  main.replaceChildren(node);
  document.body.dataset.mode = session.mode || "";
  resetButton.hidden = !hasSession();
  document.title = `MATCHPLAY — ${newStage === "home" ? "Find your kind of cosmic" : modeTitle() + " · " + newStage}`;
  window.scrollTo({ top: 0, behavior: "instant" });
  if (!firstRender) main.focus({ preventScroll: true });
  firstRender = false;
}
function confirmAction(
  action,
  {
    title = "Clear this session?",
    body = text("clear"),
    yes = "Clear & go home",
  } = {},
) {
  if (!hasSession()) {
    action();
    return;
  }
  pendingAction = action;
  document.querySelector("#confirm-title").textContent = title;
  document.querySelector("#confirm-body").textContent = body;
  document.querySelector("#confirm-yes").textContent = yes;
  document.querySelector("#confirm-dialog").showModal();
  document.querySelector("#confirm-cancel").focus();
}
function goHome() {
  confirmAction(() => {
    resetSession();
    result = null;
    home();
  });
}
document.querySelector("#confirm-cancel").addEventListener("click", () => {
  pendingAction = null;
  document.querySelector("#confirm-dialog").close();
});
document.querySelector("#confirm-dialog").addEventListener("cancel", () => {
  pendingAction = null;
});
document.querySelector("#confirm-yes").addEventListener("click", () => {
  const action = pendingAction;
  pendingAction = null;
  document.querySelector("#confirm-dialog").close();
  action?.();
});
resetButton.addEventListener("click", goHome);
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  if (shared) goHome();
});
const info = document.querySelector("#info-dialog");
function showInfo(kind) {
  document.querySelector("#info-title").textContent =
    kind === "privacy"
      ? "Your universe stays in this tab."
      : "Two names. One curious operator.";
  const paragraphs =
    kind === "privacy"
      ? [
          "MATCHPLAY has no accounts, analytics, trackers, external fonts or remote scoring. Loading the page requests public site files from its host; names, answers, scores and photos are never sent by this application.",
          "Your active session lives only in this tab’s memory. Reloading or closing the page loses it. Optional photos use temporary object URLs, which are released when replaced, removed or cleared. Nothing is saved in localStorage or sessionStorage.",
          "Clear session removes the current app’s names, answers and photo references. It cannot guarantee forensic deletion from your device, caches, screenshots or independently saved certificates.",
          "Everything here is fictional entertainment based on an operator’s entries. It does not detect real feelings, attraction, intentions, identity, loyalty, personality, consent or private thoughts.",
        ]
      : [
          "01 · Choose your lens. Platonic explores friendship preferences; Romantic explores imagined chemistry and shared expectations. Both are fictional entertainment.",
          "02 · Add two nicknames, then answer 21 questions. One person chooses for both people. Individual questions have separate A and B choices; comparison and situation questions describe the imagined pair.",
          "03 · Review, edit and reveal. Local, deterministic rules produce seven category scores and a coherent playful verdict. The same answers produce the same interpretation. No AI or external scoring is used.",
          "04 · Keep it light. Print a private certificate if you like, or clear the session. The other person does not need an account, device or invitation. No result verifies anyone’s feelings.",
        ];
  document
    .querySelector("#info-body")
    .replaceChildren(...paragraphs.map((p) => el("p", {}, p)));
  info.showModal();
}
document
  .querySelector("#help-open")
  .addEventListener("click", () => showInfo("help"));
document
  .querySelector("#privacy-open")
  .addEventListener("click", () => showInfo("privacy"));
document
  .querySelector("#info-close")
  .addEventListener("click", () => info.close());
function journey(step) {
  const wrap = el("div", { class: "journey" });
  const steps = el("div", { class: "stepper", "aria-label": "Your progress" });
  ["Meet the pair", "The questions", "Your profile"].forEach((label, i) =>
    steps.append(
      el(
        "span",
        { "aria-current": step === i ? "step" : null },
        `${String(i + 1).padStart(2, "0")} ${label}`,
      ),
    ),
  );
  wrap.append(
    el(
      "div",
      { class: "journey-header" },
      el(
        "span",
        { class: "mode-label" },
        `${session.mode === "romantic" ? "♡" : "✦"} ${modeTitle()} universe`,
      ),
      steps,
    ),
  );
  return wrap;
}
function home() {
  const wrap = el("div", {});
  const hero = el(
    "section",
    { class: "hero", "aria-labelledby": "home-title" },
    el("span", { class: "pill" }, "✦ A connection worth being curious about"),
    el(
      "h1",
      { id: "home-title" },
      "Two names. One ",
      el("span", { class: "gradient-text" }, "cosmic connection."),
    ),
    el(
      "p",
      {},
      "Best-friend energy or a little romantic sparkle? Explore the dynamic you imagine, one playful answer at a time.",
    ),
  );
  const grid = el("section", {
    class: "mode-grid",
    "aria-label": "Choose your mode",
  });
  for (const [mode, title, icon, tag, description, chips, cta] of [
    [
      "platonic",
      "Better together?",
      "✦",
      "The friendship edition",
      "From casual catch-ups to legendary inside jokes. Discover your fictional friendship dynamic.",
      ["Shared wavelength", "Support styles", "Side-quest energy"],
      "Explore friendship",
    ],
    [
      "romantic",
      "Feel the spark?",
      "♡",
      "The chemistry edition",
      "A little curiosity, a little chemistry. Explore the possibilities in your imagined pairing.",
      ["Communication", "Quality time", "Imagined chemistry"],
      "Explore the spark",
    ],
  ]) {
    const card = el(
      "article",
      { class: `mode-card ${mode}` },
      el("div", { class: "mode-icon", "aria-hidden": "true" }, icon),
      el("span", { class: "mode-tag" }, tag),
      el("h2", {}, title),
      el("p", {}, description),
      el(
        "div",
        { class: "chips" },
        chips.map((t) => el("span", { class: "chip" }, t)),
      ),
      button(
        [mode === "platonic" ? "Start Platonic" : "Start Romantic", " ↗"].join(
          "",
        ),
        () => {
          session.mode = mode;
          setup();
        },
        "primary",
        { "aria-label": cta + " — " + mode + " mode" },
      ),
    );
    grid.append(card);
  }
  wrap.append(
    hero,
    grid,
    el(
      "div",
      { class: "trust-row" },
      el("span", {}, "✓ One person answers for both"),
      el("span", {}, "✓ Private by design"),
      el("span", {}, "✓ About 5–8 minutes"),
    ),
    el(
      "p",
      { class: "disclaimer" },
      "Just for fun, never a fact check. Results are fictional interpretations of the answers you enter — not a reading of anyone’s real feelings.",
    ),
    el(
      "section",
      { class: "how-row", "aria-label": "Three simple steps" },
      [
        [
          "01",
          "Choose your universe",
          "Friendship or romantic chemistry. Same curiosity, a different lens.",
        ],
        [
          "02",
          "Tell your version",
          "Two nicknames. One operator. Answer for both people as you imagine them.",
        ],
        [
          "03",
          "Meet your matchplay",
          "A playful score, a few insights and a verdict with a little personality.",
        ],
      ].map(([n, title, body]) =>
        el(
          "div",
          {},
          el("span", { class: "step-num" }, n),
          el("h3", {}, title),
          el("p", {}, body),
        ),
      ),
    ),
  );
  show(wrap, "home");
}
function avatar(person) {
  return el(
    "div",
    { class: "avatar", "aria-hidden": "true" },
    person.photo
      ? el("img", { src: person.photo, alt: "" })
      : person.name.trim().slice(0, 1).toUpperCase() || "✦",
  );
}
function setup() {
  const wrap = journey(0);
  wrap.append(
    el(
      "div",
      { class: "intro" },
      el("p", { class: "eyebrow" }, "Every good story starts with two names"),
      el("h1", {}, "Who’s in your orbit?"),
      el("p", {}, text("intro") + " Real names and photos are not needed."),
    ),
  );
  const form = el("form", { class: "panel", novalidate: true });
  const grid = el("div", { class: "participant-grid" });
  const inputs = [];
  for (let i = 0; i < 2; i++) {
    const person = session.people[i],
      letter = i === 0 ? "A" : "B";
    const input = el("input", {
      id: `name-${i}`,
      name: `nickname-${i}`,
      type: "text",
      maxlength: 24,
      required: true,
      autocomplete: "off",
      "aria-describedby": `name-hint-${i} setup-error`,
      value: person.name,
    });
    input.addEventListener("input", () => {
      person.name = input.value;
      resetButton.hidden = false;
    });
    inputs.push(input);
    const photoError = el("p", {
      class: "error",
      id: `photo-error-${i}`,
      role: "status",
      hidden: true,
    });
    const picture = avatar(person);
    const remove = button(
      "Remove photo",
      () => {
        removePhoto(i);
        fileInput.value = "";
        picture.replaceWith(avatar(person));
        setupPreservingFocus(i);
      },
      "text-button",
      { hidden: !person.photo },
    );
    const fileInput = el("input", {
      id: `photo-${i}`,
      type: "file",
      accept: "image/jpeg,image/png,image/webp",
      "aria-describedby": `photo-error-${i} photo-note`,
    });
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      fileInput.disabled = true;
      photoError.hidden = true;
      announce("Reading image locally.");
      try {
        await replacePhoto(i, file);
        if (fileInput.isConnected) {
          const newAvatar = avatar(person);
          const old = fileInput.closest(".photo-row").querySelector(".avatar");
          old.replaceWith(newAvatar);
          remove.hidden = false;
          announce(`Photo added for Participant ${letter}.`);
        }
      } catch (error) {
        if (fileInput.isConnected) {
          photoError.textContent = error.message;
          photoError.hidden = false;
        }
      } finally {
        fileInput.disabled = false;
        fileInput.value = "";
      }
    });
    grid.append(
      el(
        "section",
        { class: "participant-card", "aria-labelledby": `person-heading-${i}` },
        el("h3", { id: `person-heading-${i}` }, `Participant ${letter}`),
        el("label", { for: `name-${i}` }, "Nickname"),
        input,
        el(
          "p",
          { id: `name-hint-${i}`, class: "hint" },
          "Required · 1–24 characters",
        ),
        el(
          "div",
          { class: "photo-row" },
          picture,
          el(
            "div",
            { class: "photo-controls" },
            el("label", { for: `photo-${i}` }, "Add a photo (optional)"),
            fileInput,
            remove,
          ),
        ),
        photoError,
      ),
    );
  }
  const error = el("p", {
    id: "setup-error",
    class: "error",
    role: "alert",
    hidden: true,
  });
  form.append(
    grid,
    el("p", { id: "photo-note", class: "hint" }, text("images")),
    el("p", { class: "hint" }, text("privacy")),
    el(
      "p",
      { class: "notice" },
      "Only your version of the story. Choose the answers that fit your perception or an imagined scenario — not verified facts about either person.",
    ),
    error,
    el(
      "div",
      { class: "actions" },
      button("← Choose a mode", goHome),
      el(
        "button",
        { type: "submit", class: "primary" },
        Object.keys(session.answers).length
          ? "Continue with saved answers →"
          : "Let’s explore →",
      ),
    ),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      setNames(inputs.map((input) => input.value));
      session.index = Math.min(
        session.index,
        currentData().questions.length - 1,
      );
      quiz();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      inputs.forEach((input) =>
        input.setAttribute(
          "aria-invalid",
          !input.value.trim() || [...input.value.trim()].length > 24
            ? "true"
            : "false",
        ),
      );
      inputs
        .find(
          (input) => !input.value.trim() || [...input.value.trim()].length > 24,
        )
        ?.focus();
    }
  });
  wrap.append(form);
  show(wrap, "setup");
}
function setupPreservingFocus(index) {
  setup();
  document.querySelector(`#photo-${index}`)?.focus();
  announce("Photo removed.");
}
function quiz() {
  const dataset = currentData(),
    wrap = journey(1);
  wrap.append(
    el(
      "div",
      { class: "intro" },
      el("h1", {}, "A little more about your pair."),
      el(
        "p",
        {},
        "There are no “correct” people here. Just the preferences you choose.",
      ),
    ),
  );
  const panel = el("div", { class: "panel" });
  const question = dataset.questions[session.index];
  const error = el("p", {
    id: "question-error",
    class: "error",
    role: "alert",
    hidden: true,
  });
  const updateProgress = () => {
    const count =
      dataset.questions.length - incomplete(dataset, session.answers).length;
    panel
      .querySelector("[role=progressbar]")
      .setAttribute("aria-valuenow", count);
    panel.querySelector(".progress-fill").style.width =
      `${(100 * count) / dataset.questions.length}%`;
    panel.querySelector(".question-top span:last-child").textContent =
      `${count} answered`;
    error.hidden = true;
  };
  panel.append(renderQuestion(dataset, session, updateProgress), error);
  const next = () => {
    if (!answered(question, session.answers[question.id])) {
      error.textContent =
        question.type === "individual"
          ? "Choose one answer for each participant before continuing."
          : "Choose one imagined dynamic before continuing.";
      error.hidden = false;
      const slots = question.type === "individual" ? ["a", "b"] : ["choice"];
      const missing = slots.find(
        (slot) => !session.answers[question.id]?.[slot],
      );
      panel.querySelector(`input[name="${question.id}-${missing}"]`)?.focus();
      return;
    }
    if (session.editing) {
      session.editing = false;
      review();
    } else if (session.index === dataset.questions.length - 1) review();
    else {
      session.index++;
      quiz();
    }
  };
  panel.append(
    el(
      "div",
      { class: "actions" },
      button(session.index ? "← Previous" : "← Edit pair", () => {
        if (session.index) {
          session.index--;
          quiz();
        } else setup();
      }),
      button(
        session.editing
          ? "Save & return to review →"
          : session.index === dataset.questions.length - 1
            ? "Review answers →"
            : "Next question →",
        next,
        "primary",
      ),
    ),
  );
  const tips = shared.templates.filter((entry) => entry.id.endsWith("-tip"));
  if (tips.length)
    panel.append(
      el("p", { class: "hint" }, tips[session.index % tips.length].text),
    );
  if (session.editing)
    panel.append(
      button(
        "Return to review",
        () => {
          session.editing = false;
          review();
        },
        "text-button",
      ),
    );
  wrap.append(
    panel,
    el(
      "p",
      { class: "disclaimer" },
      "Based only on your entries · No answers leave this tab · Entertainment, not assessment",
    ),
  );
  show(wrap, "questions");
  announce(
    `Question ${session.index + 1} of ${dataset.questions.length}. ${question.type === "individual" ? "Answer for both participants." : "Choose a scenario for the pair."}`,
  );
}
function review() {
  const dataset = currentData(),
    wrap = journey(1),
    missing = incomplete(dataset, session.answers);
  wrap.append(
    el(
      "div",
      { class: "intro" },
      el("p", { class: "eyebrow" }, "One last look before the reveal"),
      el("h1", {}, "Does this tell your version?"),
      el(
        "p",
        {},
        "Check both sets of choices. Edit anything — the story is still yours to change.",
      ),
    ),
  );
  const panel = el(
    "section",
    { class: "panel", "aria-label": "Answer review" },
    el(
      "p",
      { class: "notice" },
      missing.length
        ? `${missing.length} question${missing.length === 1 ? " is" : "s are"} incomplete. Complete every required answer before calculation.`
        : `All ${dataset.questions.length} questions are complete. Your fictional profile is ready to calculate locally.`,
    ),
    renderReview(dataset, session, (index) => {
      session.index = index;
      session.editing = true;
      quiz();
    }),
  );
  const error = el("p", { class: "error", role: "alert", hidden: true });
  panel.append(
    error,
    el(
      "div",
      { class: "actions" },
      button("← Back to questions", () => {
        session.index = dataset.questions.length - 1;
        quiz();
      }),
      button(
        "Reveal our matchplay ✦",
        () => {
          const gaps = incomplete(dataset, session.answers);
          if (gaps.length) {
            error.textContent = `Complete ${gaps.length} remaining question${gaps.length > 1 ? "s" : ""}. Use Edit beside the missing answers.`;
            error.hidden = false;
            error.scrollIntoView({ block: "center" });
            return;
          }
          try {
            const score = calculate(dataset, session.answers);
            result = {
              score,
              verdict: buildVerdict(
                dataset,
                shared,
                score,
                session.people.map((p) => p.name),
              ),
            };
            results();
          } catch (err) {
            console.error("MATCHPLAY calculation:", err);
            error.textContent =
              "We could not assemble this profile. Your answers are still in this tab; review them or clear the session.";
            error.hidden = false;
          }
        },
        "primary",
      ),
    ),
  );
  wrap.append(panel);
  show(wrap, "review");
}
function results() {
  if (!result) {
    review();
    return;
  }
  const { score, verdict } = result,
    dataset = currentData(),
    wrap = journey(2);
  wrap.classList.add("result");
  wrap.append(
    el(
      "div",
      { class: "print-heading" },
      "MATCHPLAY · FICTIONAL CONNECTION CERTIFICATE",
    ),
  );
  const pair = el("div", { class: "pair" });
  session.people.forEach((person, i) => {
    if (i)
      pair.append(
        el(
          "span",
          { class: "pair-symbol", "aria-hidden": "true" },
          session.mode === "romantic" ? "♡" : "✦",
        ),
      );
    pair.append(
      el(
        "div",
        { class: "pair-person" },
        avatar(person),
        el("strong", {}, person.name),
      ),
    );
  });
  wrap.append(
    el(
      "section",
      { class: "result-header", "aria-labelledby": "result-title" },
      el("p", { class: "eyebrow" }, "Your answers. Your little universe."),
      el(
        "h1",
        { id: "result-title" },
        "The connection, ",
        el("span", { class: "gradient-text" }, "reimagined."),
      ),
      el(
        "p",
        {},
        "A fictional profile based on the preferences and scenarios you entered.",
      ),
      pair,
    ),
  );
  const scorePanel = el(
    "section",
    { class: "panel score-panel", "aria-label": "Overall entertainment score" },
    el("span", { class: "rarity" }, `✦ ${verdict.rarity}`),
    el(
      "div",
      { class: "score-ring", style: `--score:${score.overall}` },
      el(
        "div",
        { class: "score-number" },
        String(score.overall),
        el("small", {}, "out of 100 · just for fun"),
      ),
    ),
    el("h2", { style: "font-size:1.45rem" }, verdict.classification.text),
    el("p", {}, `${modeTitle()} entertainment score`),
    el(
      "p",
      { class: "hint" },
      "Sparkle tiers are decorative score bands, not statistical rarity.",
    ),
  );
  const categories = el(
    "section",
    { class: "panel", "aria-labelledby": "category-heading" },
    el(
      "h2",
      { id: "category-heading", style: "font-size:1.15rem" },
      "Your shared wavelength",
    ),
  );
  for (const cat of dataset.categories) {
    const n = score.categories[cat.id];
    categories.append(
      el(
        "div",
        { class: "category-row" },
        el(
          "div",
          { class: "category-head" },
          el("span", {}, cat.label),
          el("strong", {}, `${n}/100`),
        ),
        el(
          "div",
          { class: "category-bar", "aria-hidden": "true" },
          el("span", { style: `width:${n}%` }),
        ),
      ),
    );
  }
  wrap.append(el("div", { class: "result-grid" }, scorePanel, categories));
  wrap.append(
    el(
      "section",
      { class: "panel verdict-panel", "aria-labelledby": "verdict-heading" },
      el("p", { class: "eyebrow" }, "The MATCHPLAY verdict"),
      el(
        "h2",
        { id: "verdict-heading", style: "font-size:1.6rem" },
        "Here’s the story in your stars.",
      ),
      el("p", {}, verdict.text),
    ),
  );
  const observations = el("div", { class: "insight-grid" });
  for (const [heading, items, kind] of [
    ["✦ Where the answers click", verdict.strengths, "strengths"],
    ["↗ Room for a little translation", verdict.challenges, "challenges"],
  ])
    observations.append(
      el(
        "section",
        { class: `panel ${kind}` },
        el("h2", { style: "font-size:1rem" }, heading),
        items.map((t) => el("p", { class: "insight" }, t)),
      ),
    );
  wrap.append(
    observations,
    el(
      "section",
      { class: "panel" },
      el("h2", { style: "font-size:1rem" }, "Patterns in the entered answers"),
      el(
        "div",
        { class: "patterns" },
        (verdict.patterns.length
          ? verdict.patterns
          : [text("fallback-pattern")]
        ).map((t) => el("span", { class: "chip" }, t)),
      ),
      el(
        "details",
        {},
        el("summary", {}, "How this playful score is made"),
        el(
          "p",
          {},
          "Seven categories have equal weight. Each contains one preference comparison, one comparative question and one imagined situation, all equally weighted. Preference scores use the distance between the entered choices on an editorial 0–3 scale. Scenario choices map to 100, 70, 35 or 0. Category values are averaged and the final score is rounded to a whole number. There is no randomness, scientific validation, AI analysis or remote scoring.",
        ),
        el(
          "p",
          {},
          "Eligible observations are filtered by category and answer evidence before deterministic selection. A category selected as a strength is not also selected as a challenge. Names and photos do not affect scores.",
        ),
      ),
    ),
  );
  wrap.append(
    el(
      "p",
      { class: "notice certificate-note" },
      text("disclaimer") +
        " No result implies attraction, consent or an obligation to connect.",
    ),
    el(
      "div",
      { class: "actions result-actions" },
      button("Print / Save PDF certificate", () => window.print(), "primary"),
      button("Review & edit", review),
      button("Retake this mode", () =>
        confirmAction(
          () => {
            clearAnswers();
            result = null;
            setup();
          },
          {
            title: "Start a fresh set of answers?",
            body: "Your current answers and result will be discarded. Nicknames and optional photos will stay for the new attempt.",
            yes: "Retake this mode",
          },
        ),
      ),
      button("Return home", goHome),
    ),
    el(
      "p",
      { class: "disclaimer" },
      "Printing happens locally. Choose “Save as PDF” in your browser’s print dialog if supported. Nothing is uploaded.",
    ),
  );
  show(wrap, "results");
  announce(
    `Your fictional ${modeTitle()} profile is ready. Entertainment score ${score.overall} out of 100. ${verdict.classification.text}.`,
  );
}
async function initialize() {
  try {
    const names = ["platonic", "romantic", "shared"];
    const values = await Promise.all(
      names.map(async (name) => {
        const response = await fetch(`data/${name}.json`, {
          cache: "no-cache",
        });
        if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
        return response.json();
      }),
    );
    validateDataset(values[0], "platonic");
    validateDataset(values[1], "romantic");
    validateShared(values[2]);
    data = { platonic: values[0], romantic: values[1] };
    shared = values[2];
    home();
  } catch (error) {
    console.error("MATCHPLAY could not load local datasets:", error);
    const panel = el(
      "section",
      { class: "panel fatal", role: "alert" },
      el("h1", { style: "font-size:2rem" }, "Our stars didn’t load."),
      el(
        "p",
        {},
        "We could not read the local question files. Refresh to try again. If running locally, serve the full project over HTTP — do not open index.html with file://.",
      ),
      button("Try loading again", () => location.reload(), "primary"),
    );
    show(panel, "error");
  }
}
// Revoke previews when a tab is really left, while preserving back/forward cache.
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) resetSession();
});
initialize();
