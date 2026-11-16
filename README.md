# MATCHPLAY

A complete, no-build, browser-based entertainment website for one operator entering the preferences of two fictional or imagined participants. Platonic mode explores friendship dynamics; Romantic mode explores imagined chemistry and shared expectations. No result verifies anyone's feelings, personality, identity, intentions, loyalty, private thoughts or consent.

## Quick start

Extract the archive, open a terminal in the extracted `MATCHPLAY/` directory, and run:

```sh
npx wrangler dev
```

Open the local address printed by Wrangler (normally `http://localhost:8787`). Do **not** double-click `index.html`: JSON fetches and ES modules must be served over HTTP. There is no build or install step for the site itself. `npx` downloads the deployment/development CLI if needed and can ask for permission to install it.

Alternative local server if Python 3 is installed:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A generic HTTP server is useful for UI testing but does not honor `.assetsignore`; do not expose that development server publicly. Wrangler is the deployment-representative preview.

## Features

- Complete landing → mode → participant setup → questionnaire → review/edit → local result flow.
- Two modes, each with 21 questions: seven individual, seven comparative and seven situational. The single operator answers for both people; there are no invitations or live two-person sessions.
- Seven mode-specific categories, equally weighted. Required-answer validation, progress, backward/forward navigation and preserved in-memory choices.
- Nicknames required and trimmed, maximum 24 input code units (the standard HTML maxlength behavior); real names unnecessary. Identical nicknames are allowed. Names are treated as text, never inserted as HTML.
- Optional JPEG/PNG/WebP images, at most 5 MB per file, decoded before preview. Replace/remove controls, invalid-file feedback and asynchronous reset protection.
- Deterministic scores, coherent rule-filtered observations, whole-number category indicators, classifications, decorative sparkle tiers and a modular custom verdict.
- Local print certificate via `window.print()` with print CSS. Save as PDF is offered by the browser's print dialog, not an external PDF service. No simulated download or dead button.
- Help/privacy dialogs, accessible native radio groups, visible focus, skip link, status announcements, confirmation dialogs, reduced-motion styling and mobile-first layouts.
- No frameworks, no backend, no AI APIs, no accounts, no runtime libraries/CDNs, no analytics, no trackers and no remote fonts/images.

## Source tree

```text
MATCHPLAY/
├── index.html
├── wrangler.jsonc
├── README.md
├── .assetsignore
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── questions.js
│   ├── calculator.js
│   ├── verdict.js
│   └── session.js
└── data/
    ├── platonic.json
    ├── romantic.json
    └── shared.json
```

No empty asset folders are included. All decorative artwork is CSS; the tiny favicon is an embedded SVG. Uploaded participant photos are ephemeral object URLs. There is no `dist/`, build system, package manifest or Worker entry-point script. Wrangler may create a local `.wrangler/` cache while developing; that folder is excluded from deployment and is not included in this archive.

### Module responsibilities

`app.js` loads/validates content, wires events and orchestrates the stages, dialogs and print action. `questions.js` owns safe DOM helpers, question/review rendering, required-answer checks and dataset validation. `calculator.js` is a DOM-independent pure scoring engine. `verdict.js` separates score interpretation, condition matching, pattern detection, diverse observation selection, classification and safe text composition. `session.js` owns transient state, names, image decoding, object URL lifecycle and reset. CSS separates the shared design system from viewport/print refinements. Data files contain all questions, answer mappings and mode-specific result copy.

## How the modes differ

Platonic dimensions: Communication; Reliability expectations; Shared interests; Mutual understanding; Support preferences; Friendship dynamics; Conflict & repair.

Romantic dimensions: Communication expectations; Affection preferences; Emotional pace; Shared expectations; Quality-time preferences; Conflict & repair; Future-oriented preferences.

Each mode ships 10 playful classifications, 30 strengths, 25 challenges, 30 answer patterns and 50 approved verdict templates. The 50 templates deliberately combine 10 distinct score-band narrative cores with five mode-specific conclusions. Shared content includes five decorative tiers and 30 reusable, concise text entries (context, privacy, fallbacks and question tips). There are 42 questions total, with 28 separate per-person selection groups and 28 pair-scenario selection groups.

