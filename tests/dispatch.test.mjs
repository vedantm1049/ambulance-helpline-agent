// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { triage, findNearestHelp, normaliseCity, matchEmergencyType, SCENARIO_AREAS, AREAS } from "../js/dispatch.js";

const call = (area, type, awake = "yes", breathing = "yes") => {
  const a = AREAS.find((x) => x.name === area);
  return findNearestHelp({ city: a.city, emergency_type: type, patient_awake: awake, patient_breathing_normally: breathing }, { locationText: a.name });
};

test("not breathing is critical and needs ACLS", () => {
  assert.deepEqual(triage({ emergency_type: "Suspected fracture", patient_awake: "yes", patient_breathing_normally: "no" }), { type: "Suspected fracture", priority: "critical", required: "ACLS" });
});

test("not awake is critical", () => {
  assert.equal(triage({ emergency_type: "Abdominal pain", patient_awake: "no", patient_breathing_normally: "yes" }).priority, "critical");
});

test("stroke, logged as confusion, is urgent", () => {
  assert.equal(triage({ emergency_type: "Confusion or delirium", patient_awake: "yes", patient_breathing_normally: "yes" }).priority, "urgent");
});

test("unknown answers on a non-urgent type make it urgent", () => {
  assert.equal(triage({ emergency_type: "Abdominal pain", patient_awake: "unknown", patient_breathing_normally: "yes" }).priority, "urgent");
});

test("stable transfer gets patient transport", () => {
  const t = triage({ emergency_type: "Transfer from hospital, stable patient", patient_awake: "yes", patient_breathing_normally: "yes" });
  assert.equal(t.priority, "non_urgent");
  assert.equal(t.required, "PTA");
});

test("city names are normalised", () => {
  assert.equal(normaliseCity("Bengaluru"), "Bangalore");
  assert.equal(normaliseCity("gurgaon"), "Gurugram");
  assert.equal(normaliseCity("New Delhi"), "Delhi");
  assert.equal(normaliseCity("Mumbai"), "Other");
});

test("loose emergency type text maps to the list", () => {
  assert.equal(matchEmergencyType("chest pain"), "Chest pain");
  assert.equal(matchEmergencyType("something odd"), "Miscellaneous");
});

test("outside the service area returns an error", () => {
  const r = findNearestHelp({ city: "Mumbai", emergency_type: "Chest pain", patient_awake: "yes", patient_breathing_normally: "yes" });
  assert.equal(r.error, "outside_service_area");
});

test("self-transport rule fires only in the scenario area", () => {
  for (const a of AREAS) {
    const r = call(a.name, "Chest pain");
    assert.equal(r.advise_self_transport, a.name === SCENARIO_AREAS.selfTransport, a.name);
  }
  // Manesar's nearest ACLS is over 20 minutes away, so it is not offered at all on an urgent call.
  const r = call(SCENARIO_AREAS.selfTransport, "Road accident");
  assert.equal(r.ambulance, null);
  assert.equal(r.no_ambulance_in_time, true);
});

test("urgent and critical calls never offer an ambulance slower than 20 minutes", () => {
  for (const a of AREAS) for (const e of ["Chest pain", "Unconscious or unresponsive", "Road accident"]) {
    const r = call(a.name, e);
    if (r.ambulance) assert.ok(r.ambulance.eta_minutes <= 20, a.name);
    assert.ok(r._operators.every((o) => o.eta_minutes <= 20), a.name);
  }
});

test("each operator carries an exact fare inside the quoted range", () => {
  const r = call("Sector 47", "Chest pain");
  for (const o of r._operators) {
    const [lo, hi] = o.fare_range_inr.split(" to ").map(Number);
    assert.equal(o.fare_inr, (lo + hi) / 2);
  }
});

test("self-transport is never advised for non-urgent calls or transfers", () => {
  assert.equal(call(SCENARIO_AREAS.selfTransport, "Suspected fracture").advise_self_transport, false);
  assert.equal(call(SCENARIO_AREAS.selfTransport, "Transfer from hospital, unstable patient").advise_self_transport, false);
});

test("BLS fallback fires only in the scenario area for urgent calls", () => {
  for (const a of AREAS) {
    const r = call(a.name, "Chest pain");
    assert.equal(r.fallback_used, a.name === SCENARIO_AREAS.fallback, a.name);
  }
  const r = call(SCENARIO_AREAS.fallback, "Chest pain");
  assert.equal(r.required_ambulance_type, "ACLS");
  assert.equal(r.ambulance_type, "BLS");
});

