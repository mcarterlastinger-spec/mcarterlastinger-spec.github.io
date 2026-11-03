/* =====================================================================
   Sales Intelligence Lab — application logic (Version 2 presentation)
   ---------------------------------------------------------------------
   - All content and scoring rules come from window.LAB_DATA (data.js).
   - The "Scoring" section is carried over unchanged from Version 1, so
     the same decisions always produce the same scores as before.
   - Rendering is plain DOM templating; no framework or build step.
   ===================================================================== */
(function () {
  "use strict";

  const D = window.LAB_DATA;
  // Printing is blocked inside sandboxed embeds, so the print button only shows on a standalone page.
  const EMBEDDED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const STAGES = [
    { id: "intro", label: "Brief", icon: "brief", tone: "brief" },
    { id: "discovery", label: "Discovery", comp: "discovery", icon: "chat", tone: "disc", n: 1 },
    { id: "stakeholders", label: "Stakeholders", comp: "stakeholders", icon: "people", tone: "sh", n: 2 },
    { id: "value", label: "Value", comp: "value", icon: "gem", tone: "val", n: 3 },
    { id: "objections", label: "Objections", comp: "objections", icon: "shield", tone: "obj", n: 4 },
    { id: "debrief", label: "Debrief", icon: "chart", tone: "deb" }
  ];
  const COMP_TONE = { discovery: "disc", stakeholders: "sh", value: "val", objections: "obj" };
  const COMP_ICON = { discovery: "chat", stakeholders: "people", value: "gem", objections: "shield" };

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  function freshState() {
    return {
      view: "intro",
      discovery: { asked: [] },
      stakeholders: { roles: {}, messages: {}, submitted: false },
      value: { matches: {}, classify: {}, composer: {}, submitted: false },
      objections: { current: 0, attempts: {} }, // attempts[oid] = [optIndex, optIndex?]
      newInsight: null,
      newTurn: null,
      drOpen: false,
      ui: { sh: "dana", vtab: "match", logOpen: false }
    };
  }
  let S = freshState();

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (p, m) => (m ? Math.round((p / m) * 100) : 0);
  const person = (id) => D.stakeholders.people.find((p) => p.id === id);
  const question = (id) => D.discovery.questions.find((q) => q.id === id);
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function announce(msg) {
    const a = $("#announcer");
    a.textContent = "";
    setTimeout(() => { a.textContent = msg; }, 30);
  }

  /* Icons: one consistent 20px stroke set, drawn for this app. */
  const PATHS = {
    brief: '<rect x="4" y="2.5" width="12" height="15" rx="2"/><path d="M7 7h6M7 10h6M7 13h3.5"/>',
    chat: '<path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9.2L6 16.3v-2.8h-.5a2 2 0 0 1-2-2z"/><path d="M7.4 8.6h.01M10 8.6h.01M12.6 8.6h.01" stroke-width="2.4"/>',
    people: '<circle cx="7.5" cy="7" r="2.6"/><path d="M2.8 16c.6-2.6 2.4-4 4.7-4s4.1 1.4 4.7 4"/><circle cx="14" cy="7.6" r="2.1"/><path d="M13.8 11.9c1.8.2 3 1.4 3.5 3.5"/>',
    gem: '<path d="M5.6 3.5h8.8l3.1 4L10 16.5 2.5 7.5z"/><path d="M2.5 7.5h15M8.2 3.5 6.8 7.5 10 16.5l3.2-9-1.4-4"/>',
    shield: '<path d="M10 2.5 16 4.7v4.6c0 3.9-2.6 6.7-6 8.2-3.4-1.5-6-4.3-6-8.2V4.7z"/><path d="m7.3 10 1.9 1.9 3.6-3.8"/>',
    chart: '<path d="M3.5 16.5h13"/><rect x="5" y="9" width="2.6" height="5.5" rx=".6"/><rect x="8.8" y="5.5" width="2.6" height="9" rx=".6"/><rect x="12.6" y="11" width="2.6" height="3.5" rx=".6"/>',
    lock: '<rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.6a3 3 0 0 1 6 0V9"/>',
    check: '<path d="m5 10.5 3.2 3.2L15 6.8"/>',
    cross: '<path d="m6 6 8 8M14 6l-8 8"/>',
    half: '<circle cx="10" cy="10" r="6.5"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" stroke="none"/>',
    info: '<circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 6.3v.1"/>',
    spark: '<path d="M10 2.8 11.6 8.4 17.2 10l-5.6 1.6L10 17.2l-1.6-5.6L2.8 10l5.6-1.6z"/>',
    building: '<rect x="4" y="2.8" width="12" height="14.4" rx="1.6"/><path d="M7.4 6.4h1.2M11.4 6.4h1.2M7.4 9.6h1.2M11.4 9.6h1.2M8.4 17.2v-3.4h3.2v3.4"/>',
    db: '<ellipse cx="10" cy="5" rx="5.8" ry="2.2"/><path d="M4.2 5v10c0 1.2 2.6 2.2 5.8 2.2s5.8-1 5.8-2.2V5M4.2 10c0 1.2 2.6 2.2 5.8 2.2s5.8-1 5.8-2.2"/>',
    alert: '<path d="M10 3.2 17.3 16H2.7z"/><path d="M10 8.2v3.6M10 13.9v.1"/>',
    user: '<circle cx="10" cy="7" r="3"/><path d="M4.2 16.6c.8-3 3-4.6 5.8-4.6s5 1.6 5.8 4.6"/>',
    flag: '<path d="M5 17.5V3M5 3.6h9.4l-2.1 3.3 2.1 3.3H5"/>',
    usercheck: '<circle cx="8" cy="7" r="3"/><path d="M2.8 16.5c.7-2.8 2.7-4.3 5.2-4.3 1.2 0 2.3.3 3.2 1"/><path d="m12.4 14.3 1.7 1.7 3.3-3.5"/>',
    help: '<circle cx="10" cy="10" r="7.5"/><path d="M8 7.8a2.1 2.1 0 1 1 3 1.9c-.7.4-1 .9-1 1.6v.3M10 14.2v.1"/>',
    checkcircle: '<circle cx="10" cy="10" r="7.5"/><path d="m6.8 10.2 2.2 2.2 4.3-4.6"/>',
    target: '<circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="4.3"/><circle cx="10" cy="10" r="1.2" fill="currentColor"/>',
    link: '<path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.9.9"/><path d="M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l.9-.9"/>',
    calendar: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 2.8v3.4M13 2.8v3.4"/>',
    trend: '<path d="m3 13.5 4.5-4.5 3 3L17 5.5"/><path d="M12.5 5.5H17V10"/>',
    arrowleft: '<path d="M16 10H4.5M9 5 4 10l5 5"/>',
    arrowright: '<path d="M4 10h11.5M11 5l5 5-5 5"/>',
    arrowup: '<path d="M10 16V4.5M5 9l5-5 5 5"/>',
    pointer: '<path d="M7 3.5v9l2.4-2.1 1.9 4.3 1.8-.8-1.9-4.3 3.3-.3z"/>',
    send: '<path d="M3.5 10 16.5 4l-4 12-2.7-5.3z"/><path d="m9.8 10.7 2.9-2.9"/>',
    revise: '<path d="M4 10a6 6 0 1 0 1.8-4.3"/><path d="M4 3.8v3.8h3.8"/>',
    star: '<path d="m10 2.8 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z"/>',
    print: '<path d="M6 7.5V3h8v4.5"/><rect x="3" y="7.5" width="14" height="6.5" rx="1.6"/><path d="M6 12h8v5H6z"/>',
    restart: '<path d="M4.5 10a5.5 5.5 0 1 0 1.7-4"/><path d="M4.5 3.5V7H8"/>',
    rules: '<path d="M4 3.5h12v13H4z"/><path d="M7 7h6M7 10h6M7 13h3"/>'
  };
  const icon = (name, cls = "ico") => `<svg class="${cls}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name] || ""}</svg>`;

  // Quality → visual + text treatment. Text labels mean color is never the only signal.
  function qualityChip(q) {
    if (q === "strong") return `<span class="chip chip-good">${icon("check")}Effective</span>`;
    if (q === "partial" || q === "weak") return `<span class="chip chip-mid">${icon("half")}Partly effective</span>`;
    return `<span class="chip chip-bad">${icon("cross")}Ineffective</span>`;
  }
  function fbBox(level, text, lead) {
    const cls = level === "good" ? "fb-good" : level === "mid" ? "fb-mid" : "fb-bad";
    const ico = level === "good" ? "check" : level === "mid" ? "half" : "cross";
    return `<div class="fb ${cls}">${icon(ico)}<p>${lead ? `<strong>${esc(lead)}</strong> ` : ""}${esc(text)}</p></div>`;
  }
  const levelFromPts = (p, max) => (p >= max ? "good" : p > 0 ? "mid" : "bad");
  const ptsLabel = (p, m) => `${p} of ${m} point${m === 1 ? "" : "s"}`;
  const avatar = (p, size = "") => `<span class="avatar av-${p.id} ${size}" aria-hidden="true">${esc(p.initials)}</span>`;
  const speakerOf = (text) => { const m = text.match(/^(Dana|Priya|Marcus):\s*/); return m ? { id: m[1].toLowerCase(), body: text.slice(m[0].length) } : { id: null, body: text }; };
  function ring(value, { size = 72, stroke = 7, tone = "disc", label = "" } = {}) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring ring-t-${tone}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label)}">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - value / 100)).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  }

  /* ------------------------------------------------------------------
     Scoring — pure functions of state
     ------------------------------------------------------------------ */
  function insightsFound(st = S) {
    return st.discovery.asked.map((id) => question(id).insight).filter(Boolean);
  }
  function scoreDiscovery(st = S) {
    const pts = st.discovery.asked.reduce((s, id) => s + question(id).points, 0);
    return { points: pts, max: D.discovery.maxPoints };
  }
  function scoreStakeholders(st = S) {
    let pts = 0;
    D.stakeholders.people.forEach((p) => {
      if (st.stakeholders.roles[p.id] === p.correctRole) pts += D.stakeholders.rolePoints;
      const m = st.stakeholders.messages[p.id];
      if (m != null) pts += p.messages[m].points;
    });
    return { points: pts, max: D.stakeholders.maxPoints };
  }
  function evidenceOptions(st = S) {
    const c = D.value.composer;
    const list = insightsFound(st).map((id) => ({
      id, text: c.evidencePhrases[id], points: c.evidencePoints[id],
      title: D.discovery.insights[id].title, feedback: c.evidenceFeedback[id]
    }));
    list.push({ ...c.genericEvidence, title: "Generic claim", feedback: c.evidenceFeedback.generic });
    return list;
  }
  function slotOptions(slot, st = S) {
    return slot.dynamic ? evidenceOptions(st) : slot.options;
  }
  function scoreValue(st = S) {
    const V = D.value;
    let match = 0, classify = 0, compose = 0;
    V.requirements.forEach((r) => { if (st.value.matches[r.id] === r.answer) match += V.matchPoints; });
    V.classify.items.forEach((it) => { if (st.value.classify[it.id] === it.answer) classify += V.classifyPoints; });
    V.composer.slots.forEach((slot) => {
      const sel = st.value.composer[slot.id];
      const opt = slotOptions(slot, st).find((o) => o.id === sel);
      if (opt) compose += opt.points;
    });
    return { points: match + classify + compose, max: V.maxPoints, parts: { match, classify, compose } };
  }
  function objectionScore(oid, st = S) {
    const item = D.objections.items.find((o) => o.id === oid);
    const att = st.objections.attempts[oid] || [];
    const T = D.objections.scoring;
    let best = 0;
    if (att[0] != null) best = Math.max(best, T.first[item.options[att[0]].quality]);
    if (att[1] != null) best = Math.max(best, T.revised[item.options[att[1]].quality]);
    return best;
  }
  function objectionResolved(oid, st = S) {
    const item = D.objections.items.find((o) => o.id === oid);
    const att = st.objections.attempts[oid] || [];
    if (att.length === 0) return false;
    if (att.length === 2) return true;
    if (item.options[att[0]].quality === "strong") return true;
    return !!(st.objections.kept && st.objections.kept[oid]);
  }
  function scoreObjections(st = S) {
    const pts = D.objections.items.reduce((s, o) => s + objectionScore(o.id, st), 0);
    return { points: pts, max: D.objections.maxPoints };
  }
  function trust(st = S) {
    let t = D.discovery.trustStart;
    st.discovery.asked.forEach((id) => { t += question(id).trust; });
    D.objections.items.forEach((o) => {
      (st.objections.attempts[o.id] || []).forEach((i) => {
        const q = o.options[i].quality;
        t += q === "strong" ? 6 : q === "poor" ? -8 : 0;
      });
    });
    return Math.max(0, Math.min(100, t));
  }
  function stageComplete(id, st = S) {
    switch (id) {
      case "intro": return true;
      case "discovery": return st.discovery.asked.length >= D.discovery.questionBudget;
      case "stakeholders": return st.stakeholders.submitted;
      case "value": return st.value.submitted;
      case "objections": return D.objections.items.every((o) => objectionResolved(o.id, st));
      default: return false;
    }
  }
  function stageUnlocked(idx) {
    for (let i = 0; i < idx; i++) if (!stageComplete(STAGES[i].id)) return false;
    return true;
  }
  function allScores(st = S) {
    return {
      discovery: scoreDiscovery(st),
      stakeholders: scoreStakeholders(st),
      value: scoreValue(st),
      objections: scoreObjections(st)
    };
  }
  function band(p) { return D.debrief.bands.find((b) => p >= b.min).label; }

  // Expose for automated testing and for designers checking rules in the console.
  window.LAB = {
    get state() { return S; },
    scores: () => allScores(),
    trust: () => trust()
  };

  /* ------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------ */
  function go(view) {
    hideToast();
    S.view = view;
    S.newInsight = null; S.newTurn = null;
    render({ focusHeading: true });
    window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
  }

  function renderStepper() {
    const cur = STAGES.findIndex((s) => s.id === S.view);
    $("#stepper").innerHTML = STAGES.map((s, i) => {
      const unlocked = stageUnlocked(i);
      const done = s.comp ? stageComplete(s.id) : false;
      const status = i === cur ? "current" : done ? "complete" : unlocked ? "available" : "locked";
      const badge = done ? `<span class="step-badge">${icon("check")}</span>` : !unlocked ? `<span class="step-badge step-badge-lock">${icon("lock")}</span>` : "";
      return `<li><button type="button" class="step tone-${s.tone} is-${status}" data-go="${s.id}"
        ${i === cur ? 'aria-current="step"' : ""} ${unlocked ? "" : 'aria-disabled="true"'}>
        <span class="step-icon">${icon(s.icon)}${badge}</span>
        <span class="step-text"><span class="step-label">${esc(s.label)}</span><span class="sr-only">, ${status}</span></span></button></li>`;
    }).join("");
    // Progress rail: one segment per scored stage
    $("#progress").innerHTML = STAGES.filter((s) => s.comp).map((s) => {
      const done = stageComplete(s.id);
      const curr = S.view === s.id && !done;
      return `<span class="seg-${s.tone} ${done ? "is-done" : curr ? "is-current" : ""}"></span>`;
    }).join("");
    const n = STAGES.filter((s) => s.comp && stageComplete(s.id)).length;
    $("#progress").setAttribute("aria-label", `${n} of 4 stages complete`);
  }

  /* ------------------------------------------------------------------
     Next step: one model of "what to do now" for every screen.
     Each view renders it as the sticky Next-step bar. The primary button
     always does the next useful thing (it is never just disabled), and
     anything still missing is listed as a clickable shortcut.
     ------------------------------------------------------------------ */
  const first = (p) => p.name.split(" ")[0];
  const qLabelOf = (q) => (q === "strong" ? "effective" : q === "partial" ? "partly effective" : "ineffective");
  function resumeTarget() {
    for (const st of STAGES.filter((x) => x.comp)) if (!stageComplete(st.id)) return st.id;
    return "debrief";
  }
  function shMissing(p) {
    const m = [];
    if (!S.stakeholders.roles[p.id]) m.push("role");
    if (S.stakeholders.messages[p.id] == null) m.push("msg");
    return m;
  }
  function valueMissing() {
    const V = D.value;
    return {
      match: V.requirements.map((r, i) => ({ id: r.id, n: i + 1 })).filter((r) => !S.value.matches[r.id]),
      classify: V.classify.items.map((it, i) => ({ id: it.id, n: i + 1 })).filter((it) => !S.value.classify[it.id]),
      compose: V.composer.slots.map((sl, i) => ({ id: sl.id, n: i + 1, label: SEG_META_LABELS[sl.id] })).filter((sl) => !S.value.composer[sl.id])
    };
  }
  const SEG_META_LABELS = { problem: "customer problem", solution: "proposed solution", evidence: "customer evidence", outcome: "business outcome" };
  const PARTS = [
    { id: "match", letter: "A", label: "Match capabilities" },
    { id: "classify", letter: "B", label: "Feature, benefit, or outcome" },
    { id: "compose", letter: "C", label: "Compose your proposition" }
  ];
  const listJoin = (a) => (a.length <= 1 ? a.join("") : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`);

  function nextStep() {
    const v = S.view;
    const fwd = "arrowright";
    if (v === "intro") {
      const r = resumeTarget();
      const started = S.discovery.asked.length > 0;
      if (!started) return { title: "Read the brief", instr: "When you're ready, start the discovery call with Dana and Priya.", primary: { label: "Start discovery call", go: "discovery", icon: fwd } };
      const st = STAGES.find((x) => x.id === r);
      return { title: "Welcome back", instr: `Pick up where you left off: ${st.label}.`, primary: { label: `Continue to ${st.label}`, go: r, icon: fwd } };
    }
    if (v === "discovery") {
      const n = S.discovery.asked.length, B = D.discovery.questionBudget;
      if (n < B) return {
        title: `${n} of ${B} questions asked`,
        instr: n === 0 ? "Choose your first question from the question bank." : `Answer received. Choose question ${n + 1} of ${B} from the question bank.`,
        primary: { label: `Choose question ${n + 1}`, next: "focusq", icon: "pointer" }
      };
      return { title: "Discovery complete", done: true, instr: "All five questions asked. Your insights are saved in the Deal room.", primary: { label: "Continue to stakeholders", go: "stakeholders", icon: fwd } };
    }
    if (v === "stakeholders") {
      const P = D.stakeholders.people;
      if (S.stakeholders.submitted) return { title: "Stakeholder plan submitted", done: true, instr: "Feedback is shown for each person. Select a profile card to review it, then continue.", primary: { label: "Continue to value proposition", go: "value", icon: fwd } };
      const ready = P.filter((p) => !shMissing(p).length).length;
      const chips = P.map((p) => { const m = shMissing(p); return { label: m.length ? `${first(p)}: ${m.length === 2 ? "role and message" : m[0] === "role" ? "role" : "message"} needed` : `${first(p)}: ready`, done: !m.length, next: m.length ? `shfocus:${p.id}:${m[0]}` : `shtab:${p.id}` }; });
      if (ready === P.length) return { title: "All three stakeholders ready", done: true, instr: "Review your choices, then submit your stakeholder plan. Answers lock when you submit.", chips, primary: { label: "Submit stakeholder plan", action: "submit-stakeholders", icon: "send" } };
      const cur = person(S.ui.sh); const m = shMissing(cur);
      if (m.length) return {
        title: `${ready} of 3 stakeholders ready`, chips,
        instr: `${first(cur)}: choose ${m.length === 2 ? "a role and an opening message" : m[0] === "role" ? "a role in the buying group" : "an opening message"}.`,
        primary: { label: m[0] === "role" ? `Choose ${first(cur)}'s role` : `Choose ${first(cur)}'s message`, next: `shfocus:${cur.id}:${m[0]}`, icon: "pointer" }
      };
      const idx = P.indexOf(cur);
      const nx = [...P.slice(idx + 1), ...P.slice(0, idx)].find((p) => shMissing(p).length);
      return { title: `${ready} of 3 stakeholders ready`, chips, instr: `${first(cur)} is ready. Next: ${nx.name}.`, primary: { label: `Next: ${nx.name}`, next: `shtab:${nx.id}`, icon: fwd } };
    }
    if (v === "value") {
      if (S.value.submitted) return { title: "Value proposition submitted", done: true, instr: "Feedback is shown in each part, with a coaching example in Part C. Review them, then continue.", primary: { label: "Continue to objections", go: "objections", icon: fwd } };
      const miss = valueMissing();
      const tot = { match: D.value.requirements.length, classify: D.value.classify.items.length, compose: D.value.composer.slots.length };
      const doneCount = 12 - miss.match.length - miss.classify.length - miss.compose.length;
      const chips = PARTS.map((p) => ({ label: `${p.letter}. ${tot[p.id] - miss[p.id].length} of ${tot[p.id]}`, done: !miss[p.id].length, next: miss[p.id].length ? `vfocus:${p.id}` : `vtab:${p.id}` }));
      if (doneCount === 12) return { title: "All 12 items complete", done: true, chips, instr: "Check your value proposition in Part C, then submit. Answers lock when you submit.", primary: { label: "Submit value proposition", action: "submit-value", icon: "send" } };
      const cur = S.ui.vtab;
      if (miss[cur].length) {
        const m = miss[cur];
        const instr = cur === "match" ? `Part A: choose a capability for ${listJoin(m.map((r) => `R${r.n}`))}.`
          : cur === "classify" ? `Part B: classify statement${m.length > 1 ? "s" : ""} ${listJoin(m.map((x) => String(x.n)))}.`
          : `Part C: choose the ${listJoin(m.map((x) => x.label))}.`;
        const label = cur === "match" ? `Choose a capability for R${m[0].n}` : cur === "classify" ? `Classify statement ${m[0].n}` : `Choose the ${m[0].label}`;
        return { title: `${doneCount} of 12 items complete`, chips, instr, primary: { label, next: `vfocus:${cur}`, icon: "pointer" } };
      }
      const order = PARTS.map((p) => p.id); const ci = order.indexOf(cur);
      const nxId = [...order.slice(ci + 1), ...order.slice(0, ci)].find((id) => miss[id].length);
      const nx = PARTS.find((p) => p.id === nxId); const cp = PARTS.find((p) => p.id === cur);
      return { title: `${doneCount} of 12 items complete`, chips, instr: `Part ${cp.letter} complete. Next: Part ${nx.letter}, ${nx.label.toLowerCase()}.`, primary: { label: `Next: Part ${nx.letter}`, next: `vtab:${nx.id}`, icon: fwd } };
    }
    if (v === "objections") {
      const O = D.objections; const i = S.objections.current; const item = O.items[i];
      const resolvedN = O.items.filter((o) => objectionResolved(o.id)).length;
      if (resolvedN === O.items.length) return { title: "All four objections handled", done: true, instr: "The meeting is over. Your performance debrief is ready.", primary: { label: "See your debrief", go: "debrief", icon: fwd } };
      const att = S.objections.attempts[item.id] || [];
      const sp = person(item.speaker);
      if (objectionResolved(item.id)) {
        const j = O.items.findIndex((o, k) => k > i && !objectionResolved(o.id)); const jj = j >= 0 ? j : O.items.findIndex((o) => !objectionResolved(o.id));
        return { title: `${resolvedN} of 4 objections handled`, done: true, instr: `${item.category}: you kept ${objectionScore(item.id)} of 4 points. Next: ${O.items[jj].category.toLowerCase()}.`, primary: { label: `Next objection: ${O.items[jj].category}`, next: `obj:${jj}`, icon: fwd } };
      }
      if (S.objections.revising === item.id) return { title: `Objection ${i + 1} of 4: revising`, instr: "Choose a different response. The one you already used is locked.", primary: { label: "Choose a different response", next: "objfocus", icon: "pointer" } };
      if (att.length === 1) return {
        title: `Objection ${i + 1} of 4`, instr: `Your response was ${qLabelOf(item.options[att[0]].quality)}. You can revise it once, or keep it and move on.`,
        primary: { label: "Try a different response", action: "revise", icon: "revise" }, secondary: [{ label: "Keep this response", action: "keep" }]
      };
      return { title: `Objection ${i + 1} of 4`, instr: `${sp.name} raised ${item.category.toLowerCase()}. Choose your response from options A, B, and C.`, primary: { label: "Choose a response", next: "objfocus", icon: "pointer" } };
    }
    // debrief
    const logOpen = S.ui.logOpen;
    const sec = [{ label: logOpen ? "Hide decision log" : "Open decision log", next: "togglelog" }];
    if (!EMBEDDED) sec.push({ label: "Start over", action: "reset", icon: "restart" });
    return {
      title: "Debrief ready", done: true,
      instr: "Review your scores and feedback, and open the decision log to see where every point came from. Then save your report or start over.",
      secondary: sec,
      primary: EMBEDDED ? { label: "Start over", action: "reset", icon: "restart" } : { label: "Print or save as PDF", action: "print", icon: "print" }
    };
  }
  function btnAttrs(a) {
    if (a.go) return `data-go="${a.go}"`;
    if (a.action) return `data-action="${a.action}"`;
    return `data-next="${a.next}"`;
  }
  function nextBar() {
    const st = STAGES.find((x) => x.id === S.view);
    const ns = nextStep();
    const chips = (ns.chips || []).map((c) => `<li><button type="button" class="next-chip${c.done ? " is-done" : ""}" data-next="${c.next}">${c.done ? icon("check") : icon("pointer")}${esc(c.label)}</button></li>`).join("");
    const sec = (ns.secondary || []).map((a) => `<button type="button" class="btn btn-quiet" ${btnAttrs(a)}>${a.icon ? icon(a.icon) : ""}${esc(a.label)}</button>`).join("");
    const p = ns.primary;
    const trailing = p.icon === "arrowright";
    return `<footer class="stage-foot next-bar tone-${st.tone}${ns.done ? " is-ready" : ""}" aria-label="Next step">
      <div class="next-info">
        <span class="next-ico" aria-hidden="true">${icon(ns.done ? "checkcircle" : "flag")}</span>
        <div class="next-text">
          <p class="next-title"><span class="next-where">${esc(st.n ? `${st.label}, stage ${st.n} of 4` : st.label)}</span>${ns.done ? "Ready to continue" : "Next step"}<span class="next-status">${esc(ns.title)}</span></p>
          <p class="next-instr" id="next-instr">${esc(ns.instr)}</p>
          ${chips ? `<ul class="next-chips" aria-label="Remaining items">${chips}</ul>` : ""}
        </div>
      </div>
      <div class="next-actions">${sec}
        <button type="button" class="btn btn-primary btn-next" id="next-primary" ${btnAttrs(p)} aria-describedby="next-instr">${!trailing && p.icon ? icon(p.icon) : ""}<span>${esc(p.label)}</span>${trailing ? icon("arrowright") : ""}</button>
      </div>
    </footer>`;
  }
  function doNext(spec) {
    const [kind, a, b] = spec.split(":");
    const focusEl = (el) => { if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }); };
    if (kind === "focusq") { focusEl(document.querySelector(".qbtn:not(:disabled)")); return; }
    if (kind === "shtab" || kind === "shfocus") {
      S.ui.sh = a; render();
      if (kind === "shtab") { focusEl($(`#sh-tab-${a}`)); return; }
      const sel = b === "role" ? `input[data-role="${a}"]` : `input[data-msg="${a}"]`;
      focusEl($(sel)); return;
    }
    if (kind === "vtab" || kind === "vfocus") {
      S.ui.vtab = a; render();
      if (kind === "vtab") { focusEl($(`#vt-${a}`)); return; }
      const miss = valueMissing()[a];
      const sel = a === "match" ? `#m-${miss[0].id}` : a === "classify" ? `input[data-classify="${miss[0].id}"]` : `input[data-slot="${miss[0].id}"]`;
      focusEl($(sel)); return;
    }
    if (kind === "objfocus") { focusEl(document.querySelector(".decision:not(:disabled)")); return; }
    if (kind === "obj") { S.objections.current = +a; S.objections.revising = null; render({ focus: "#objection-card" }); announce(nextStep().instr); return; }
    if (kind === "togglelog") { const l = $("#log"); if (l) { l.open = !l.open; S.ui.logOpen = l.open; render({ focus: "#next-primary" }); if (l.open) focusEl($("#log summary")); } return; }
  }

  /* ------------------------------------------------------------------
     Shared view parts
     ------------------------------------------------------------------ */
  function stageHead(stage, title, lede, aside = "") {
    const st = STAGES.find((s) => s.id === stage);
    const comp = st.comp ? D.debrief.competencies[st.comp].label : null;
    const kicker = st.n ? `Stage ${st.n} of 4` : st.id === "debrief" ? "Performance debrief" : "Engagement brief";
    return `<header class="stage-head tone-${st.tone}">
      <div class="stage-tile">${icon(st.icon)}</div>
      <div class="stage-head-main">
        <p class="stage-kicker">${esc(kicker)}${comp ? `<span class="kicker-comp">Scored on ${esc(comp.toLowerCase())}</span>` : ""}</p>
        <h1 class="stage-title" tabindex="-1" id="stage-title">${esc(title)}</h1>
        ${lede ? `<p class="stage-lede">${esc(lede)}</p>` : ""}
      </div>
      ${aside ? `<div class="stage-head-aside">${aside}</div>` : ""}
    </header>`;
  }
  function stageFoot(note, action) {
    return `<footer class="stage-foot"><p class="foot-note">${note}</p><div class="foot-actions">${action}</div></footer>`;
  }
  function scoreBanner(comp, sc, text) {
    const p = pct(sc.points, sc.max);
    return `<div class="score-banner tone-${COMP_TONE[comp]}" role="status" tabindex="-1">
      ${ring(p, { size: 64, stroke: 7, tone: COMP_TONE[comp], label: `${p} percent` })}
      <div class="score-banner-num"><strong>${p}%</strong><span>${esc(D.debrief.competencies[comp].label)}</span></div>
      <p>${text}</p></div>`;
  }

  /* ------------------------------------------------------------------
     Brief — engagement dashboard
     ------------------------------------------------------------------ */
  function networkSVG() {
    const sys = D.scenario.systems;
    const W = 560, H = 330;
    const nodes = [
      { x: 3, y: 22, tone: "n1" }, { x: 363, y: 22, tone: "n2" },
      { x: 3, y: 250, tone: "n3" }, { x: 363, y: 250, tone: "n4" }
    ];
    const NW = 194, NH = 58;
    const recW = (id) => Math.round(String(id).length * 7.4 + 18); // pill width sized to the record ID
    const anchor = (i) => ({ x: nodes[i].x + NW / 2, y: nodes[i].y + NH / 2 });
    // Exactly as many hand-built interfaces as the scenario states, spread across the six system pairs.
    const total = +D.scenario.stats.find((s) => /interface/.test(s.label)).value || 23;
    const pairs = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];
    const per = pairs.map((_, k) => Math.floor(total / pairs.length) + (k < total % pairs.length ? 1 : 0));
    let wires = "";
    pairs.forEach(([a, b], k) => {
      const A = anchor(a), B = anchor(b);
      const n = per[k];
      for (let j = 0; j < n; j++) {
        const t = n === 1 ? 0 : (j / (n - 1) - 0.5);
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
        const nx = -dy / len, ny = dx / len;
        const bend = t * (k < 4 ? 70 : 46);
        const mx = (A.x + B.x) / 2 + nx * bend, my = (A.y + B.y) / 2 + ny * bend;
        wires += `<path class="wire" pathLength="1" style="--d:${(k * 0.08 + j * 0.04).toFixed(2)}s" d="M${A.x} ${A.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${B.x} ${B.y}"/>`;
      }
    });
    const cx = W / 2, cy = H / 2;
    const spokes = nodes.map((n, i) => {
      const A = anchor(i);
      return `<line class="spoke" x1="${A.x}" y1="${A.y}" x2="${cx}" y2="${cy}"/>`;
    }).join("");
    const nodeEls = sys.map((s, i) => {
      const n = nodes[i];
      return `<g class="net-node ${n.tone}" transform="translate(${n.x} ${n.y})">
        <rect class="node-card" width="${NW}" height="${NH}" rx="12"/>
        <rect class="node-tile" x="10" y="12" width="34" height="34" rx="9"/>
        <g transform="translate(17 19)"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="node-ico">${PATHS.db}</svg></g>
        <text class="node-label" x="54" y="27">${esc(s.label)}</text>
        <text class="node-sub" x="54" y="43">${esc(s.note)}</text>
        <g class="rec" transform="translate(${NW - recW(s.recordId) - 10} -11)"><rect class="rec-pill" width="${recW(s.recordId)}" height="22" rx="11"/><text class="rec-text" x="${recW(s.recordId) / 2}" y="15" text-anchor="middle">${esc(s.recordId)}</text></g>
      </g>`;
    }).join("");
    return `<svg class="net" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="net-t net-d">
      <title id="net-t">Halvorsen's fragmented customer data</title>
      <desc id="net-d">Four systems each hold their own record for the same hospital under a different customer ID (${sys.map((s) => `${esc(s.label)}: ${esc(s.recordId)}`).join(", ")}), connected by ${total} point-to-point interfaces.</desc>
      <g class="wires">${wires}</g>
      <g class="spokes">${spokes}</g>
      <g class="hub" transform="translate(${cx} ${cy})">
        <circle class="hub-ring" r="46"/>
        <circle class="hub-core" r="34"/>
        <g transform="translate(-10 -21)"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="hub-ico">${PATHS.building}</svg></g>
        <text class="hub-text" y="11" text-anchor="middle">1 hospital</text>
        <text class="hub-sub" y="25" text-anchor="middle">4 versions</text>
      </g>
      ${nodeEls}
    </svg>`;
  }

  function viewIntro() {
    const sc = D.scenario;
    const [challengeA, challengeB, challengeC] = [
      "Customer data lives in four systems that were never designed to talk to each other.",
      "The same hospital can appear under different names, IDs, and addresses in each one.",
      "A data-quality issue delayed a rebate payment to a key account."
    ];
    const divisions = (sc.profile.match(/(\w+) divisions/) || [, "three"])[1];
    const metrics = [...sc.stats, { value: divisions === "three" ? "3" : divisions, label: "divisions: Biologics, Diagnostics, and Hospital Solutions" }];
    const journey = STAGES.filter((s) => s.comp).map((s) => {
      const copy = {
        discovery: ["Customer discovery", "Choose 5 of 10 questions for the first call."],
        stakeholders: ["Stakeholder intelligence", "Identify each person's role and tailor your message."],
        value: ["Value proposition builder", "Match capabilities to needs and compose your pitch."],
        objections: ["Objection handling", "Respond to four objections, with one chance to revise each."]
      }[s.comp];
      return `<li class="journey-step tone-${s.tone}">
        <span class="journey-tile">${icon(s.icon)}</span>
        <span class="journey-num">Stage ${s.n}</span>
        <strong>${esc(copy[0])}</strong>
        <span class="journey-copy">${esc(copy[1])}</span>
        <span class="journey-comp">${esc(D.debrief.competencies[s.comp].label)}</span>
      </li>`;
    }).join("");

    return `
    <section class="brief" aria-labelledby="stage-title">
      <header class="brief-head">
        <div class="brief-account">
          <span class="account-tile">${icon("building")}</span>
          <div>
            <p class="brief-eyebrow">Engagement brief for ${esc(D.meta.title)}</p>
            <h1 id="stage-title" tabindex="-1">${esc(sc.customer)}</h1>
            <p class="brief-profile">${esc(sc.profile)}</p>
            <ul class="tag-row" aria-label="Opportunity">
              <li class="tag">${icon("calendar")}First discovery call</li>
              <li class="tag">${icon("user")}Requested by Halvorsen's IT team</li>
              <li class="tag tag-alert">${icon("alert")}Trigger: delayed rebate payment</li>
            </ul>
          </div>
        </div>
        <div class="brief-cta">
          <p class="brief-challenge-name">${esc(D.meta.subtitle)}</p>
          ${(() => { const ns = nextStep(); return `<button type="button" class="btn btn-primary btn-lg" data-go="${ns.primary.go}"><span>${esc(ns.primary.label)}</span>${icon("arrowright")}</button>`; })()}
          <button type="button" class="btn btn-quiet" data-action="open-rules">${icon("rules")}How scoring works</button>
        </div>
      </header>

      <div class="brief-grid">
        <figure class="card net-card">
          <figcaption class="card-head"><span class="card-title">Customer data landscape</span><span class="card-sub">${esc(sc.customer)} today: customer records in four systems, stitched together by hand-built interfaces.</span></figcaption>
          <div class="net-note">
            <p class="net-note-head">${icon("link")}<strong>${esc(sc.landscapeNote.headline)}</strong></p>
            <p class="net-note-body">${esc(sc.landscapeNote.body)}</p>
          </div>
          ${networkSVG()}
          <ul class="net-ids" aria-hidden="true">${sc.systems.map((s, i) => `<li class="n${i + 1}"><span class="net-ids-sys">${esc(s.label)}</span><span class="net-ids-id">${esc(s.recordId)}</span></li>`).join("")}</ul>
          <div class="net-legend" aria-hidden="true">
            <span><i class="lg-wire"></i>Point-to-point interface</span>
            <span><i class="lg-spoke"></i>Separate record for the same customer</span>
          </div>
        </figure>

        <section class="card challenges" aria-labelledby="ch-h">
          <h2 class="card-title" id="ch-h">Key business challenges</h2>
          <ol class="challenge-list">
            <li>${icon("db")}<span>${esc(challengeA)}</span></li>
            <li>${icon("link")}<span>${esc(challengeB)}</span></li>
            <li>${icon("alert")}<span>${esc(challengeC)}</span></li>
          </ol>
        </section>
      </div>

      <ul class="metrics" aria-label="Scenario metrics">
        ${metrics.map((m) => `<li class="metric"><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></li>`).join("")}
      </ul>

      <div class="role-grid">
        <section class="card role-card" aria-labelledby="role-h">
          <span class="role-tile">${icon("user")}</span>
          <div><h2 class="card-title" id="role-h">Your role</h2><p>${esc(sc.yourRole)}</p></div>
        </section>
        <section class="card role-card" aria-labelledby="mission-h">
          <span class="role-tile role-tile-alt">${icon("flag")}</span>
          <div><h2 class="card-title" id="mission-h">Your mission</h2><p>${esc(sc.goal)}</p></div>
        </section>
      </div>

      <section class="journey-wrap" aria-labelledby="path-h">
        <div class="section-head">
          <h2 class="section-title" id="path-h">Your learning journey</h2>
          <p class="section-help">Four stages, each scored on one competency. What you learn early becomes evidence you can use later.</p>
        </div>
        <ol class="journey">${journey}</ol>
      </section>

      <p class="disclaimer">${icon("info")}<span>${esc(D.meta.disclaimer)} All companies, people, and products are fictional.</span></p>
    </section>
    ${nextBar()}`;
  }

  /* ------------------------------------------------------------------
     Stage 1 — Discovery workspace
     ------------------------------------------------------------------ */
  function viewDiscovery() {
    const DS = D.discovery;
    const asked = S.discovery.asked;
    const left = DS.questionBudget - asked.length;
    const done = left <= 0;
    const order = DS.displayOrder || DS.questions.map((q) => q.id);
    const sc = scoreDiscovery();
    const t = trust();
    const found = insightsFound();

    const qButtons = order.map((id) => {
      const q = question(id);
      const isAsked = asked.includes(id);
      const disabled = isAsked || done;
      const n = asked.indexOf(id) + 1;
      return `<li><button type="button" class="qbtn${isAsked ? " is-asked" : ""}${!isAsked && done ? " is-unavailable" : ""}"
        id="q-${id}" data-ask="${id}" ${disabled ? "disabled" : ""}>
        <span class="qbtn-mark" aria-hidden="true">${isAsked ? n : icon("chat")}</span>
        <span class="qbtn-text">${esc(q.text)}${isAsked ? `<span class="qbtn-state">Asked as question ${n}</span>` : ""}</span></button></li>`;
    }).join("");

    const attendees = ["dana", "priya"].map(person);
    const turns = asked.map((id, n) => {
      const q = question(id);
      const sp = speakerOf(q.response);
      const who = sp.id ? person(sp.id) : null;
      const tr = q.trust > 0 ? `Trust +${q.trust}` : q.trust < 0 ? `Trust ${q.trust}` : "Trust unchanged";
      const ins = q.insight ? `<span class="chip chip-insight">${icon("spark")}${esc(DS.insights[q.insight].title)}</span>` : "";
      return `<li class="turn${S.newTurn === id ? " is-new" : ""}" id="turn-${id}">
        <div class="bubble bubble-you"><span class="bubble-who">You · Question ${n + 1}</span><p>${esc(q.text)}</p></div>
        <div class="bubble-row">
          ${who ? avatar(who, "av-sm") : ""}
          <div class="bubble bubble-them"><span class="bubble-who">${who ? esc(who.name) : "Customer"}</span><p>${esc(sp.body)}</p></div>
        </div>
        <div class="coach coach-${q.quality === "strong" ? "good" : q.quality === "weak" ? "mid" : "bad"}">
          <div class="coach-chips">${qualityChip(q.quality)}<span class="chip chip-plain">${esc(q.type)}</span><span class="chip chip-plain">${ptsLabel(q.points, 3)}</span><span class="chip chip-plain">${tr}</span>${ins}</div>
          <p>${esc(q.feedback)}</p>
        </div>
      </li>`;
    }).join("");

    const conversation = asked.length
      ? `<ol class="feed" aria-label="Conversation so far">${turns}</ol>`
      : `<div class="feed-empty">
          <div class="feed-empty-avatars">${attendees.map((p) => avatar(p)).join("")}</div>
          <p><strong>${attendees.map((p) => esc(p.name)).join(" and ")} have joined.</strong></p>
          <p>Choose your first question from the list. Their answers and your coaching notes will appear here.</p>
        </div>`;

    const summary = done ? scoreBanner("discovery", sc,
      `You earned ${ptsLabel(sc.points, sc.max)} and uncovered ${found.length} of 6 insights. ${found.length < 5 ? "Each weak or premature question cost you a chance to learn something you'll need later." : "Those insights are now in your Deal room and will be available as evidence in Stage 3."}`) : "";

    const strip = `<div class="kpi-strip" aria-label="Call status">
      <div class="kpi"><span class="kpi-label">Questions</span>
        <span class="kpi-dots" role="img" aria-label="${asked.length} of ${DS.questionBudget} questions asked">${Array.from({ length: DS.questionBudget }, (_, i) => `<i class="${i < asked.length ? "on" : ""}"></i>`).join("")}</span>
        <strong>${asked.length}/${DS.questionBudget}</strong></div>
      <div class="kpi"><span class="kpi-label">Customer trust</span><span class="kpi-bar"><i style="width:${t}%"></i></span><strong>${t}</strong></div>
      <div class="kpi"><span class="kpi-label">Insights</span><span class="kpi-dots kpi-dots-ins" role="img" aria-label="${found.length} of 6 insights uncovered">${Array.from({ length: 6 }, (_, i) => `<i class="${i < found.length ? "on" : ""}"></i>`).join("")}</span><strong>${found.length}/6</strong></div>
    </div>`;

    return `${stageHead("discovery", "Run the first discovery call", DS.intro)}
    <div class="stage-body">
      ${strip}
      <div class="disc-layout">
        <section class="panel qpanel" aria-labelledby="qs-h">
          <div class="panel-head">
            <h2 class="panel-title" id="qs-h">Question bank</h2>
            <span class="panel-meta" aria-live="polite">${done ? "Call time is up" : `${left} of ${DS.questionBudget} left`}</span>
          </div>
          <ul class="qlist">${qButtons}</ul>
        </section>
        <section class="panel convo" aria-labelledby="tr-h">
          <div class="panel-head">
            <h2 class="panel-title" id="tr-h">Customer conversation</h2>
            <span class="panel-attendees">${attendees.map((p) => avatar(p, "av-xs")).join("")}<span>${attendees.map((p) => esc(p.name.split(" ")[0])).join(" and ")}</span></span>
          </div>
          ${conversation}
          ${summary}
        </section>
      </div>
    </div>
    ${nextBar()}`;
  }

  /* ------------------------------------------------------------------
     Stage 2 — Buying committee workspace
     ------------------------------------------------------------------ */
  function shStatus(p) {
    const role = S.stakeholders.roles[p.id];
    const msg = S.stakeholders.messages[p.id];
    if (S.stakeholders.submitted) {
      const rOk = role === p.correctRole;
      const mp = p.messages[msg].points;
      return { cls: rOk && mp === 3 ? "good" : rOk || mp > 0 ? "mid" : "bad", text: `Role ${rOk ? "correct" : "missed"}, message ${mp} of 3` };
    }
    const n = (role ? 1 : 0) + (msg != null ? 1 : 0);
    return { cls: n === 2 ? "ready" : "todo", text: n === 2 ? "Ready" : `${n} of 2 answered` };
  }
  function viewStakeholders() {
    const SH = D.stakeholders;
    const sub = S.stakeholders.submitted;
    const found = insightsFound().includes("buyers");
    const sel = person(S.ui.sh) || SH.people[0];
    const note = found
      ? `<div class="intel-note found">${icon("spark")}<p><strong>From your discovery:</strong> ${esc(D.discovery.insights.buyers.detail)}</p></div>`
      : `<div class="intel-note missing">${icon("info")}<p><strong>Intel gap:</strong> you didn't ask how the decision gets made, so you'll need to read these profiles closely. In a real deal, this question is worth asking early.</p></div>`;

    const tabs = SH.people.map((p) => {
      const st = shStatus(p);
      const isSel = p.id === sel.id;
      const roleLbl = S.stakeholders.roles[p.id] ? SH.roles.find((r) => r.id === S.stakeholders.roles[p.id]).label : null;
      return `<button type="button" role="tab" class="sh-card${isSel ? " is-selected" : ""}" id="sh-tab-${p.id}" data-shtab="${p.id}"
          aria-selected="${isSel}" aria-controls="sh-panel" tabindex="${isSel ? 0 : -1}">
        ${avatar(p)}
        <span class="sh-card-main">
          <span class="sh-card-name">${esc(p.name)}</span>
          <span class="sh-card-title">${esc(p.title)}</span>
          <span class="sh-card-meta">
            <span class="meter" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<i class="${i < p.influence ? "on" : ""}"></i>`).join("")}</span>
            <span class="sr-only">Influence ${p.influence} of 5.</span>
            <span>${esc(p.stance)}</span>
          </span>
          <span class="sh-card-status st-${st.cls}">${st.cls === "good" ? icon("check") : st.cls === "bad" ? icon("cross") : st.cls === "mid" ? icon("half") : st.cls === "ready" ? icon("check") : ""}${esc(roleLbl && !sub ? `${roleLbl}, ${st.text}` : st.text)}</span>
        </span>
      </button>`;
    }).join("");

    // Detail panel for the selected stakeholder
    const p = sel;
    const role = S.stakeholders.roles[p.id];
    const msg = S.stakeholders.messages[p.id];
    const roleIcons = { decision: "target", influencer: "people", blocker: "shield" };
    const roleOpts = SH.roles.map((r) => {
      let cls = "";
      if (sub) cls = r.id === p.correctRole ? (role === r.id ? "is-correct" : "is-key") : role === r.id ? "is-wrong" : "";
      return `<label class="role-opt"><input type="radio" name="role-${p.id}" value="${r.id}" data-role="${p.id}" ${role === r.id ? "checked" : ""} ${sub ? "disabled" : ""}>
        <span class="role-card ${cls}">${icon(roleIcons[r.id])}<span class="role-name">${esc(r.label)}</span><span class="role-hint">${esc(r.hint)}</span>
        ${sub && r.id === p.correctRole ? `<span class="role-flag">${icon("check")}Best answer</span>` : ""}</span></label>`;
    }).join("");
    const best = Math.max(...p.messages.map((m) => m.points));
    const msgOpts = p.messages.map((m, i) => {
      let cls = "";
      if (sub) cls = m.points === best ? (msg === i ? "is-correct" : "is-key") : msg === i ? (m.points > 0 ? "is-partial" : "is-wrong") : "";
      return `<div class="opt"><label><input type="radio" name="msg-${p.id}" value="${i}" data-msg="${p.id}" ${msg === i ? "checked" : ""} ${sub ? "disabled" : ""}>
        <span class="opt-card ${cls}"><span class="radio" aria-hidden="true"></span><span class="opt-text">${esc(m.text)}${sub && m.points === best ? `<span class="opt-flag">${icon("check")}Best answer</span>` : ""}</span></span></label></div>`;
    }).join("");
    let fb = "";
    if (sub) {
      const rOk = role === p.correctRole;
      const m = p.messages[msg];
      fb = `<div class="sh-feedback">
        <section class="fb-card ${rOk ? "fb-card-good" : "fb-card-bad"}" aria-label="Role identification feedback">
          <h4>${icon("usercheck")}Role identification <span class="fb-pts">${rOk ? SH.rolePoints : 0} of ${SH.rolePoints} points</span></h4>
          <p>${esc(p.roleFeedback[role])}</p></section>
        <section class="fb-card fb-card-${levelFromPts(m.points, best)}" aria-label="Message feedback">
          <h4>${icon("chat")}Message fit <span class="fb-pts">${m.points} of 3 points</span></h4>
          <p>${esc(m.feedback)}</p></section>
      </div>`;
    }
    const idx = SH.people.findIndex((x) => x.id === p.id);
    const prev = SH.people[idx - 1], next = SH.people[idx + 1];

    const panel = `<div class="sh-detail" role="tabpanel" id="sh-panel" aria-labelledby="sh-tab-${p.id}">
      <header class="sh-detail-head">
        ${avatar(p, "av-lg")}
        <div><h2 class="sh-detail-name">${esc(p.name)}</h2><p class="sh-detail-title">${esc(p.title)}</p></div>
        <blockquote class="sh-quote">${esc(p.quote)}</blockquote>
      </header>
      <div class="sh-profile">
        <div class="sh-facts">
          <div><span class="fact-label">Influence</span><span class="meter meter-lg" role="img" aria-label="${p.influence} out of 5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < p.influence ? "on" : ""}"></i>`).join("")}</span><span class="fact-val">${p.influence} of 5</span></div>
          <div><span class="fact-label">Stance</span><span class="fact-val">${esc(p.stance)}</span></div>
        </div>
        <div class="sh-lists">
          <div class="sh-list sh-list-pri"><h3>${icon("target")}Priorities</h3><ul>${p.priorities.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
          <div class="sh-list sh-list-con"><h3>${icon("alert")}Concerns</h3><ul>${p.concerns.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        </div>
      </div>
      <div class="sh-tasks">
        <fieldset class="task"><legend><span class="task-num">1</span>What is ${esc(p.name.split(" ")[0])}'s role in the buying group?</legend><div class="role-opts">${roleOpts}</div></fieldset>
        <fieldset class="task"><legend><span class="task-num">2</span>Choose your opening message to ${esc(p.name.split(" ")[0])}</legend><div class="opts">${msgOpts}</div></fieldset>
        ${fb}
      </div>
      <div class="sh-pager">
        ${prev ? `<button type="button" class="btn btn-quiet" data-shgo="${prev.id}">${icon("arrowleft")}${esc(prev.name)}</button>` : "<span></span>"}
        <span class="sh-pager-status">${(() => { const m = shMissing(p); return sub ? "Answers locked" : m.length ? `${first(p)}: ${m.length === 2 ? "role and message" : m[0] === "role" ? "role" : "message"} still needed` : `${icon("check")}${first(p)} is ready`; })()}</span>
        ${next ? `<button type="button" class="btn btn-quiet" data-shgo="${next.id}">${esc(next.name)}${icon("arrowright")}</button>` : "<span></span>"}
      </div>
    </div>`;

    const answered = SH.people.filter((x) => S.stakeholders.roles[x.id] && S.stakeholders.messages[x.id] != null).length;
    const sc = scoreStakeholders();
    const summary = sub ? scoreBanner("stakeholders", sc, `${ptsLabel(sc.points, sc.max)}. Roles are worth ${SH.rolePoints} points each; messages earn 3 when tailored, 1 when true but aimed at the wrong person, and 0 when they work against you.`) : "";

    return `${stageHead("stakeholders", "Read the buying group", "Three people will shape this decision. For each one, identify their role and choose the opening message most likely to move them forward.")}
    <div class="stage-body">
      ${note}
      <div class="sh-layout">
        <div class="sh-tabs" role="tablist" aria-label="Buying committee" aria-orientation="vertical">${tabs}</div>
        ${panel}
      </div>
      ${summary}
    </div>
    ${nextBar()}`;
  }

  /* ------------------------------------------------------------------
     Stage 3 — Value strategy studio
     ------------------------------------------------------------------ */
  const SEG_META = {
    problem: { label: "Customer problem", tone: "problem" },
    solution: { label: "Proposed solution", tone: "solution" },
    evidence: { label: "Customer evidence", tone: "evidence" },
    outcome: { label: "Business outcome", tone: "outcome" }
  };
  function composeText() {
    return D.value.composer.slots.map((slot) => {
      const opt = slotOptions(slot).find((o) => o.id === S.value.composer[slot.id]);
      return { slot: slot.id, label: slot.label, text: opt ? opt.text : null };
    });
  }
  function previewHTML(parts, { placeholder = true } = {}) {
    return parts.map((p) => p.text
      ? `<mark class="seg seg-${SEG_META[p.slot].tone}"><span class="sr-only">${esc(SEG_META[p.slot].label)}: </span>${esc(p.text)}</mark>`
      : placeholder ? `<span class="seg-empty">[${esc(SEG_META[p.slot].label.toLowerCase())}]</span>` : "").join(" ");
  }
  function coachingModel() {
    // Built from the strongest building blocks. Instructional coaching only; it never changes the learner's answer or score.
    const c = D.value.composer;
    const notes = [];
    const parts = c.slots.map((slot) => {
      if (slot.dynamic) {
        const strong = evidenceOptions().filter((o) => o.points === 3);
        const pick = strong.find((o) => o.id === S.value.composer.evidence) || strong[0];
        if (pick) return { slot: slot.id, text: pick.text, id: pick.id };
        notes.push(`The evidence here comes from the "${D.discovery.insights.cost.title}" insight, which needs a discovery question you didn't ask.`);
        return { slot: slot.id, text: c.evidencePhrases.cost, id: "cost" };
      }
      const o = slot.options.reduce((a, b) => (b.points > a.points ? b : a));
      return { slot: slot.id, text: o.text, id: o.id };
    });
    return { parts, notes };
  }
  function viewValue() {
    const V = D.value;
    const sub = S.value.submitted;
    const tab = S.ui.vtab;
    const capName = (id) => V.capabilities.find((c) => c.id === id).name;
    const cnt = {
      match: V.requirements.filter((r) => S.value.matches[r.id]).length,
      classify: V.classify.items.filter((i) => S.value.classify[i.id]).length,
      compose: V.composer.slots.filter((s) => S.value.composer[s.id]).length
    };
    const tot = { match: V.requirements.length, classify: V.classify.items.length, compose: V.composer.slots.length };
    const sc = scoreValue();
    const partPts = { match: [sc.parts.match, 10], classify: [sc.parts.classify, 3], compose: [sc.parts.compose, 12] };
    const TABS = [
      { id: "match", letter: "A", label: "Match capabilities", icon: "link" },
      { id: "classify", letter: "B", label: "Feature, benefit, or outcome", icon: "gem" },
      { id: "compose", letter: "C", label: "Compose your proposition", icon: "chat" }
    ];
    const tabBar = `<div class="studio-tabs" role="tablist" aria-label="Value strategy studio">${TABS.map((t) => {
      const complete = cnt[t.id] === tot[t.id];
      const status = sub ? `${partPts[t.id][0]} of ${partPts[t.id][1]} points` : `${cnt[t.id]} of ${tot[t.id]} done`;
      return `<button type="button" role="tab" id="vt-${t.id}" data-vtab="${t.id}" aria-selected="${tab === t.id}" aria-controls="vt-panel" tabindex="${tab === t.id ? 0 : -1}"
        class="studio-tab${tab === t.id ? " is-selected" : ""}${complete ? " is-complete" : ""}">
        <span class="studio-letter">${complete ? icon("check") : t.letter}</span>
        <span class="studio-tab-text"><span class="studio-tab-label">${t.letter}. ${esc(t.label)}</span><span class="studio-tab-status">${status}</span></span></button>`;
    }).join("")}</div>`;

    let panel = "";
    if (tab === "match") {
      const used = {};
      Object.values(S.value.matches).forEach((c) => { used[c] = (used[c] || 0) + 1; });
      const caps = V.capabilities.map((c) => `<li class="cap${used[c.id] ? " is-used" : ""}">
        <span class="cap-name">${esc(c.name)}</span><span class="cap-detail">${esc(c.detail)}</span>
        ${used[c.id] ? `<span class="cap-used">${icon("link")}Matched ${used[c.id]}×</span>` : ""}</li>`).join("");
      const rows = V.requirements.map((r, i) => {
        const sel = S.value.matches[r.id] || "";
        let cls = "", fb = "";
        if (sub) {
          const ok = sel === r.answer;
          cls = ok ? "is-correct" : "is-wrong";
          fb = ok ? fbBox("good", `${capName(r.answer)} directly addresses this requirement.`, "Match.")
                  : fbBox("bad", `${V.matchFeedback[sel] || `${capName(sel)} doesn't directly solve this.`} The best match is ${capName(r.answer)}.`, "Not the best fit.");
        }
        return `<li class="req-row ${cls}">
          <span class="req-num" aria-hidden="true">R${i + 1}</span>
          <label class="req-text" for="m-${r.id}">${esc(r.text)}</label>
          <div class="select-wrap"><select id="m-${r.id}" data-match="${r.id}" ${sub ? "disabled" : ""}>
            <option value="">Choose a capability…</option>
            ${V.capabilities.map((c) => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
          </select></div>${fb ? `<div class="req-fb">${fb}</div>` : ""}</li>`;
      }).join("");
      panel = `<div class="studio-grid">
        <section class="studio-main" aria-labelledby="ma-h">
          <h2 class="panel-title" id="ma-h">Halvorsen's business requirements</h2>
          <p class="section-help">${esc(V.requirementsIntro)} Seven capabilities, five requirements. Two capabilities don't fit Halvorsen's needs.</p>
          <ol class="req-list">${rows}</ol>
        </section>
        <aside class="studio-side" aria-labelledby="cap-h">
          <h2 class="panel-title" id="cap-h">Capability library</h2>
          <ul class="cap-list">${caps}</ul>
        </aside>
      </div>`;
    } else if (tab === "classify") {
      const icons = { feature: "gem", benefit: "user", outcome: "trend" };
      const items = V.classify.items.map((it, i) => {
        const sel = S.value.classify[it.id];
        const opts = V.classify.options.map((o) => {
          let cls = "";
          if (sub) cls = o.id === it.answer ? (sel === o.id ? "is-correct" : "is-key") : sel === o.id ? "is-wrong" : "";
          return `<label class="cls-opt"><input type="radio" name="cl-${it.id}" value="${o.id}" data-classify="${it.id}" ${sel === o.id ? "checked" : ""} ${sub ? "disabled" : ""}>
            <span class="cls-card ${cls}">${icon(icons[o.id])}<span class="cls-name">${esc(o.label)}</span><span class="cls-hint">${esc(o.hint)}</span></span></label>`;
        }).join("");
        return `<fieldset class="cls-row"><legend class="cls-statement"><span class="cls-n">Statement ${i + 1}</span>“${esc(it.text)}”</legend>
          <div class="cls-opts">${opts}</div>
          ${sub ? fbBox(sel === it.answer ? "good" : "bad", it.feedback, sel === it.answer ? "Correct." : "Not quite.") : ""}</fieldset>`;
      }).join("");
      panel = `<section aria-labelledby="cl-h">
        <h2 class="panel-title" id="cl-h">Classify each statement</h2>
        <p class="section-help">Persuasive messages move from what the product does, to what that means for users, to what the business achieves.</p>
        <div class="fbo-ladder" aria-hidden="true"><span>${icon("gem")}Feature</span><i></i><span>${icon("user")}Benefit</span><i></i><span>${icon("trend")}Business outcome</span></div>
        <div class="cls-list">${items}</div>
      </section>`;
    } else {
      const slots = V.composer.slots.map((slot, si) => {
        const options = slotOptions(slot);
        const sel = S.value.composer[slot.id];
        const best = Math.max(...options.map((o) => o.points));
        const absoluteBest = slot.dynamic ? 3 : best;
        const tone = SEG_META[slot.id].tone;
        const list = options.map((o) => {
          let cls = "";
          if (sub) cls = o.points === absoluteBest ? (sel === o.id ? "is-correct" : "is-key") : sel === o.id ? (o.points > 0 ? "is-partial" : "is-wrong") : "";
          const tag = slot.dynamic ? `<span class="chip ${o.id === "generic" ? "chip-plain" : "chip-insight"}">${o.id === "generic" ? "" : icon("spark")}${esc(o.title)}</span>` : "";
          return `<div class="opt"><label><input type="radio" name="slot-${slot.id}" value="${o.id}" data-slot="${slot.id}" ${sel === o.id ? "checked" : ""} ${sub ? "disabled" : ""}>
            <span class="opt-card ${cls}"><span class="radio" aria-hidden="true"></span><span class="opt-text">${tag}${esc(o.text)}</span></span></label></div>`;
        }).join("");
        let fb = "";
        if (sub) {
          const opt = options.find((o) => o.id === sel);
          fb = fbBox(levelFromPts(opt.points, 3), opt.feedback, `${opt.points} of 3.`);
          if (slot.dynamic && best < 3) fb += fbBox("mid", "The strongest evidence (the customer's own duplicates, costs, or launch deadline) wasn't available because those insights weren't uncovered in discovery.", "Discovery link:");
        }
        return `<fieldset class="slot slot-${tone}"><legend><span class="slot-num">${si + 1}</span>${esc(SEG_META[slot.id].label)}</legend>
          <p class="slot-help">${esc(slot.prompt)}</p><div class="opts">${list}</div>${fb ? `<div class="slot-fb">${fb}</div>` : ""}</fieldset>`;
      }).join("");
      const parts = composeText();
      const filled = parts.filter((p) => p.text);
      const words = filled.map((p) => p.text).join(" ").split(/\s+/).filter(Boolean).length;
      const preview = filled.length ? previewHTML(parts) : `<span class="seg-empty">Choose a building block in each of the four parts to assemble your value proposition.</span>`;
      let coaching = "";
      if (sub) {
        const model = coachingModel();
        const diff = model.parts.filter((m) => m.id !== S.value.composer[m.slot]).length;
        coaching = `<section class="coaching" aria-labelledby="coach-h">
          <div class="coaching-head"><h3 id="coach-h">${icon("spark")}Coaching example</h3>
          <p>For comparison only. This is an instructional model built from the strongest building blocks. It isn't a validated customer claim, and it doesn't change your answer or your score.</p></div>
          <div class="coaching-grid">
            <div class="coaching-col"><h4>Your value proposition</h4><p class="preview-text preview-sm">${previewHTML(parts, { placeholder: false })}</p></div>
            <div class="coaching-col coaching-model"><h4>Coaching example ${diff ? `<span class="chip chip-plain">${diff} part${diff > 1 ? "s" : ""} differ${diff > 1 ? "" : "s"}</span>` : `<span class="chip chip-good">${icon("check")}Matches yours</span>`}</h4><p class="preview-text preview-sm">${previewHTML(model.parts, { placeholder: false })}</p>
            ${model.notes.map((n) => `<p class="coaching-note">${icon("info")}${esc(n)}</p>`).join("")}</div>
          </div></section>`;
      }
      panel = `<div class="compose-layout">
        <aside class="preview-card" aria-labelledby="pv-h">
          <div class="preview-head"><h2 id="pv-h">Your value proposition for Halvorsen</h2><span class="preview-count">${words} words${words ? (words <= 55 ? ", fits the 50-word format" : ", aim for about 50") : ""}</span></div>
          <p class="preview-text" aria-live="polite">${preview}</p>
          <ul class="seg-legend">${Object.entries(SEG_META).map(([k, m]) => `<li class="lg-${m.tone}${S.value.composer[k] ? " is-filled" : ""}">${S.value.composer[k] ? icon("check") : `<i></i>`}${esc(m.label)}</li>`).join("")}</ul>
        </aside>
        <section class="slots" aria-label="Building blocks"><p class="section-help">Pick one building block for each part. The customer-evidence options come from the insights you uncovered in discovery.</p>${slots}</section>
      </div>${coaching}`;
    }

    const idx = TABS.findIndex((t) => t.id === tab);
    const nextTab = TABS[idx + 1];
    const pager = nextTab ? `<div class="studio-pager"><button type="button" class="btn btn-secondary" data-vtabgo="${nextTab.id}">Next: ${nextTab.letter}. ${esc(nextTab.label)}${icon("arrowright")}</button></div>` : "";

    const done = cnt.match === tot.match && cnt.classify === tot.classify && cnt.compose === tot.compose;
    const remainingParts = TABS.filter((t) => cnt[t.id] < tot[t.id]).map((t) => `${t.letter} (${tot[t.id] - cnt[t.id]} left)`);

    return `${stageHead("value", "Connect capabilities to outcomes", "Translate what Aperion does into what Halvorsen needs. Match capabilities to requirements, separate features from outcomes, then compose a value proposition in the customer's terms.")}
    <div class="stage-body">
      ${tabBar}
      <div class="studio-panel" role="tabpanel" id="vt-panel" aria-labelledby="vt-${tab}">${panel}</div>
      ${sub ? scoreBanner("value", sc, `Matching ${sc.parts.match} of 10, classification ${sc.parts.classify} of 3, composition ${sc.parts.compose} of 12. Total ${ptsLabel(sc.points, sc.max)}. Open each part above to review its feedback.`) : ""}
    </div>
    ${nextBar()}`;
  }

  /* ------------------------------------------------------------------
     Stage 4 — Customer meeting simulator
     ------------------------------------------------------------------ */
  function viewObjections() {
    const O = D.objections;
    const idx = S.objections.current;
    const item = O.items[idx];
    const sp = person(item.speaker);
    const att = S.objections.attempts[item.id] || [];
    const resolved = objectionResolved(item.id);
    const canRevise = att.length === 1 && !resolved;
    const revising = S.objections.revising === item.id;
    const LETTERS = ["A", "B", "C"];
    const catIcon = ["db", "trend", "people", "link"];

    const agenda = O.items.map((o, i) => {
      const done = objectionResolved(o.id);
      const reachable = i === 0 || objectionResolved(O.items[i - 1].id);
      const s = done ? objectionScore(o.id) : null;
      return `<li><button type="button" class="agenda-item${i === idx ? " is-current" : ""}${done ? " is-done" : ""}" data-obj="${i}" ${i === idx ? 'aria-current="true"' : ""} ${reachable ? "" : "disabled"}>
        <span class="agenda-mark">${done ? icon("check") : reachable ? icon(catIcon[i]) : icon("lock")}</span>
        <span class="agenda-text"><span class="agenda-cat">${esc(o.category)}</span><span class="agenda-state">${done ? `${s} of ${O.scoring.first.strong} points` : i === idx ? "In discussion" : reachable ? "Up next" : "Locked"}</span></span></button></li>`;
    }).join("");

    const decisions = item.options.map((opt, i) => {
      const n = att.indexOf(i);
      const chosen = n !== -1;
      let cls = "";
      if (chosen) cls = opt.quality === "strong" ? "is-correct" : opt.quality === "partial" ? "is-partial" : "is-wrong";
      const disabled = resolved || chosen || (att.length === 1 && !revising);
      const tag = chosen ? `<span class="decision-tags">${qualityChip(opt.quality)}<span class="chip chip-plain">${n === 0 ? "Your first response" : "Your revised response"}</span></span>` : "";
      return `<li><button type="button" class="decision ${cls}" data-respond="${i}" ${disabled ? "disabled" : ""}>
        <span class="decision-letter" aria-hidden="true">${LETTERS[i]}</span>
        <span class="decision-body"><span class="sr-only">Response ${LETTERS[i]}: </span>${tag}<span class="decision-text">${esc(opt.text)}</span></span></button></li>`;
    }).join("");

    const timeline = att.map((i, n) => {
      const opt = item.options[i];
      const lvl = opt.quality === "strong" ? "good" : opt.quality === "partial" ? "mid" : "bad";
      const pts = (n === 0 ? O.scoring.first : O.scoring.revised)[opt.quality];
      const r = speakerOf(opt.reaction);
      return `${n === 1 ? `<li class="tl-divider"><span>${icon("revise")}Revision</span></li>` : ""}
        <li class="tl-item tl-you"><span class="tl-dot">${icon("user")}</span><div class="tl-card"><span class="tl-who">You (response ${LETTERS[i]})</span><p>${esc(opt.text)}</p></div></li>
        <li class="tl-item tl-them"><span class="tl-dot tl-dot-av">${avatar(sp, "av-xs")}</span><div class="tl-card"><span class="tl-who">${esc(sp.name)} reacts</span><p class="reaction">${esc(r.id ? r.body : opt.reaction)}</p></div></li>
        <li class="tl-item tl-coach tl-${lvl}"><span class="tl-dot">${icon(lvl === "good" ? "check" : lvl === "mid" ? "half" : "cross")}</span><div class="tl-card">
          <span class="tl-who">Coaching on your ${n === 0 ? "first" : "revised"} response ${qualityChip(opt.quality)}<span class="chip chip-plain">${pts} point${pts === 1 ? "" : "s"}</span></span>
          <p>${esc(opt.feedback)}</p></div></li>`;
    }).join("");

    let actions = "";
    if (canRevise && !revising) {
      actions = `<div class="tl-actions"><p class="tl-note tl-note-strong">${icon("revise")}You can revise this response once, or keep it. Use the buttons in the Next step bar.</p>
        <p class="tl-note">A strong revision earns ${O.scoring.revised.strong} of ${O.scoring.first.strong} points. Your objection score keeps whichever attempt scores higher.</p></div>`;
    } else if (revising) {
      actions = `<div class="tl-actions"><p class="tl-note tl-note-strong">${icon("revise")}Choose a different response above. The one you already used is locked.</p></div>`;
    } else if (resolved) {
      const sc1 = objectionScore(item.id);
      actions = `<div class="tl-actions tl-actions-row">
        <span class="retained">${icon("checkcircle")}Retained score: <strong>${ptsLabel(sc1, O.scoring.first.strong)}</strong>${att.length === 2 ? " (the higher of your two attempts)" : ""}</span></div>`;
    }

    const guideIcons = ["usercheck", "help", "chat", "checkcircle"];
    const guide = `<section class="guide" aria-labelledby="fw-h">
      <h2 class="guide-title" id="fw-h">Coaching guide</h2>
      <ol class="guide-steps">${O.framework.map((f, i) => `<li><span class="guide-ico">${icon(guideIcons[i])}</span><span><strong>${esc(f.step)}</strong><span>${esc(f.text)}</span></span></li>`).join("")}</ol>
      <p class="guide-rule">First response ${O.scoring.first.strong} / ${O.scoring.first.partial} / ${O.scoring.first.poor} points (effective / partly / ineffective). Revised response ${O.scoring.revised.strong} / ${O.scoring.revised.partial} / ${O.scoring.revised.poor}.</p>
    </section>`;

    const all = stageComplete("objections");
    const sc = scoreObjections();
    const attendees = ["dana", "priya", "marcus"].map(person);

    return `${stageHead("objections", "Handle the follow-up meeting", "Your proposal has landed and the buying group is pushing back. Respond to each objection. If a response misses, you get one chance to revise it.",
      `<span class="meeting-attendees" aria-label="In the room: ${attendees.map((p) => esc(p.name)).join(", ")}">${attendees.map((p) => avatar(p, "av-sm")).join("")}</span>`)}
    <div class="stage-body">
      <nav class="agenda" aria-label="Meeting agenda: objections"><ol>${agenda}</ol></nav>
      <div class="meeting">
        <section class="meeting-main" aria-labelledby="obj-h">
          <h2 class="sr-only" id="obj-h">Objection ${idx + 1} of ${O.items.length}: ${esc(item.category)}</h2>
          <div class="objection-card" tabindex="-1" id="objection-card">
            <div class="objection-who">${avatar(sp, "av-lg")}<div><strong>${esc(sp.name)}</strong><span>${esc(sp.title)}</span></div>
              <span class="chip chip-obj">${icon(catIcon[idx])}${esc(item.category)}</span></div>
            <blockquote class="objection-quote">“${esc(item.text)}”</blockquote>
          </div>
          <h3 class="decide-title">${att.length === 0 ? "Your move: choose how to respond" : revising ? "Your move: choose a different response" : "Your options"}</h3>
          <ol class="decisions">${decisions}</ol>
          ${att.length ? `<div aria-live="polite"><h3 class="decide-title">Conversation</h3><ol class="timeline">${timeline}</ol>${actions}</div>` : `<div aria-live="polite"></div>`}
        </section>
        <aside class="meeting-side">${guide}</aside>
      </div>
      ${all ? scoreBanner("objections", sc, `${ptsLabel(sc.points, sc.max)} across four objections. Your full debrief is ready.`) : ""}
    </div>
    ${nextBar()}`;
  }

  /* ------------------------------------------------------------------
     Debrief — learning analytics dashboard
     ------------------------------------------------------------------ */
  function decisionLog() {
    const rows = [];
    rows.push({ group: "Customer discovery" });
    S.discovery.asked.forEach((id, i) => {
      const q = question(id);
      rows.push({ what: `Question ${i + 1}: ${q.text}`, result: `${q.type}${q.insight ? `; uncovered "${D.discovery.insights[q.insight].title}"` : ""}`, pts: q.points, max: 3 });
    });
    rows.push({ group: "Stakeholder intelligence" });
    D.stakeholders.people.forEach((p) => {
      const r = S.stakeholders.roles[p.id];
      const rl = D.stakeholders.roles.find((x) => x.id === r);
      rows.push({ what: `${p.name}: role`, result: `Chose ${rl ? rl.label : "nothing"}${r === p.correctRole ? "" : `; best answer: ${D.stakeholders.roles.find((x) => x.id === p.correctRole).label}`}`, pts: r === p.correctRole ? 2 : 0, max: 2 });
      const m = p.messages[S.stakeholders.messages[p.id]];
      rows.push({ what: `${p.name}: message`, result: m ? `Message was ${m.fit}` : "No message", pts: m ? m.points : 0, max: 3 });
    });
    rows.push({ group: "Value proposition" });
    D.value.requirements.forEach((r) => {
      const sel = S.value.matches[r.id];
      const c = D.value.capabilities.find((x) => x.id === sel);
      rows.push({ what: r.text, result: `Matched to ${c ? c.name : "nothing"}`, pts: sel === r.answer ? 2 : 0, max: 2 });
    });
    D.value.classify.items.forEach((it) => {
      const sel = S.value.classify[it.id];
      const o = D.value.classify.options.find((x) => x.id === sel);
      rows.push({ what: `Classify: “${it.text}”`, result: `Labeled ${o ? o.label.toLowerCase() : "nothing"}`, pts: sel === it.answer ? 1 : 0, max: 1 });
    });
    D.value.composer.slots.forEach((slot) => {
      const opt = slotOptions(slot).find((o) => o.id === S.value.composer[slot.id]);
      rows.push({ what: `Value proposition: ${slot.label.toLowerCase()}`, result: opt ? opt.text : "Not chosen", pts: opt ? opt.points : 0, max: 3 });
    });
    rows.push({ group: "Objection handling" });
    const T = D.objections.scoring;
    const qLabel = (q) => (q === "strong" ? "Effective" : q === "partial" ? "Partly effective" : "Ineffective");
    D.objections.items.forEach((o) => {
      const att = S.objections.attempts[o.id] || [];
      const desc = att.map((i, n) => `${n === 0 ? "First" : "Revised"}: ${o.options[i].quality === "strong" ? "effective" : o.options[i].quality === "partial" ? "partly effective" : "ineffective"}`).join("; ");
      const sp = person(o.speaker);
      const attempts = att.map((i, n) => {
        const q = o.options[i].quality;
        return { kind: n === 0 ? "First response" : "Revised response", letter: "ABC"[i], quality: q, label: qLabel(q), pts: (n === 0 ? T.first : T.revised)[q], text: o.options[i].text };
      });
      rows.push({ what: o.category, result: desc, pts: objectionScore(o.id), max: 4, objection: { speaker: `${sp.name}, ${sp.title}`, attempts } });
    });
    return rows;
  }

  function objectionLogRow(r) {
    const o = r.objection;
    const lines = o.attempts.map((a) => `<li class="la-${a.quality}">${icon(a.quality === "strong" ? "check" : a.quality === "partial" ? "half" : "cross")}<span><strong>${esc(a.kind)} (${a.letter}):</strong> ${esc(a.label)}, ${a.pts} point${a.pts === 1 ? "" : "s"}</span></li>`).join("");
    const note = o.attempts.length === 1
      ? `<li class="la-none"><span>${o.attempts[0].quality === "strong" ? "No revision needed" : "No revision (first response kept)"}</span></li>` : "";
    const quotes = o.attempts.map((a) => `<p><strong>${esc(a.kind)} (${a.letter}):</strong> “${esc(a.text)}”</p>`).join("");
    return `<tr class="log-obj"><td>${esc(r.what)}<span class="log-sub">Raised by ${esc(o.speaker)}</span></td>
      <td><ul class="log-attempts">${lines}${note}</ul>
        <details class="log-resp"><summary>Show your response${o.attempts.length > 1 ? "s" : ""}</summary><div class="log-quotes">${quotes}</div></details></td>
      <td class="pts"><span class="pts-pill pts-${levelFromPts(r.pts, r.max)}">${r.pts} / ${r.max}</span><span class="log-retained">Retained${o.attempts.length > 1 ? ": higher attempt" : ""}</span></td></tr>`;
  }
  function objectionDebriefNote() {
    // Conditional, decision-specific development note (currently authored for the organizational-change objection only).
    return D.objections.items.filter((o) => o.debriefNote).map((o) => {
      const att = S.objections.attempts[o.id] || [];
      if (!att.length || o.options[att[0]].quality === "strong") return null; // never shown after a fully effective first response
      const n = o.debriefNote;
      const first = o.options[att[0]].quality === "partial" ? n.firstPartial : n.firstPoor;
      const recovered = att.length === 2 && o.options[att[1]].quality === "strong";
      return { lead: `${o.category}.`, text: `${first} ${recovered ? n.revisedStrong : n.notRecovered}`, id: o.id };
    }).filter(Boolean);
  }

  function viewDebrief() {
    const sc = allScores();
    const comps = D.debrief.competencies;
    const keys = ["discovery", "stakeholders", "value", "objections"];
    const pcts = Object.fromEntries(keys.map((k) => [k, pct(sc[k].points, sc[k].max)]));
    const overall = Math.round(keys.reduce((s, k) => s + pcts[k], 0) / keys.length);
    const thr = D.debrief.strengthThreshold;
    const bandOverall = band(overall);

    const strengths = keys.filter((k) => pcts[k] >= thr);
    const develop = keys.filter((k) => pcts[k] < thr).sort((a, b) => pcts[a] - pcts[b]);

    // Decision-specific development notes
    const specifics = [];
    const weakQs = S.discovery.asked.map(question).filter((q) => q.quality !== "strong");
    if (weakQs.length) specifics.push(`In discovery you asked ${weakQs.length} question${weakQs.length > 1 ? "s" : ""} that didn't uncover new information (${weakQs.map((q) => q.type.toLowerCase()).join(", ")}).`);
    const wrongRoles = D.stakeholders.people.filter((p) => S.stakeholders.roles[p.id] !== p.correctRole);
    if (wrongRoles.length) specifics.push(`You misread the role of ${wrongRoles.map((p) => p.name).join(" and ")}.`);
    const ev = slotOptions(D.value.composer.slots.find((s) => s.dynamic)).find((o) => o.id === S.value.composer.evidence);
    if (ev && ev.points < 3) specifics.push("Your value proposition lacked strong customer evidence, a direct effect of which insights you uncovered in discovery.");
    const missedObj = D.objections.items.filter((o) => (S.objections.attempts[o.id] || []).length && o.options[S.objections.attempts[o.id][0]].quality !== "strong");
    if (missedObj.length) specifics.push(`Your first response missed on ${missedObj.length} objection${missedObj.length > 1 ? "s" : ""}: ${missedObj.map((o) => o.category.toLowerCase()).join(", ")}.`);
    const objNotes = objectionDebriefNote();

    const next = develop.length ? develop.map((k) => comps[k].next)
      : ["Apply the same approach to a live opportunity: run discovery with five open questions, then build a stakeholder map before your next meeting.",
         "Coach a peer through this simulation and compare your reasoning on the trade-offs."];

    const compCards = keys.map((k) => `<li class="comp-card tone-${COMP_TONE[k]}">
      <div class="comp-card-top"><span class="comp-ico">${icon(COMP_ICON[k])}</span><span class="comp-band band-${band(pcts[k]).toLowerCase()}">${pcts[k] >= thr ? icon("star") : ""}${band(pcts[k])}</span></div>
      <div class="comp-card-score">${ring(pcts[k], { size: 76, stroke: 8, tone: COMP_TONE[k], label: `${comps[k].label}: ${pcts[k]} percent, ${band(pcts[k])}` })}<div><strong>${pcts[k]}%</strong><span>${sc[k].points} of ${sc[k].max} points</span></div></div>
      <h3>${esc(comps[k].label)}</h3>
      <div class="comp-bar" aria-hidden="true"><i style="width:${pcts[k]}%"></i><span class="tick" style="left:${thr}%"></span></div>
    </li>`).join("");

    const logRows = decisionLog();
    const nDecisions = logRows.filter((r) => !r.group).length;
    const log = logRows.map((r) => r.group
      ? `<tr class="group"><th colspan="3" scope="colgroup">${esc(r.group)}</th></tr>`
      : r.objection ? objectionLogRow(r)
      : `<tr><td>${esc(r.what)}</td><td>${esc(r.result)}</td><td class="pts"><span class="pts-pill pts-${levelFromPts(r.pts, r.max)}">${r.pts} / ${r.max}</span></td></tr>`).join("");
    const totals = keys.map((k) => `${comps[k].label} ${sc[k].points}/${sc[k].max}`).join(", ");

    return `${stageHead("debrief", "Your performance debrief", "Every score below comes directly from the decisions you made. Open the decision log to see exactly where each point came from.")}
    <div class="stage-body">
      <section class="db-hero" aria-label="Overall result">
        <div class="db-overall">
          ${ring(overall, { size: 168, stroke: 14, tone: "deb", label: `Overall score ${overall} out of 100` })}
          <div class="db-overall-num" aria-hidden="true"><strong>${overall}</strong><span>out of 100</span></div>
        </div>
        <div class="db-hero-text">
          <span class="comp-band band-${bandOverall.toLowerCase()} band-lg">${bandOverall}</span>
          <h2>Overall proficiency: ${esc(bandOverall)}</h2>
          <p>Your overall score is the average of the four competencies, equally weighted. Bands: Strong 85+, Proficient 65–84, Developing under 65. A competency at ${thr}% or above counts as a strength.</p>
          <div class="db-hero-stats">
            <span>${icon("chat")}${S.discovery.asked.length} questions asked</span>
            <span>${icon("spark")}${insightsFound().length} of 6 insights</span>
            <span>${icon("trend")}Final customer trust ${trust()}</span>
          </div>
        </div>
      </section>
      <ul class="comp-cards" aria-label="Competency scores">${compCards}</ul>
      <section class="db-feedback" aria-label="Feedback">
        <div class="db-panel db-strength"><h3>${icon("star")}Strengths</h3>${strengths.length ? `<ul>${strengths.map((k) => `<li><strong>${esc(comps[k].label)}.</strong> ${esc(comps[k].strength)}</li>`).join("")}</ul>` : `<p class="empty">No competency reached ${thr}% this time. Use the development areas to focus your next attempt.</p>`}</div>
        <div class="db-panel db-develop"><h3>${icon("target")}Development opportunities</h3>${develop.length || specifics.length || objNotes.length ? `<ul>${develop.map((k) => `<li><strong>${esc(comps[k].label)}.</strong> ${esc(comps[k].develop)}</li>`).join("")}${specifics.map((s) => `<li>${esc(s)}</li>`).join("")}${objNotes.map((n) => `<li class="db-note" data-note="${n.id}"><strong>${esc(n.lead)}</strong> ${esc(n.text)}</li>`).join("")}</ul>` : `<p class="empty">No gaps identified in this run.</p>`}</div>
        <div class="db-panel db-next"><h3>${icon("flag")}Recommended next steps</h3><ol>${next.map((n) => `<li>${esc(n)}</li>`).join("")}</ol></div>
      </section>
      <details class="log" id="log" ${S.ui.logOpen ? "open" : ""}>
        <summary><span class="log-sum-main">${icon("rules")}<span><strong>Decision and scoring log</strong><span class="log-sum-sub">${nDecisions} decisions. ${esc(totals)}</span></span></span><span class="log-open-label" aria-hidden="true"><span class="when-closed">Show details</span><span class="when-open">Hide details</span><span class="log-toggle"></span></span></summary>
        <div class="log-wrap"><table class="log-table">
          <caption class="sr-only">Every decision you made and the points it earned</caption>
          <thead><tr><th scope="col">Decision</th><th scope="col">What you chose</th><th scope="col">Points</th></tr></thead>
          <tbody>${log}</tbody></table></div>
      </details>
      <p class="disclaimer">${icon("info")}<span>${esc(D.meta.disclaimer)}</span></p>
    </div>
    ${nextBar()}`;
  }

  /* ------------------------------------------------------------------
     Deal room
     ------------------------------------------------------------------ */
  function renderDealroom() {
    const t = trust();
    const tl = t >= 70 ? "Engaged" : t >= 45 ? "Neutral" : "Guarded";
    const tcls = t >= 70 ? "good" : t >= 45 ? "neutral" : "low";
    const ins = insightsFound();
    const sc = allScores();
    const compStages = STAGES.filter((s) => s.comp && stageComplete(s.id));
    const allIns = Object.keys(D.discovery.insights);

    const gauge = `<svg class="gauge gauge-${tcls}" viewBox="0 0 120 68" aria-hidden="true">
      <path class="gauge-track" d="M10 60 A50 50 0 0 1 110 60" pathLength="100"/>
      <path class="gauge-val" d="M10 60 A50 50 0 0 1 110 60" pathLength="100" stroke-dasharray="${t} 100"/></svg>`;

    const insightsHTML = ins.length
      ? `<ul class="dr-insights">${ins.map((id) => `<li class="dr-insight${S.newInsight === id ? " is-new" : ""}">${icon("spark")}<span><strong>${esc(D.discovery.insights[id].title)}</strong><span class="dr-insight-detail">${esc(D.discovery.insights[id].detail)}</span></span></li>`).join("")}</ul>`
      : `<p class="dr-empty">Insights you uncover in discovery will collect here.</p>`;

    const buyers = D.stakeholders.people.map((p) => {
      const r = S.stakeholders.roles[p.id];
      const known = !!r && (S.stakeholders.submitted || S.view === "stakeholders");
      const lbl = r ? D.stakeholders.roles.find((x) => x.id === r).label : "Unknown";
      return `<li class="dr-buyer">${avatar(p, "av-sm")}<span><strong>${esc(p.name)}</strong><span>${esc(p.title)}</span></span>
        <span class="role-tag ${known ? `rt-${r}` : ""}">${known ? esc(lbl) : "Unknown"}</span></li>`;
    }).join("");

    const comps = STAGES.filter((s) => s.comp).map((s) => {
      const done = stageComplete(s.id);
      const c = sc[s.comp]; const p = pct(c.points, c.max);
      const state = done ? `${p}%` : S.view === s.id ? "In progress" : stageUnlocked(STAGES.indexOf(s)) ? "Open" : "Locked";
      return `<li class="dr-comp tone-${s.tone}${done ? " is-done" : ""}">
        <span class="dr-comp-ico">${icon(done ? s.icon : stageUnlocked(STAGES.indexOf(s)) ? s.icon : "lock")}</span>
        <span class="dr-comp-main"><span class="dr-comp-row"><span>${esc(D.debrief.competencies[s.comp].label)}</span><strong>${state}</strong></span>
        <span class="dr-comp-bar" aria-hidden="true"><i style="width:${done ? p : 0}%"></i></span></span></li>`;
    }).join("");

    const inner = `
      <div class="dr-head"><h2 class="dr-title">Deal room</h2><p class="dr-sub">${esc(D.scenario.customer)}: intelligence so far</p></div>
      <div class="dr-kpis">
        <div class="dr-kpi dr-trust" role="img" aria-label="Customer trust ${t} out of 100, ${tl}">${gauge}<div class="dr-trust-num"><strong>${t}</strong><span>${tl}</span></div><span class="dr-kpi-label">Customer trust</span></div>
        <div class="dr-kpi" role="img" aria-label="${ins.length} of 6 insights uncovered"><div class="dr-ins-grid">${allIns.map((id) => `<i class="${ins.includes(id) ? "on" : ""}"></i>`).join("")}</div><div class="dr-kpi-num"><strong>${ins.length}</strong><span>of 6</span></div><span class="dr-kpi-label">Insights</span></div>
        <div class="dr-kpi" role="img" aria-label="${compStages.length} of 4 competencies scored"><div class="dr-stage-dots">${STAGES.filter((s) => s.comp).map((s) => `<i class="tone-${s.tone}${stageComplete(s.id) ? " on" : ""}"></i>`).join("")}</div><div class="dr-kpi-num"><strong>${compStages.length}</strong><span>of 4</span></div><span class="dr-kpi-label">Scored</span></div>
      </div>
      <section class="dr-block"><h3>Discovery insights</h3>${insightsHTML}</section>
      <section class="dr-block"><h3>Buying group</h3><ul class="dr-buyers">${buyers}</ul></section>
      <section class="dr-block"><h3>Competencies</h3><ul class="dr-comps">${comps}</ul></section>`;

    $("#dealroom").innerHTML = `
      <button type="button" class="dr-toggle" aria-expanded="${S.drOpen}" aria-controls="dr-inner" data-action="toggle-dr">
        <span class="dr-toggle-main"><span class="dr-toggle-title">Deal room</span>
        <span class="dr-toggle-sum"><span>${icon("trend")}Trust ${t}</span><span>${icon("spark")}${ins.length}/6 insights</span><span>${icon("chart")}${compStages.length}/4 scored</span></span></span>
        <span class="chev" aria-hidden="true"></span></button>
      <div class="dr-inner" id="dr-inner">${inner}</div>`;
    const narrow = matchMedia("(max-width: 1180px)").matches;
    $("#dr-inner").hidden = narrow && !S.drOpen;
  }

  /* ---------- Rules dialog ---------- */
  function renderRules() {
    const O = D.objections.scoring;
    const row = (k, text, max) => `<tr class="tone-${COMP_TONE[k]}"><th scope="row"><span class="rules-comp">${icon(COMP_ICON[k])}${esc(D.debrief.competencies[k].label)}</span></th><td>${text}</td><td>${max}</td></tr>`;
    $("#rules-body").innerHTML = `
      <h2 id="dlg-rules-title">How scoring works</h2>
      <p>Every point comes from a decision you make. There is no randomness and no hidden data, so the same choices always produce the same score. Each competency is shown as a percentage of its maximum, and your overall score is the average of the four.</p>
      <div class="rules-table-wrap"><table class="rules-table"><thead><tr><th scope="col">Competency</th><th scope="col">How points are earned</th><th scope="col">Max</th></tr></thead><tbody>
        ${row("discovery", "Each of your 5 questions: 3 if it uncovers a key insight, 1 for a closed question, 0 for pitching, early pricing, or an early demo.", D.discovery.maxPoints)}
        ${row("stakeholders", `${D.stakeholders.rolePoints} per correctly identified role. Messages: 3 tailored, 1 true but aimed at the wrong audience or generic, 0 counterproductive.`, D.stakeholders.maxPoints)}
        ${row("value", `${D.value.matchPoints} per correct capability match, ${D.value.classifyPoints} per correct classification, and 0 to 3 for each of four value-proposition building blocks. Evidence options depend on what you uncovered in discovery.`, D.value.maxPoints)}
        ${row("objections", `First response: ${O.first.strong} effective, ${O.first.partial} partly effective, ${O.first.poor} ineffective. One revision allowed: ${O.revised.strong} / ${O.revised.partial} / ${O.revised.poor}. The higher attempt counts.`, D.objections.maxPoints)}
      </tbody></table></div>
      <h3>Bands</h3>
      <p>Strong 85 and above, Proficient 65 to 84, and Developing below 65.</p>
      <h3>Customer trust</h3>
      <p>The trust meter in the Deal room shows how the customer reacts to your choices. It starts at ${D.discovery.trustStart}, rises with good questions and effective responses, and falls with pitching or poor responses. It's feedback only and isn't part of your score.</p>
      <h3>What this is not</h3>
      <p>${esc(D.meta.disclaimer)}</p>`;
  }

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */
  function render(opts = {}) {
    const active = document.activeElement;
    const activeId = active && active.id;
    const activeKey = active && active !== document.body && active.dataset && Object.keys(active.dataset).length ? JSON.stringify(active.dataset) : null;
    const logEl = $("#log");
    if (logEl) S.ui.logOpen = logEl.open;

    const views = { intro: viewIntro, discovery: viewDiscovery, stakeholders: viewStakeholders, value: viewValue, objections: viewObjections, debrief: viewDebrief };
    const st = STAGES.find((s) => s.id === S.view);
    const main = $("#main");
    main.dataset.tone = st.tone;
    main.innerHTML = views[S.view]();
    document.body.dataset.tone = st.tone;
    renderStepper();
    renderDealroom();
    document.title = `${st.label} · Sales Intelligence Lab`;

    if (opts.focus) {
      // A comma-separated list is treated as a priority order (first match wins), not document order.
      const el = typeof opts.focus === "string" ? opts.focus.split(/,(?![^\[]*\])/).map((x) => $(x.trim())).find(Boolean) : opts.focus;
      if (el) el.focus({ preventScroll: !!opts.preventScroll });
    } else if (opts.focusHeading) {
      const h = $("#stage-title");
      if (h) h.focus({ preventScroll: true });
    } else if (activeId && document.getElementById(activeId)) {
      document.getElementById(activeId).focus({ preventScroll: true });
    } else if (activeKey) {
      // Restore focus to the element with the same data attributes (e.g. a radio)
      const all = document.querySelectorAll("button, input, select");
      for (const el of all) {
        if (JSON.stringify(el.dataset) === activeKey && (!(el instanceof HTMLInputElement) || el.checked || el.type !== "radio")) {
          if (!el.disabled) { el.focus({ preventScroll: true }); break; }
        }
      }
    }
  }

  /* ------------------------------------------------------------------
     Actions
     ------------------------------------------------------------------ */
  function ask(id) {
    if (S.discovery.asked.includes(id) || S.discovery.asked.length >= D.discovery.questionBudget) return;
    S.discovery.asked.push(id);
    const q = question(id);
    S.newTurn = id;
    S.newInsight = q.insight;
    const left = D.discovery.questionBudget - S.discovery.asked.length;
    // Move focus to the next available question, or to the continue button when done.
    let focusSel = null;
    if (left > 0) {
      const order = D.discovery.displayOrder;
      const start = order.indexOf(id);
      for (let k = 1; k <= order.length; k++) {
        const cand = order[(start + k) % order.length];
        if (!S.discovery.asked.includes(cand)) { focusSel = `#q-${cand}`; break; }
      }
    }
    render({ focus: focusSel || "#next-primary", preventScroll: true });
    const turn = document.getElementById(`turn-${id}`);
    if (turn) turn.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
    announce(`${q.response} Feedback: ${q.feedback}${q.insight ? ` Insight added to the Deal room: ${D.discovery.insights[q.insight].title}.` : ""} ${left > 0 ? `${left} questions left.` : "Discovery complete."} Next step: ${nextStep().instr}`);
  }

  function respond(i) {
    const item = D.objections.items[S.objections.current];
    const att = S.objections.attempts[item.id] || (S.objections.attempts[item.id] = []);
    if (objectionResolved(item.id) || att.includes(i)) return;
    if (att.length === 1 && S.objections.revising !== item.id) return;
    att.push(i);
    S.objections.revising = null;
    render({ focus: "#next-primary", preventScroll: true });
    const items = document.querySelectorAll(".timeline .tl-item");
    const lastItem = items[items.length - 1];
    if (lastItem) lastItem.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
    const opt = item.options[i];
    announce(`${opt.reaction} ${opt.feedback} Next step: ${nextStep().instr}`);
  }

  /* Locked stages explain why, and offer the way forward. */
  function lockedNotice(idx) {
    const target = resumeTarget();
    const ts = STAGES.find((x) => x.id === target);
    const st = STAGES[idx];
    const prev = STAGES.slice(1, idx).find((x) => !stageComplete(x.id));
    const msg = `${st.label} unlocks after you complete ${prev ? prev.label : "the earlier stages"}. Your current stage is ${ts.label}.`;
    const el = $("#toast");
    el.innerHTML = `<div class="toast-body tone-${ts.tone}">${icon("lock")}<p>${esc(msg)}</p>
      <button type="button" class="btn btn-primary btn-sm" data-toastgo="${target}"><span>Go to ${esc(ts.label)}</span>${icon("arrowright")}</button>
      <button type="button" class="toast-close" data-toastclose aria-label="Dismiss">${icon("cross")}</button></div>`;
    el.hidden = false;
    announce(msg);
    const b = el.querySelector("[data-toastgo]"); if (b) b.focus();
  }
  function hideToast() { const el = $("#toast"); if (el && !el.hidden) { el.hidden = true; el.innerHTML = ""; } }

  function focusScore() {
    const s = $(".score-banner");
    if (s) { s.focus({ preventScroll: false }); }
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-go]");
    if (!t) return;
    if (t.dataset.go) {
      const idx = STAGES.findIndex((s) => s.id === t.dataset.go);
      if (t.getAttribute("aria-disabled") === "true" || t.disabled || !stageUnlocked(idx)) { lockedNotice(idx); return; }
      hideToast();
      go(t.dataset.go);
      return;
    }
    if (t.dataset.next) { hideToast(); doNext(t.dataset.next); return; }
    if (t.dataset.toastgo) { const v = t.dataset.toastgo; hideToast(); go(v); return; }
    if (t.dataset.toastclose != null) { hideToast(); return; }
    if (t.dataset.ask) return ask(t.dataset.ask);
    if (t.dataset.respond != null && !t.disabled) return respond(+t.dataset.respond);
    if (t.dataset.shtab) { S.ui.sh = t.dataset.shtab; render({ focus: `#sh-tab-${t.dataset.shtab}` }); return; }
    if (t.dataset.shgo) {
      S.ui.sh = t.dataset.shgo; render({ focus: `#sh-tab-${t.dataset.shgo}` });
      const panel = $("#sh-panel"); if (panel && matchMedia("(max-width: 960px)").matches) panel.scrollIntoView({ block: "start" });
      return;
    }
    if (t.dataset.vtab) { S.ui.vtab = t.dataset.vtab; render({ focus: `#vt-${t.dataset.vtab}` }); return; }
    if (t.dataset.vtabgo) { S.ui.vtab = t.dataset.vtabgo; render({ focus: `#vt-${t.dataset.vtabgo}` }); $(".studio-tabs").scrollIntoView({ block: "start", behavior: reduceMotion() ? "auto" : "smooth" }); return; }
    if (t.dataset.obj != null && !t.disabled) {
      S.objections.current = +t.dataset.obj;
      S.objections.revising = null;
      render({ focus: "#objection-card" });
      return;
    }
    switch (t.dataset.action) {
      case "submit-stakeholders":
        if (D.stakeholders.people.some((p) => shMissing(p).length)) return;
        S.stakeholders.submitted = true;
        render();
        focusScore();
        announce(`Stakeholder plan submitted. Score ${pct(scoreStakeholders().points, scoreStakeholders().max)} percent. Select each stakeholder to review role and message feedback.`);
        break;
      case "submit-value":
        { const m = valueMissing(); if (m.match.length || m.classify.length || m.compose.length) return; }
        S.value.submitted = true;
        render();
        focusScore();
        announce(`Value proposition submitted. Score ${pct(scoreValue().points, scoreValue().max)} percent. Open each part to review its feedback and the coaching example.`);
        break;
      case "revise": {
        const item = D.objections.items[S.objections.current];
        S.objections.revising = item.id;
        render();
        const first = document.querySelector(".decision:not(:disabled)");
        if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }); }
        announce("Choose a different response.");
        break;
      }
      case "keep": {
        const item = D.objections.items[S.objections.current];
        S.objections.kept = S.objections.kept || {};
        S.objections.kept[item.id] = true;
        S.objections.revising = null;
        render({ focus: "#next-primary" });
        announce(`Response kept. ${nextStep().instr}`);
        break;
      }
      case "toggle-dr":
        S.drOpen = !S.drOpen;
        renderDealroom();
        $(".dr-toggle").focus();
        break;
      case "open-rules": openDialog("#dlg-rules"); break;
      case "reset": openDialog("#dlg-reset"); break;
      case "print": window.print(); break;
    }
  });

  // Arrow-key navigation for the stakeholder and studio tab lists (WAI-ARIA tabs pattern, automatic activation).
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideToast(); });
  document.addEventListener("keydown", (e) => {
    const tabEl = e.target.closest && e.target.closest('[role="tab"]');
    if (!tabEl) return;
    const list = [...tabEl.parentElement.querySelectorAll('[role="tab"]')];
    const i = list.indexOf(tabEl);
    let j = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % list.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + list.length) % list.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = list.length - 1;
    if (j === null) return;
    e.preventDefault();
    list[j].click();
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.role) S.stakeholders.roles[t.dataset.role] = t.value;
    else if (t.dataset.msg) S.stakeholders.messages[t.dataset.msg] = +t.value;
    else if (t.dataset.match) S.value.matches[t.dataset.match] = t.value || undefined;
    else if (t.dataset.classify) S.value.classify[t.dataset.classify] = t.value;
    else if (t.dataset.slot) S.value.composer[t.dataset.slot] = t.value;
    else return;
    if (t.dataset.match && !t.value) delete S.value.matches[t.dataset.match];
    render();
    // Confirm the selection and say what comes next (screen readers hear it; the Next-step bar shows it).
    announce(`Saved. Next step: ${nextStep().instr}`);
  });

  document.addEventListener("toggle", (e) => { if (e.target.id === "log") S.ui.logOpen = e.target.open; }, true);

  /* ---------- Dialogs ---------- */
  let lastFocus = null;
  function openDialog(sel) {
    const d = $(sel);
    lastFocus = document.activeElement;
    if (sel === "#dlg-rules") renderRules();
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
    const btn = d.querySelector("[data-close]");
    if (btn) btn.focus();
  }
  function closeDialog(d) {
    if (typeof d.close === "function") d.close(); else d.removeAttribute("open");
  }
  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === d) closeDialog(d);
    });
    d.addEventListener("close", () => { if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); });
  });
  $("#btn-rules").addEventListener("click", () => openDialog("#dlg-rules"));
  $("#btn-reset").addEventListener("click", () => openDialog("#dlg-reset"));
  $("#btn-reset-confirm").addEventListener("click", () => {
    closeDialog($("#dlg-reset"));
    S = freshState();
    lastFocus = null;
    go("intro");
    announce("Simulation reset. You're back at the brief.");
  });

  // When printing the debrief, expand the decision log and every response so the printout is complete.
  window.addEventListener("beforeprint", () => { document.querySelectorAll("#log, .log-resp").forEach((d) => { d.open = true; }); });

  // Re-evaluate deal room collapse on resize
  let rz;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(renderDealroom, 120); });

  render();
})();