Labels such as “Inseparable Duo” and “Storybook Chemistry” are explicitly fictional labels for these choices, not measured relationship states. Sparkle tiers are score bands, **not** claimed population rarity.

## Scoring: transparent editorial assumptions

Every category contains three equally weighted questions:

1. **Individual preference:** the operator enters one option for A and one for B. Options have editorial ordinal values 0–3. Evidence score = `(1 - abs(valueA - valueB) / 3) * 100` (general code uses the observed scale range). Same entered option scores 100, distance one scores 66.67, distance two scores 33.33, distance three scores 0. These ordering/distance assumptions are playful design choices, not psychometric facts; some preferences have no objectively correct order.
2. **Comparative scenario:** one pair answer maps explicitly to 100, 70, 35 or 0.
3. **Hypothetical situation:** the chosen response likewise maps to 100, 70, 35 or 0.

Category = weighted mean of its three evidence values. Overall = weighted mean of the seven **unrounded** category values, rounded once. Displayed categories are independently rounded; their displayed average can differ slightly from the displayed overall. All scores stay on 0–100. No question accounts for more than 1/21 of the overall score (about 4.76 percentage points of possible movement). Changing category/question weights changes that relationship, so re-evaluate it after edits.

Missing answers and unknown option IDs throw an explicit error; they never count as 0 or 100. UI validation blocks moving forward without the current required answers and blocks calculation until all questions are complete. Backward navigation and setup edits preserve answers. Retake requires confirmation, discards answers/result and retains nicknames/photos; clear/home confirmation discards the entire current session.

### Result pipeline and consistency

1. Calculate evidence, category and overall values locally.
2. Interpret overall and cross-category score bands.
3. Match classification to one of ten non-overlapping score bands: 0–9, 10–19, …, 80–89, 90–100.
4. Filter patterns, strengths and challenges by explicit local conditions, including question-type evidence where required.
5. Deterministically rotate eligible candidates using a stable hash of mode and question evidence, then select diverse categories. An observation must pass its category/evidence guards; a category selected as a strength is not also selected as a challenge. Observations describe selected choices, not verified behavior. Summaries distinguish a mixed category profile even when the average is high.
6. Choose an eligible approved verdict template, insert names/label/balance as plain text, and render through text nodes. Nicknames, photos and the current time do not affect scoring or text variant selection. The same answers always produce the same result.

Fallbacks exist for no matching observations, patterns, classification or verdict. Structurally malformed public datasets cause a friendly startup error instead of an unsafe partial quiz. A failed JSON fetch shows a retry action and useful console diagnostics.

## Privacy and images

All names, choices, scores and selected photo references live only in this tab's module state. No localStorage, sessionStorage, IndexedDB, cookies, image data URLs or image blobs are used for persistence. No user data is added to URLs. Loading the public HTML/CSS/JS/JSON requests files from the hosting server; that hosting service can have ordinary request logs. The application itself sends no participant information, scoring requests or telemetry anywhere.

Photos are checked for supported MIME type and <=5 MB file size, then decoded in the browser. A failed decode keeps the existing photo. Object URLs are revoked on replacement/removal, reset and non-cached page exit. Pending-decode URLs are immediately revoked on reset; a late completion cannot restore a cleared photo. Removing an image never blocks the questionnaire. Image files never leave the browser through this application.

Reloading or closing the page loses the current in-memory session. Clearing the session releases the app's current references and returns home; it **cannot guarantee forensic deletion** from the device, browser caches, back/forward state, screenshots, print files or anything independently saved. Certificates are intentionally not automatically saved or shared. Browser-native print/PDF output can contain the nicknames/photos shown, so handle it accordingly.

## Cloudflare Workers deployment

Prerequisites: a current modern Node.js installation supported by Wrangler, npm, a Cloudflare account, and Wrangler CLI access. Validated here with Node.js 22.23.4 and Wrangler 4.162.0. No account credentials belong in the project.

```sh
npx wrangler login
npx wrangler deploy
```

The exact deployment command, run from inside `MATCHPLAY/`, is:

```sh
npx wrangler deploy
```

Optional validation before publishing:

```sh
npx wrangler deploy --dry-run
```

