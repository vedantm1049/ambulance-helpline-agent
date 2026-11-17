import { AGENT_ID, DEMO_CALLER_NUMBER, MAX_OPERATOR_ATTEMPTS } from "./config.js?v=8";
import { AREAS, SCENARIO_AREAS, findNearestHelp, forAgent, normaliseCity, matchEmergencyType } from "./dispatch.js?v=8";
import { LANG_CODE, intakeOpening, operatorOpening, operatorLanguageFor, callbackOpening } from "./lines.js?v=8";
import { MockConversation } from "./mock.js?v=8";

const MOCK = new URLSearchParams(location.search).has("mock");
const $ = (id) => document.getElementById(id);
const DRIVERS = ["Ramesh", "Suresh", "Imran", "Manjunath", "Harpreet", "Vinod"];
const TYPE_NAME = { ACLS: "ACLS (advanced life support)", BLS: "BLS (basic life support)", PTA: "PTA (patient transport)" };

const state = {
  stage: "IDLE",            // IDLE, INTAKE, OPERATOR, CALLBACK, DONE
  card: {},
  callerLines: [],
  sharedPosition: null,
  help: null,
  booking: null,
  handoff: null,
  attempts: [],
  report: null,
  confirmed: null,
  conversation: null,
  t0: null,
  tBooked: null,
  tConfirmed: null,
};

// ---------- small helpers ----------

const secs = (t) => Math.round((t - state.t0) / 1000);
const fmtSecs = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Language the caller is actually speaking, read from the script of their last three intake messages.
// Speech recognition writes Hindi in Devanagari, so this does not depend on the agent remembering to update the card.
function scriptOf(text) {
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  return /[a-z]{2}/i.test(text) ? "English" : null;
}
function callerLang() {
  const recent = state.callerLines.map(scriptOf).filter(Boolean).slice(-3);
  if (recent.length) {
    const count = {};
    for (const l of recent) count[l] = (count[l] ?? 0) + 1;
    const top = Math.max(...Object.values(count));
    // Majority wins; on a tie, the most recent language wins.
    return [...recent].reverse().find((l) => count[l] === top);
  }
  return ["Hindi", "English"].includes(state.card.language) ? state.card.language : "English";
}

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const k of kids.flat()) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return n;
}

function logTool(name, params, result) {
  const body = el("pre", {}, `params: ${JSON.stringify(params ?? {}, null, 2)}\nreturned: ${typeof result === "string" ? result : JSON.stringify(result, null, 2)}`);
  const item = el("details", { class: "tool" }, el("summary", {}, `${stageLabel()} · ${name}`), body);
  $("toolLog").prepend(item);
}

function stageLabel() {
  return { INTAKE: "Intake", OPERATOR: "Operator", CALLBACK: "Callback" }[state.stage] ?? state.stage;
}

function addTranscript(role, text) {
  const who = role === "agent" ? "Agent" : state.stage === "OPERATOR" ? "Operator" : "Caller";
  const clean = String(text).replace(/\[[^\]]{1,40}\]\s*/g, "").trim();
  if (!clean) return;
  if (role !== "agent" && state.stage === "INTAKE") state.callerLines.push(clean);
  $("transcript").append(el("div", { class: `line ${role}` }, el("span", { class: "who" }, `${stageLabel()} · ${who}`), el("p", {}, clean)));
  $("transcript").scrollTop = $("transcript").scrollHeight;
}

function setStatus(text, kind = "") {
  $("status").textContent = text;
  $("status").className = `status ${kind}`;
}

function setStepper() {
  const order = ["INTAKE", "OPERATOR", "CALLBACK"];
  const idx = order.indexOf(state.stage);
  document.querySelectorAll(".step").forEach((s, i) => {
    s.classList.toggle("active", i === idx);
    s.classList.toggle("done", state.stage === "DONE" ? true : i < idx);
  });
}

function setAction(label, handler, kind = "primary") {
  const b = $("action");
  b.textContent = label;
  b.className = `btn ${kind}`;
  b.disabled = !handler;
  b.onclick = handler;
}

// ---------- dispatch card ----------