test("operators are ranked by arrival time and capped at three", () => {
  const r = call("Indiranagar", "Chest pain");
  assert.ok(r._operators.length <= 3);
  for (let i = 1; i < r._operators.length; i++) assert.ok(r._operators[i].eta_minutes >= r._operators[i - 1].eta_minutes);
});

test("agent never sees page-only fields", async () => {
  const { forAgent } = await import("../js/dispatch.js");
  const out = forAgent(call("Saket", "Chest pain"));
  assert.ok(!Object.keys(out).some((k) => k.startsWith("_")));
});

test("chest pain goes to a cardiac-capable hospital", () => {
  const r = call("Sohna Road", "Chest pain");
  assert.notEqual(r.hospital.name, "Sohna Road Trauma Hospital");
});

test("transfer fare grows with distance to the destination", async () => {
  const { findNearestHelp } = await import("../js/dispatch.js");
  const base = { city: "Delhi", emergency_type: "Transfer from hospital, stable patient", patient_awake: "yes", patient_breathing_normally: "yes" };
  const near = findNearestHelp({ ...base, destination: "Hospital in Saket, Delhi" }, { locationText: "Lajpat Nagar" });
  const far = findNearestHelp({ ...base, destination: "Hospital in Sector 47, Gurugram" }, { locationText: "Lajpat Nagar" });
  const low = (r) => Number(r.ambulance.fare_range_inr.split(" ")[0]);
  assert.ok(low(far) > low(near), `${low(far)} should exceed ${low(near)}`);
  assert.equal(far.hospital.name, "Hospital in Sector 47, Gurugram");
  assert.ok(far.trip_km > near.trip_km);
  assert.equal(far.advise_self_transport, false);
});

test("transfer without a destination says so", async () => {
  const { findNearestHelp } = await import("../js/dispatch.js");
  const r = findNearestHelp({ city: "Delhi", emergency_type: "Transfer from hospital, stable patient", patient_awake: "yes", patient_breathing_normally: "yes" }, { locationText: "Saket" });
  assert.equal(r.destination_needed, true);
});

test("operator language follows the city", async () => {
  const { operatorLanguageFor } = await import("../js/lines.js");
  assert.equal(operatorLanguageFor("Delhi"), "Hindi");
  assert.equal(operatorLanguageFor("Gurugram"), "Hindi");
  assert.equal(operatorLanguageFor("Bangalore"), "English");
});

test("Gurugram transfer has three operators to call, BLS as fallback", () => {
  const r = findNearestHelp({ city: "Gurugram", emergency_type: "Transfer from hospital, stable patient", patient_awake: "Yes", patient_breathing_normally: "Yes", destination: "Artemis Hospital, Gurugram" }, { locationText: "CK Birla Hospital, Gurugram" });
  assert.equal(r._operators.length, 3);
  assert.deepEqual(r._operators.map((o) => o.type), ["PTA", "PTA", "BLS"]);
  assert.ok(r._operators[2].fallback);
});

test("Transfer between two city-centre estimates does not price a 0 km trip", () => {
  const r = findNearestHelp({ city: "Gurugram", emergency_type: "Transfer from hospital, stable patient", patient_awake: "Yes", patient_breathing_normally: "Yes", destination: "Artemis Hospital, Gurugram" }, { locationText: "CK Birla Hospital, Gurugram" });
  assert.equal(r.trip_km, 8);
  assert.equal(r.trip_km_estimated, true);
  assert.ok(r.hospital.travel_minutes > 0);
});

test("Delhi to Gurugram transfer is in scope and priced on the real distance", () => {
  const r = findNearestHelp({ city: "Delhi", emergency_type: "Transfer from hospital, stable patient", patient_awake: "Yes", patient_breathing_normally: "Yes", destination: "Bhatia Hospital, Gurugram" }, { locationText: "Indraprastha Apollo Hospital, Delhi" });
  assert.equal(r.error, undefined);
  assert.ok(r.trip_km > 8, `trip_km ${r.trip_km}`);
});

test("Delhi to Bangalore transfer is refused as inter-city", () => {
  const r = findNearestHelp({ city: "Delhi", emergency_type: "Transfer from hospital, stable patient", patient_awake: "Yes", patient_breathing_normally: "Yes", destination: "Manipal Hospital, Bangalore" }, { locationText: "Saket, Delhi" });
  assert.equal(r.error, "inter_city_transfer");
});