For the tested CLI version explicitly:

```sh
npx wrangler@4.162.0 dev
npx wrangler@4.162.0 deploy --dry-run
```

Change `"name": "matchplay"` in `wrangler.jsonc` to a unique Worker name for your account if desired. There is no backend, no bindings to provision, no build command and no Worker script. The project root (`"directory": "./"`) is the static asset directory. Navigation is contained within the document, so no SPA fallback/Pages configuration is needed; unknown paths return 404. No `$schema` is included because the archive intentionally does not ship `node_modules` or a broken local schema path.

**Important correction to the example brief:** Wrangler 4.162.0 rejects `assets.binding` in a scriptless, assets-only Worker with “Cannot use assets with a binding in an assets-only Worker.” The unused `ASSETS` binding was therefore removed; the final minimal configuration passes `wrangler deploy --dry-run`. Adding an otherwise-unneeded Worker script would introduce complexity without a functional benefit.

`.assetsignore` is located at the root of the assets directory and uses supported gitignore syntax. It excludes README/config, itself, `.wrangler/`, `.git/`, Node dependencies, package metadata, logs and ZIPs. Public CSS, JS and JSON must remain public; those are the downloadable client application, not secrets. A generic HTTP development server does not enforce this exclusion file. Check deployed headers/routing again if integrating a custom domain, reverse proxy or other product later.

Cloudflare reference pages checked during implementation:

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/binding/

**Deployment has not occurred.** Dry-run and local preview do not publish a live site. Authenticate to your own account and run the deploy command to publish.

## Editing questions and result content

Edit `data/platonic.json` or `data/romantic.json`, keeping JSON valid. Each question needs a globally unique stable `id`, matching `mode`, `type` (`individual`, `comparative`, `situational`), a valid `category`, positive finite `weight`, helpful `text`, `help`, `tags`, and two or more distinct answer options. Each option needs a unique `id` and `text`. Individual options use finite numeric `value`; scenario options use finite `score` within 0–100. The individual scale must have a nonzero range. Existing content uses four options and the mapping above.

Keep category IDs stable. Each category needs a unique ID, visible label, positive finite weight and at least one question. The application adapts its question count and progress automatically; introductory text saying “21” and duration estimates should be updated if the questionnaire length changes. The current code validates identifiers, references and mapping ranges before showing the quiz.

Result arrays: `classifications`, `strengths`, `challenges`, `patterns`, `verdicts`. Each entry needs a stable unique ID, `type`, `category` (a category ID or `overall`), `tags`, `conditions` and approved user-facing `text`. Supported conditions:

- `overallMin`, `overallMax`: inclusive 0–100 thresholds.
- `categoryMin`, `categoryMax`: inclusive rounded category thresholds.
- `questionType`: identifies a question in the entry's category; `evidenceMin`/`evidenceMax` apply to that question's unrounded evidence value.

If you add multiple questions of the same type in one category, extend condition matching to reference a specific question ID instead of assuming the first matching question. With the shipped data there is exactly one question per category/type. Unknown condition keys are rejected. Keep min <= max, observation wording appropriate to its guards, every classification band covered exactly once, and at least one verdict eligible for every overall score. All entry IDs must be unique within their mode file, including question and option IDs. A stable ID is used for validation and selection, not as an HTML string containing participant input.

Templates support `{a}`, `{b}`, `{classification}`, `{balance}`; do not invent unsupported tokens. `{balance}` comes from the shared aligned/mixed/divergent summary. Five variants per band share matching conditions; the deterministic hash selects among them. Shared templates are looked up by ID, so preserve referenced IDs or update their callers and validation. Shared entries ending in `-tip` are reachable in rotating question hints. Shared `rarity` entries must cover 0–100 once each. Keep all copy entertainment-focused and avoid hidden-feelings, diagnostic, scientific or consent claims.

After changing content, run through both modes, inspect review/edit and extremes, and rerun classification coverage, evidence/observation guards and template reachability. The exported pure scoring functions can also be imported from a test harness; they do not require a DOM. Do not add analytics or remote scoring to “improve” the result.

## Validation performed on 2026-11-15