const CARD_FIELDS = [
  ["priority", "Priority"], ["language", "Language"], ["phone", "Phone (caller ID)"],
  ["location_text", "Location"], ["landmark", "Landmark"], ["city", "City"], ["destination", "Destination (transfers)"],
  ["emergency_type", "Emergency type"], ["what_happened", "What happened"],
  ["patient_awake", "Awake"], ["patient_breathing_normally", "Breathing normally"],
  ["other_ambulance_called", "Other ambulance called"], ["patient_name", "Patient name"],
  ["patient_age", "Patient age"], ["patient_gender", "Gender"], ["caller_name", "Caller name"],
];

function renderCard(changed = []) {
  const grid = $("card");
  grid.innerHTML = "";
  for (const [key, label] of CARD_FIELDS) {
    const v = state.card[key];
    const cell = el("div", { class: `field${v ? "" : " empty"}${changed.includes(key) ? " flash" : ""}${key === "priority" && v ? ` p-${v}` : ""}` },
      el("label", {}, label), el("span", {}, v ? String(v).replace("_", " ") : "–"));
    grid.append(cell);
  }
}

function renderHelp() {
  const h = state.help;
  const box = $("help");
  if (!h || h.error) { box.innerHTML = `<p class="muted">${h?.message ?? "Appears once location and emergency are known."}</p>`; return; }
  const rows = [
    ["Ambulance needed", TYPE_NAME[h.required_ambulance_type]],
    ["Ambulance offered", `${TYPE_NAME[h.ambulance_type]}${h.fallback_used ? " (fallback, right type not nearby)" : ""}`],
    ["Nearest operator", h.ambulance ? `${h.ambulance.provider}, about ${h.ambulance.eta_minutes} min` : "none"],
    ["Fare range", h.ambulance ? `INR ${h.ambulance.fare_range_inr}` : "–"],
    [h._destination || h.destination_needed !== undefined ? "Destination" : "Nearest suitable hospital",
      h.hospital ? `${h.hospital.name}${h.hospital.travel_minutes != null ? `, ${h.hospital.travel_minutes} min by road` : ""}${h._destination?.estimated ? " (estimated from city centre)" : ""}` : (h.destination_needed ? "not given yet" : "none")],
    ["Position used", `${h._position?.area ?? "?"} (${h._position?.source ?? "?"})`],
  ];
  box.innerHTML = "";
  if (h.advise_self_transport) box.append(el("div", { class: "flag" }, "Hospital is 5+ minutes closer than the ambulance. Agent should suggest a cab or own vehicle."));
  for (const [k, v] of rows) box.append(el("div", { class: "kv" }, el("label", {}, k), el("span", {}, v)));
}

function renderAttempts() {
  const list = $("attempts");
  list.innerHTML = "";
  if (!state.attempts.length) { list.append(el("p", { class: "muted" }, "Starts after the caller says yes to an ambulance.")); return; }
  for (const a of state.attempts) {
    list.append(el("div", { class: `attempt ${a.status}` },
      el("strong", {}, `${a.provider} · ${a.id}`),
      el("span", {}, ` ${a.type}, about ${a.eta_minutes} min · `),
      el("em", {}, a.status === "calling" ? "calling…" : a.status), a.note ? el("p", {}, a.note) : ""));
  }
}

function addWhatsApp(to, text) {
  $("whatsapp").querySelector(".muted")?.remove();
  $("whatsapp").append(el("div", { class: "wa" }, el("span", { class: "who" }, `To ${to} · simulated`), el("p", {}, text)));
}

function renderMetrics() {
  const m = [];
  if (state.tBooked) m.push(`Booked ${fmtSecs(secs(state.tBooked))} after the call started`);
  if (state.tConfirmed) m.push(`Ambulance confirmed at ${fmtSecs(secs(state.tConfirmed))}`);
  if (state.attempts.length) m.push(`${state.attempts.length} operator call${state.attempts.length > 1 ? "s" : ""}`);
  $("metrics").textContent = m.join(" · ");
}

// ---------- client tools (the agent calls these) ----------

function locationText() {
  return [state.card.location_text, state.card.landmark, state.card.city].filter(Boolean).join(", ");
}

