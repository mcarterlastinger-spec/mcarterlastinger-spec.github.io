# Sales Intelligence Lab: The Enterprise Discovery Challenge

An interactive, browser-based sales enablement simulation. Learners run a discovery call, read a buying group, build a customer-specific value proposition, and handle objections. Then they receive a competency-based debrief tied directly to their decisions.

Built as a static web app (HTML, CSS, and vanilla JavaScript). No build step, backend, API keys, external fonts, or third-party services.

**Current release: Version 2.3.** A learner-facing PDF User Guide is in `docs/`.

**Version 2** is a complete visual and UX redesign. The instructional engine, content, and scoring are unchanged from Version 1. See [What changed in Version 2](#what-changed-in-version-2).

## Files

```
index.html        Page shell, dialogs, and script/style references
css/styles.css    Design tokens, layout, components, responsive, and reduced-motion rules
js/data.js        ALL scenario content, feedback copy, and scoring rules (edit here)
js/app.js         Rendering, interactions, and scoring functions (reads data.js)
tests/run.js      Playwright end-to-end, accessibility, and responsive tests (53 checks)
tests/parity.js   Runs random learner paths through V1 and V2 and compares every score
tests/diagram.js  Checks the data-landscape diagram's record IDs, explanation, overlap, and readability
tests/refinements.js  V2.2 checks: conditional debrief feedback, objection log, EU context
tests/navigation.js 171 checks that every screen answers: where am I, what now, how to continue
tests/clipping.js Checks that no workspace content is clipped at widths from 320 to 1,600 pixels
tests/drivers.js  Shared test drivers for both versions
docs/             Sales-Intelligence-Lab-User-Guide.pdf (Version 2.3)
baseline-v1/      Version 1, preserved unchanged as a working baseline
```

## Run locally

Open `index.html` in a browser. No server is required.

Or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Verify locally before deploying

1. Unzip the package and open `index.html` directly in Chrome or Edge, or serve the folder (`python3 -m http.server 8000`) and visit `http://localhost:8000`.
2. Walk through all four stages and the debrief, following only the Next step bar at the bottom of each screen. On the debrief, expand the decision log and select **Print or save as PDF** to check the printout. The button appears only when the page is opened on its own.
3. Optional automated checks (requires Node.js): run `npm i playwright`, then run the suites below from the project folder. Each prints PASS or FAIL lines and a final summary.
   ```bash
   node tests/run.js           # 53 end-to-end, accessibility, and responsive checks
   node tests/diagram.js       # 45 data-landscape checks at four widths
   node tests/refinements.js   # 42 V2.2 refinement checks
   node tests/navigation.js    # 171 navigation and progression checks (desktop and phone)
   node tests/clipping.js      # clipped-content checks at eight widths, 320 to 1,600 px
   node tests/parity.js        # 30 random paths: V2.2 vs. the V1 baseline
   ```
4. Open `docs/Sales-Intelligence-Lab-User-Guide.pdf` and compare it with the running application.

## Deploy to GitHub Pages

1. Create a new repository (for example, `sales-intelligence-lab`) and push the contents of this folder to the `main` branch, with `index.html` at the repository root.
   ```bash
   git init && git add . && git commit -m "Sales Intelligence Lab"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sales-intelligence-lab.git
   git push -u origin main
   ```
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. After a minute or two, the site is live at `https://<your-username>.github.io/sales-intelligence-lab/`.

All paths are relative, so the app works from any subfolder or custom domain.

## Editing the scenario

Everything a designer would change is in `js/data.js`, organized by stage:

| Section | What you can edit |
|---|---|
| `meta`, `scenario` | Title, disclaimer, customer brief, system-map labels, and headline stats |
| `discovery` | Question bank, display order, question budget, customer responses, insights, points, trust effects, and feedback |
| `stakeholders` | People, priorities, concerns, correct roles, message options, points, and feedback |
| `value` | Requirements, capabilities, correct matches, classification items, composer building blocks, and evidence scoring |
| `objections` | Objections, response options (strong, partial, or poor), reactions, feedback, and the first-try and revision scoring table |
| `debrief` | Proficiency bands, strength threshold, and the strength, development, and next-step copy for each competency |

Each `maxPoints` value is documented next to the rule that produces it. If you add or remove items, update `maxPoints` to match.

## Scoring model (deterministic)

| Competency | Points | Max |
|---|---|---|
| Discovery effectiveness | Each of 5 questions: 3 (uncovers an insight), 1 (closed question), or 0 (pitch, early pricing, or early demo) | 15 |
| Stakeholder alignment | 2 per correct role; message 3 (tailored), 1 (generic or misdirected), or 0 (counterproductive) | 15 |
| Value articulation | 2 per correct match (5), 1 per correct classification (3), 0 to 3 per composer block (4) | 25 |
| Objection handling | First response 4, 2, or 0. One optional revision scores 3, 2, or 0. The higher attempt counts. | 16 |

Each competency is reported as a percentage of its maximum. The overall score is the unweighted mean of the four. Bands are Strong (85+), Proficient (65–84), and Developing (under 65).

The customer trust meter is narrative feedback only and does not affect scores. The debrief includes a decision log that shows the source of every point.

## Instructional design decisions

**Adapted from the source course, not copied.** The source module's frameworks are converted into practice decisions: multi-stakeholder selling, the four buyer-group questions (budget holders, influencers, blockers, who sets priorities), perceived versus real priorities, capability-to-need matching, features versus benefits versus business needs, value-proposition statements in 25-, 50-, and 100-word formats, and the trust, client-knowledge, and closing impediments. The scenario uses a new fictional customer (Halvorsen Therapeutics), a fictional vendor (Aperion), and no proprietary customer details, case-study figures, or competitor claims.

**Decisions carry forward.** Real enterprise selling is cumulative, so the simulation is too. The insights a learner uncovers in Stage 1 appear in the Deal room. They also determine which evidence is available when composing the value proposition in Stage 3. A learner who pitches instead of asking can't cite the customer's own numbers later, and the feedback explains why. Asking about the buying group in Stage 1 unlocks a briefing note in Stage 2.

**Scarcity forces judgment.** Discovery allows only 5 of 10 questions. Six questions are strong, so there's no single right set. Learners must prioritize, as they would in a 45-minute call. Questions can't be taken back.

**Plausible distractors.** Weak options are realistic habits, not straw men: closed questions, leading pitches, early pricing, early demos, feature dumps, messages aimed at the wrong stakeholder, discounting, mandates, overpromising, and disparaging competitors. The source course emphasizes "trust-based impediments," so each poor choice has a visible consequence in customer trust and a customer reaction, not just a score.

**Feedback explains why.** Every decision gets contextual feedback naming what made it effective or ineffective. Partial-credit options explain what they got right as well as what they missed.

**Productive failure and revision.** In objection handling, a missed first response triggers a realistic customer reaction and coaching, then one chance to revise. A strong revision earns most of the credit (3 of 4), rewarding recovery while still distinguishing it from getting it right the first time.

**A reusable framework.** Stage 4 keeps the Acknowledge, Clarify, Respond, Confirm pattern visible as a job aid. The four objections cover the brief's categories: implementation complexity, ROI, organizational change, and competitive alternatives.

**Honest measurement.** Scores are transparent, deterministic, and explained in a Scoring rules dialog. The disclaimer states plainly that this is practice, not a validated assessment. No analytics or benchmarks are invented.

## Accessibility (WCAG 2.1 AA principles)

- Semantic controls throughout: native buttons, radio groups in `fieldset`/`legend`, labeled `select` elements, native `dialog` and `details` elements, and the WAI-ARIA tabs pattern (with arrow, Home, and End keys) for the stakeholder cards and the Value studio.
- Fully keyboard operable. Focus moves to the stage heading on navigation, to the next available question after asking one, and back to the trigger when a dialog closes.
- Visible focus indicator (a 2px cobalt outline with a soft halo) on every interactive element. Scroll padding keeps focused elements from hiding under the sticky header or footer.
- Live-region announcements for customer responses, feedback, and score results.
- Color is never the only signal: every result also has a text label ("Effective", "Partly effective", "Ineffective", "Best answer") and an icon. Stage states use badges and screen-reader text, and value-proposition segments carry hidden labels.
- Text colors meet 4.5:1 contrast, including on badges and filled controls. Stage colors that are too light for text (teal and amber) use darker text shades.
- `prefers-reduced-motion` disables the network-diagram drawing, entrance animations, and transitions.
- Responsive from 320px. The Deal room collapses into a disclosure panel on narrower screens.
- Skip link to the main content.

## Testing

Install Playwright (`npm i playwright`), then run from the project folder:

- `node tests/run.js` runs 53 checks and saves screenshots to `tests/screenshots/`.
- `node tests/parity.js` runs 30 random learner paths through V1 and V2 (set `N` to change the count).

`tests/run.js` verifies:

- The best path scores 100 (15, 15, 25, and 16 points)
- The worst path scores 8 (4, 0, 1, and 0 points), and trust clamps at 0
- A mixed path with revisions scores 76 (10, 13, 20, and 11 points), all matching hand calculations
- Discovery evidence carries forward: the Stage 3 evidence options exactly match the insights uncovered, plus the generic option, and the Stage 2 intel note reflects whether the buying-group question was asked
- Objection revision and score retention: partial then strong keeps 3 of 4, poor then partial keeps 2, and a kept partial keeps 2. Used options stay locked during revision
- The coaching example appears only after submission, is labeled as instructional, and doesn't alter the learner's answer
- Stage locking, the question budget (asked questions stay visible and disabled), submit gating, and reset
- Keyboard-only play: reaching Start, asking questions, arrow and Home/End keys in the stakeholder tabs, radio arrows, and focus moving to the score banner, the revise button, and the next objection
- The Scoring rules dialog opening and closing with Esc, with focus returned to its trigger
- The decision log being collapsed by default and expandable, with 27 decisions and 4 group headers
- No horizontal overflow at 320px, 390px, and 820px on every stage, including the expanded Deal room
- The reduced-motion behavior, and no JavaScript errors
- An automated contrast audit of all visible text in every stage at desktop width, and the mobile debrief, against WCAG AA (4.5:1, or 3:1 for large text)

`node tests/diagram.js` checks the Customer data landscape diagram at 1440px, 1024px, 390px, and 320px. It confirms that each system shows its correct record ID, that the old "ID 1" through "ID 4" labels are gone, that no ID pill overlaps a label or another pill, and that the explanation sits above the diagram. It also confirms that all 23 interfaces and 4 dashed record links remain, that the IDs appear in the diagram's screen-reader description, and that the IDs are readable at every width.

`node tests/refinements.js` checks the V2.2 refinements:
- The organizational-change development note appears only when the first response to that objection was not fully effective, and its wording matches the learner's actual first response and outcome (six branches).
- The objection log shows the stakeholder, both attempts with their effectiveness and points, and the retained score, with expandable response text.
- The log still has 27 decisions, and printing expands it.
- The EU context appears in the Brief and in Stage 3, and no residency insight is granted unless the learner asks the discovery question that uncovers it.

`node tests/navigation.js` runs at desktop (1,440 × 900) and phone (390 × 844) sizes:
- **Three-question audit.** At every state of the journey, scrolled to both the top and the bottom of the page, it checks three things. *Where am I?* The current stage is named in the navigation, or in the Next-step bar on phones. *What now?* A plain-language instruction is visible. *How do I continue?* An enabled primary button is visible, with at least 4.5:1 contrast and no competing primary button.
- **Primary-only learner.** A simulated learner who only presses the Next-step button, and picks whatever control it focuses, completes the whole simulation from Brief to Debrief.
- **Incomplete, incorrect, and revised paths.** These cover partly finished stakeholder plans (exact gaps named, shortcut chips, and no Submit until ready), Value Studio parts done out of order, ineffective responses with revise or keep, effective first responses (no revision offered), and kept responses.
- **Other behavior.** It also covers the locked-stage notice, resume from the Brief, selection confirmations announced to screen readers, and the debrief actions.

`node tests/clipping.js` walks every stage at 320, 390, 820, 1,181, 1,280, 1,366, 1,440, and 1,600 pixels wide and fails if any element extends past its section's content area.

`tests/parity.js` checks that V2 is behaviorally identical to V1. Since V2.2, the four objection rows of the log are richer than in V1, so parity compares those rows on retained points and the effectiveness of each attempt; every other row must match exactly. On each random path it compares the four competency point totals, final trust, the overall score, and every row of the decision log.

## What changed in Version 2

**Preserved exactly.** `js/data.js` keeps all Version 1 content and rules (Version 2.1 adds only display fields; see below), and the scoring functions in `js/app.js` were carried over verbatim. All scenario facts, questions, responses, options, feedback, trust adjustments, evidence carryover, revision rules, and competency calculations are unchanged. The parity test confirms that the same choices produce the same scores, trust, and decision log in both versions.

**Visual identity.** A light-mode enterprise interface on a #F7F9FC canvas with white workspaces, #183153 ink, and #E8EEF6 borders. Each stage has a color: Discovery cobalt #2563EB, Stakeholders teal #0D9488, Value violet #7C3AED, Objections amber #D97706, and Debrief green #15803D. For text on white, the teal and amber use darker shades (#0F766E and #B45309) to meet AA contrast. The app uses a custom icon set, soft layered shadows, and restrained tint gradients. Motion is limited to one entrance (the network diagram drawing in) plus feedback that responds to the learner's actions.

**Shell and navigation.** A white top bar holds a stepper with stage icons and three distinct states: current (filled stage color), complete (check badge), and locked (lock badge plus a screen-reader label). A four-segment progress rail fills in stage colors. The Deal room is now a light panel with a trust gauge, an insights grid, a stage-completion indicator, insight cards, buying-group role tags, and competency bars. Below 1180px it collapses into a summary bar.

**Brief.** An account header shows the opportunity tags and the trigger event. A redesigned data-network diagram draws exactly 23 point-to-point interfaces between the four systems, and a hub labeled "1 hospital, 4 versions" shows each system holding a differently numbered record. It sits beside the key business challenges, a metric row, role and mission cards, and a color-coded four-stage journey.

**Discovery.** A three-panel workspace: a sticky question bank (asked questions stay visible, numbered, and disabled), the customer conversation as chat bubbles with compact coaching beneath each answer, and the Deal room. A status strip tracks questions, trust, and insights.

**Stakeholders.** Selectable profile cards (an accessible tab list) for each stakeholder, with a focused detail workspace showing their quote, influence, stance, priorities, concerns, role cards, and message options. Role feedback and message feedback appear as separate, clearly labeled cards.

**Value Strategy Studio.** Three tabbed workspaces: A. Match, B. Classify, and C. Compose. The match tab has a capability library that marks capabilities already used. The classify tab shows a feature, benefit, and outcome ladder. The compose tab has a prominent live preview that color-codes the problem, solution, evidence, and outcome, with labels for screen readers and a legend. After submission, a coaching example appears beside the learner's proposition, labeled as instructional coaching rather than a customer claim. It never changes the answer or score. If the strongest evidence wasn't uncovered in discovery, the example says so.

**Meeting simulator.** A meeting agenda tracks the four objections. The current objection appears as a prominent stakeholder card. Responses are presented as lettered decision cards. The conversation timeline shows each response, the customer's reaction, and the coaching, with a revision divider and a retained-score summary. The Acknowledge, Clarify, Respond, Confirm framework is a compact visual guide.

**Debrief dashboard.** An overall score ring with the proficiency band, four color-coded competency cards with rings and threshold bars, and Strengths, Development, and Next-steps panels. The full decision log is in a collapsible panel that shows totals while closed, with a points pill on each row.

**Accessibility fixes found during V2 testing.** The page now has bottom scroll padding so the sticky footer can't hide focused controls. Focus after an objection response follows an explicit priority order. Narrow layouts (down to 320px) no longer overflow. Avatar initials and step numbers meet contrast requirements. A hover rule that reduced the current step icon's contrast was corrected.

### Version 2.1: data-landscape clarity correction

The brief's diagram now labels each system with a realistic, fictional customer record ID for the same hospital: CRM-1042, ERP-7821, REB-3098, and WH-5516. These replace the ambiguous "ID 1" through "ID 4". A short explanation above the diagram reads: "One hospital. Four systems. Four different customer IDs." On screens 640px and narrower, the diagram's own labels scale down to about 6–7px, so a readable ID key in matching system colors appears beneath it. The IDs and the explanation live in `js/data.js` (`scenario.systems[].recordId` and `scenario.landscapeNote`) and are display-only. They don't affect any interaction or score.

### Version 2.2: final refinements

- **Data landscape:** keeps the V2.1 record IDs (CRM-1042, ERP-7821, REB-3098, and WH-5516) and their explanation. The diagram nodes are slightly wider, with 10px subtitles, so labels such as "Contracts and chargebacks" fit inside their cards.
- **Development feedback:** the debrief adds a conditional note for the organizational-change objection. It appears only when the first response was not fully effective. It explains what the first response emphasized (training materials and webinars, or a leadership mandate), how that affected the stakeholder's concern about extra work and disruption, and either why the revision worked (launch readiness, no new tool for reps, and leaders helping plan the rollout) or what a stronger response would do. The text lives in `js/data.js` (`objections.items[].debriefNote`).
- **Decision log:** each objection row now shows the stakeholder who raised it, the first response (letter, effectiveness, and points), any revised response (letter, effectiveness, and points), and the retained score, plus a **Show your responses** toggle with the exact wording. Printing expands the log and every response.
- **EU data residency:** the Brief now says Halvorsen sells in 14 markets "including several in the European Union." Stage 3 states that the five requirements came from Halvorsen's team after the discovery call. Discovery scoring and insights are unchanged.
- **Laptop widths:** from 1,181 to 1,400 pixels, the debrief competency cards use two columns and the stakeholder profile stacks, so text no longer wraps one or two words per line.
- **Unchanged:** scoring rules, decision counts, stage progression, and all other content.

### Version 2.3: global navigation and progression

- **One progression pattern everywhere.** Every screen ends with a sticky Next-step bar in the stage color. It shows where the learner is (a status line, plus the stage name on phones), what to do now (one plain-language instruction), and how to continue (one primary button with a descriptive label and a directional arrow where it moves forward). Secondary actions sit beside it in a quiet style.
- **Never just a disabled button.** Before a stage is complete, the primary button takes the learner to the next required choice: Choose question 3, Choose Marcus's message, Choose a capability for R3, Choose a response, and so on. Remaining items are listed as clickable shortcuts. When everything is complete, the button is immediately promoted to Submit stakeholder plan, Submit value proposition, Continue to …, Next objection: …, See your debrief, or Print or save as PDF.
- **Feedback after every action.** Each selection updates the bar and is confirmed to screen readers ("Saved. Next step: …"). After a response or submission, focus moves to the next sensible control.
- **Stage-by-stage changes:**
  - **Brief:** the main button resumes at the current stage after progress ("Continue to Value").
  - **Locked stages:** selecting one explains which stage to finish first and offers a Go to button.
  - **Objections:** Try a different response and Keep this response moved into the bar (primary and secondary), as did Next objection and See your debrief.
  - **Debrief:** the bar offers Open decision log, Start over, and Print or save as PDF. The log summary now has a visible Show details or Hide details label.
- **Responsive fixes found by the new tests:**
  - At 320px, the objection agenda forced sideways scrolling. This was pre-existing.
  - On phones, the decision log table scrolled sideways inside its panel. It now shows each row as a card.
  - Stakeholder cards overflowed by 2px at 320px.
  - The workspace column is now pinned to the screen width.
  - Bottom scroll padding now clears the taller bar.
- **Unchanged:** scoring, weighting, content, customer responses, decision dependencies, coaching and revision rules, and `js/data.js`.

## Known limitations

- Progress isn't saved between visits. Refreshing the page starts over.
- The app uses a system font stack, so typography varies slightly by operating system. IBM Plex Sans is used automatically where it's installed. To guarantee it, add the font files to a `fonts/` folder and include `@font-face` rules in `styles.css`.
- **Not yet tested with assistive technology.** Accessibility was verified with automated keyboard, focus, layout, and contrast checks in headless Chromium. It hasn't been tested with a screen reader (NVDA, JAWS, VoiceOver, or TalkBack), voice control, Windows High Contrast or forced-colors mode, or 200% and 400% browser zoom. Firefox and Safari also weren't tested. Live-region announcement timing and the tab-list pattern should be confirmed with a real screen reader before production use.
- **The contrast audit has gaps.** It measures solid background colors. Text over gradients is measured against the nearest solid color, and non-text contrast (icons and control borders) was set by design and not measured automatically.
- The "Print or save as PDF" button appears only when the page runs standalone (for example, on GitHub Pages), because embedded previews block printing.
- Content is English only, and the scenario is a single linear story. Branching is at the decision level, not separate storylines.