The delivered application was served over **Wrangler dev**, not `file://`, and exercised in headless Chromium 159 using Playwright. Testing tooling was isolated outside the delivered project; no runtime dependency or testing installation is needed by end users.

Verified in the main suite (37 reported checks):

- Landing automated WCAG A/AA scan
- Landing no horizontal overflow at 280, 320, 360, 390, 768 and 1440 px
- Help dialog opens and closes with Escape
- Privacy dialog opens and closes
- Pure engine: 0/100 boundaries, 69 normalization, missing/unknown rejection, deterministic output, safe substitution and fallbacks
- Dataset IDs, mappings and references validated; all ten score bands reachable; all non-template conditions matched
- Setup platonic automated WCAG A/AA scan
- Photo rejects unsupported, oversized and corrupt files; valid preview, replacement and removal work
- Individual question platonic automated WCAG A/AA scan
- Back/forward retains answers platonic
- Situational question platonic automated WCAG A/AA scan
- Review platonic automated WCAG A/AA scan
- Review and edit round trip platonic
- Results platonic automated WCAG A/AA scan
- Result score, both mode content, and six responsive widths platonic
- Print action invokes native print; print CSS renders PDF platonic
- Retake cancellation preserves result platonic
- All created image object URLs revoked on replace/remove/reset
- Confirmed reset clears all current state platonic
- Setup romantic automated WCAG A/AA scan
- Individual question romantic automated WCAG A/AA scan
- Back/forward retains answers romantic
- Situational question romantic automated WCAG A/AA scan
- Review romantic automated WCAG A/AA scan
- Review and edit round trip romantic
- Results romantic automated WCAG A/AA scan
- Result score, both mode content, and six responsive widths romantic
- Print action invokes native print; print CSS renders PDF romantic
- Retake cancellation preserves result romantic
- Retake clears answers but retains names
- Confirmed reset clears all current state romantic
- No storage entries, external requests or data-submitting requests
- No console/page errors or failed normal-use requests
- Review refuses calculation with 21 missing answers
- Reduced-motion preference supported
- Dataset HTTP failure has friendly retry state
- Malformed dataset safely rejected

Additional verification:

- Actual output selection, not just condition eligibility: all 10 classifications and all 50 verdict variants were selected in each mode across 3,002 constructed complete profiles per mode (6,004 total). Strength/challenge evidence guards and category-exclusion rules were checked for every profile.
- Keyboard skip link; Enter activation for mode/form/next; native radio Arrow/Space operation; reset dialog initial focus and Escape cancellation without lost answers.
- Reset during pending image decode immediately revokes the pending URL and cannot restore a cleared photo.
- Wrangler preview returned 404 for README.md, wrangler.jsonc, .assetsignore and the checked internal .wrangler path. Source resource links were inspected and static JSON files parsed.
- Visual inspection of desktop landing, narrow mobile landing/results and desktop results screenshots. Print CSS produced readable local PDF certificates for both modes.
- Wrangler 4.162.0 `deploy --dry-run` succeeds with the final assets-only configuration, no Worker entry point, no bindings and project-root assets.
- Final ZIP contents, CRC integrity, required paths and absence of caches/dependencies/credentials checked during packaging.

### Limitations / not claimed as tested

No real Cloudflare account deployment, live custom-domain smoke test, mobile hardware test, Android WebView test, Firefox/Safari run, manual screen-reader audit or exhaustive browser/device certification was performed. Automated axe A/AA scans are useful checks, not an accessibility certification. Browser-native printing/pagination can vary by browser and paper size; the certificate is print-oriented HTML, not a pixel-identical cross-browser PDF engine. Dark gradients and borders may print differently unless background printing is enabled; the print stylesheet deliberately uses a simple light layout.

The score model is an original editorial entertainment model, not a validated compatibility instrument. Questionnaire choices are deliberately transparent and can be selected to steer a result; that is consistent with one operator authoring both sides of an imagined scenario. There is no identity verification, hidden-feelings detection, AI, live multiplayer or real-world prediction. Optional mini-games and a remote share link were intentionally omitted in favor of a complete, private core journey.

This is a tested deployable source package, not a claim that every possible production environment has been certified. Review and smoke-test on your actual target devices and hosting account before public launch.