const tools = {
  updateDispatchCard: (p) => {
    if (state.stage === "OPERATOR") {
      // The operator is not the caller. Nothing they say belongs on the caller's card.
      logTool("updateDispatchCard", p, "ignored on the operator call");
      return "ignored";
    }
    const changed = [];
    for (const [k, v] of Object.entries(p ?? {})) {
      if (v === undefined || v === null || v === "") continue;
      if (k === "city") state.card.city = normaliseCity(v) ?? v;
      else if (k === "emergency_type") state.card.emergency_type = matchEmergencyType(v);
      else state.card[k] = v;
      changed.push(k);
    }
    renderCard(changed);
    logTool("updateDispatchCard", p, "ok");
    return "ok";
  },

  findNearestHelp: (p) => {
    const full = findNearestHelp(p, { sharedPosition: state.sharedPosition, locationText: locationText() });
    state.help = full;
    if (full.priority) state.card.priority = full.priority;
    renderCard(["priority"]);
    renderHelp();
    const out = full.error ? { error: full.error, message: full.message } : forAgent(full);
    logTool("findNearestHelp", p, out);
    return JSON.stringify(out);
  },

  bookAmbulance: (p) => {
    const choice = String(p?.choice ?? "").toLowerCase().includes("own") ? "own_vehicle" : "ambulance";
    state.booking = { choice };
    state.tBooked = Date.now();
    renderMetrics();
    logTool("bookAmbulance", p, "Booking recorded.");
    return "Booking recorded.";
  },

  reportOperatorResponse: (p) => {
    const r = String(p?.response ?? "unclear").toLowerCase();
    state.report = { response: ["confirmed", "declined"].includes(r) ? r : "unclear", eta_minutes: Number(p?.eta_minutes) || null, note: p?.note ?? "" };
    logTool("reportOperatorResponse", p, "Recorded.");
    return "Recorded.";
  },

  handOffToDispatcher: (p) => {
    state.handoff = { summary: p?.summary ?? "", outcome: p?.outcome ?? "" };
    const b = $("handoff");
    b.hidden = false;
    b.innerHTML = "";
    b.append(el("strong", {}, `Handed to a human dispatcher: ${state.handoff.outcome}`), el("p", {}, state.handoff.summary));
    logTool("handOffToDispatcher", p, "Handed off.");
    return "Handed off.";
  },
};

// ---------- sessions ----------

async function startSession(args) {
  const { stage, firstLine, lang, extra = {} } = args;
  state.stage = stage;
  setStepper();
  state.report = null;
  const dynamicVariables = {
    opening_line: firstLine,
    call_stage: stage,
    caller_number: DEMO_CALLER_NUMBER,
    caller_language: callerLang(),
    case_summary: "none yet",
    operator_name: "none",
    booking_result: "none yet",
    ...extra,
  };
  setStatus("Connecting…", "busy");
  setAction("Hang up", hangUp, "danger");

  const callbacks = {
    onConnect: () => { if (!state.t0) state.t0 = Date.now(); setStatus("Connected. Speak when the agent finishes.", "live"); },
    onDisconnect: (d) => { state.conversation = null; onCallEnded(stage, d); },
    onError: (msg) => { addTranscript("agent", `[error] ${msg}`); },
    onMessage: (m) => addTranscript(m.role === "agent" || m.source === "ai" ? "agent" : "user", m.message),
    onModeChange: ({ mode }) => setStatus(mode === "speaking" ? "Agent speaking…" : "Listening…", "live"),
  };
  const base = { agentId: AGENT_ID, connectionType: "webrtc", dynamicVariables, clientTools: tools, stripAudioTags: true, ...callbacks };

  try {
    if (MOCK) { state.conversation = await MockConversation.startSession(base, stage); return; }
    const C = window.ElevenLabsClient.Conversation;
    const code = LANG_CODE[lang] ?? "en";
    try {
      state.conversation = await C.startSession(code === "en" ? base : { ...base, overrides: { agent: { language: code } } });
    } catch (e) {
      if (code === "en") throw e;
      // Language override may be switched off in the dashboard. Retry without it.
      state.conversation = await C.startSession(base);
    }
  } catch (e) {
    setStatus(`Could not connect: ${e?.message ?? e}. Check microphone permission.`, "error");
    setAction("Try again", () => startSession(args));
  }
}

async function hangUp() {
  try { await state.conversation?.endSession(); } catch { /* already closed */ }
}

function startIntake() {
  resetCase();
  state.card.phone = DEMO_CALLER_NUMBER;
  renderCard(["phone"]);
  startSession({ stage: "INTAKE", firstLine: intakeOpening(), lang: "English" });
}

function onCallEnded(stage, details) {
  setStatus(details?.reason === "error" ? `Call dropped: ${details.message}` : "Call ended.", details?.reason === "error" ? "error" : "");
  if (stage === "INTAKE") return afterIntake();
  if (stage === "OPERATOR") return afterLiveOperatorCall();
  if (stage === "CALLBACK") return finish();
}

function afterIntake() {
  // Freeze the caller's language now, so nothing on the operator call can change it.
  state.callerLanguage = callerLang();
  if (state.handoff) return finish("Case is with a human dispatcher.");
  if (!state.booking) return finish("Call ended before a decision. A real helpline would call back.");
  if (state.booking.choice === "own_vehicle") {
    const h = state.help?.hospital;
    return finish(`Caller is going by own vehicle${h ? ` to ${h.name}, about ${h.travel_minutes} min` : ""}. No ambulance booked.`);
  }
  state.stage = "OPERATOR";
  setStepper();
  nextOperator();
}

// ---------- operator stage ----------

function operators() { return state.help?._operators ?? []; }

function caseFacts() {
  const c = state.card;
  const loc = c.location_text ?? "";
  const has = (x) => x && loc.toLowerCase().includes(String(x).toLowerCase());
  const place = [loc, has(c.landmark) ? "" : c.landmark ? `near ${c.landmark}` : "", has(c.city) ? "" : c.city].filter(Boolean).join(", ") || state.help?._position?.area || "the caller's location";
  return {
    type: state.help?.ambulance_type ?? "ACLS",
    emergency: (c.emergency_type ?? "medical emergency").toLowerCase(),
    place,
    urgent: state.help?.priority !== "non_urgent",
    destination: c.destination && String(state.help?._emergency_type ?? "").startsWith("Transfer") ? c.destination : null,
  };
}

function caseSummary() {
  const c = state.card, f = caseFacts();
  return `${c.emergency_type ?? "Medical emergency"}, ${state.help?.priority ?? "unknown priority"}. ${f.type} ambulance needed. Pickup: ${f.place}.${f.destination ? ` Destination: ${f.destination}.` : ""} Patient awake: ${c.patient_awake ?? "unknown"}. Breathing normally: ${c.patient_breathing_normally ?? "unknown"}. Other ambulance already called: ${c.other_ambulance_called ?? "unknown"}.`;
}

function nextOperator() {
  const i = state.attempts.length;
  const op = operators()[i];
  if (!op || i >= MAX_OPERATOR_ATTEMPTS) return goToCallback(false);
  const attempt = { ...op, status: "calling", note: "" };
  state.attempts.push(attempt);
  renderAttempts();
  renderMetrics();
  if ($("opMode").value === "live") {
    setStatus(`Your turn: you are now ${op.provider}, the ambulance operator.`, "busy");
    setAction(`Pick up as ${op.provider}`, () => {
      const choice = $("opLang").value;
      const lang = choice === "auto" ? operatorLanguageFor(state.help?._position?.city ?? state.card.city) : choice;
      startSession({
        stage: "OPERATOR", lang,
        firstLine: operatorOpening(lang, caseFacts()),
        extra: { case_summary: caseSummary(), operator_name: op.provider },
      });
    });
  } else {
    simulateOperator(attempt, i);
  }
}

async function simulateOperator(attempt, i) {
  setAction("Confirming with operators…", null, "ghost");
  setStatus(`Calling ${attempt.provider}…`, "busy");
  await wait(1800);
  const plan = $("opSim").value;
  const confirm = plan === "all_confirm" || (plan === "first_fails" && i > 0);
  if (confirm) {
    attempt.status = "confirmed";
    attempt.note = `Simulated: "Yes, leaving now, ${attempt.eta_minutes} minutes."`;
    renderAttempts();
    return confirmAmbulance(attempt, attempt.eta_minutes);
  }
  attempt.status = i === 0 && plan === "first_fails" ? "no answer" : "declined";
  attempt.note = attempt.status === "no answer" ? "Simulated: did not pick up after 30 seconds." : "Simulated: no vehicle free.";
  renderAttempts();
  await wait(700);
  nextOperator();
}

function afterLiveOperatorCall() {
  const attempt = state.attempts[state.attempts.length - 1];
  const r = state.report ?? { response: "unclear" };
  attempt.status = r.response;
  attempt.note = r.note || (r.response === "unclear" ? "Call ended without a clear answer." : "");
  renderAttempts();
  if (r.response === "confirmed") return confirmAmbulance(attempt, r.eta_minutes ?? attempt.eta_minutes);
  state.stage = "OPERATOR";
  nextOperator();
}

function confirmAmbulance(op, eta) {
  state.confirmed = { ...op, eta_minutes: eta, driver: DRIVERS[Math.floor(Math.random() * DRIVERS.length)], vehicle: `DEMO ${1000 + Math.floor(Math.random() * 9000)}` };
  state.tConfirmed = Date.now();
  renderMetrics();
  const c = state.card;
  addWhatsApp(op.provider, `New pickup. ${caseSummary()} Caller: ${DEMO_CALLER_NUMBER}.`);
  addWhatsApp("caller", `Ambulance confirmed: ${op.provider}, ${op.type}. Vehicle ${state.confirmed.vehicle}, driver ${state.confirmed.driver}. Arriving in about ${eta} minutes. Fare range INR ${op.fare_range_inr}, paid to the operator after the trip.`);
  goToCallback(true);
}

// ---------- callback stage ----------

function goToCallback(confirmed) {
  const lang = state.callerLanguage ?? callerLang();
  state.card.language = lang;
  renderCard(["language"]);
  state.stage = "CALLBACK";
  setStepper();
  const h = state.help?.hospital;
  const result = confirmed
    ? `Ambulance confirmed. Operator: ${state.confirmed.provider}. Type: ${state.confirmed.type}. Arriving in about ${state.confirmed.eta_minutes} minutes. Vehicle and driver details sent on WhatsApp.`
    : `No ambulance could be confirmed after ${state.attempts.length} operator calls. Nearest suitable hospital: ${h ? `${h.name}, about ${h.travel_minutes} minutes by road` : "unknown"}.`;
  setStatus("Incoming callback for the caller.", "ring");
  setAction("Answer the callback as the caller", () =>
    startSession({
      stage: "CALLBACK", lang,
      firstLine: callbackOpening(lang, confirmed, state.confirmed?.eta_minutes),
      extra: { case_summary: caseSummary(), booking_result: result },
    }), "ring");
}

function finish(note) {
  state.stage = "DONE";
  setStepper();
  setStatus(note ?? "Case closed.", "");
  setAction("Start a new call", startIntake);
}

function resetCase() {
  Object.assign(state, { stage: "IDLE", card: {}, callerLines: [], callerLanguage: null, sharedPosition: null, help: null, booking: null, handoff: null, attempts: [], report: null, confirmed: null, t0: null, tBooked: null, tConfirmed: null });
  $("transcript").innerHTML = "";
  $("toolLog").innerHTML = "";
  $("whatsapp").innerHTML = '<p class="muted">Messages to the operator and the caller appear here.</p>';
  $("handoff").hidden = true;
  renderCard(); renderHelp(); renderAttempts(); renderMetrics();
}

// ---------- boot ----------

function boot() {
  const byCity = {};
  for (const a of AREAS) (byCity[a.city] ??= []).push(a.name);
  $("areaList").textContent = Object.entries(byCity).map(([c, xs]) => `${c}: ${xs.join(", ")}`).join(". ") + ".";
  $("scenarioSelf").textContent = SCENARIO_AREAS.selfTransport;
  $("scenarioFallback").textContent = SCENARIO_AREAS.fallback;
  if (MOCK) $("mockBanner").hidden = false;
  resetCase();
  setStepper();
  setAction("Start the call as the caller", startIntake);
}

boot();
