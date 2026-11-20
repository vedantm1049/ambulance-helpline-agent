// Dispatch logic for the demo. Pure functions, no browser APIs, so it can be tested in Node.
// Every place name below is a real area. Every hospital, ambulance operator, driver,
// vehicle, time and fare is invented demo data.

export const SERVICE_CITIES = ["Gurugram", "Delhi", "Noida", "Bangalore"];

export const AREAS = [
  // Gurugram
  { name: "Sector 47", city: "Gurugram", lat: 28.4300, lng: 77.0560 },
  { name: "DLF Phase 3", city: "Gurugram", lat: 28.4930, lng: 77.0930 },
  { name: "Golf Course Road", city: "Gurugram", lat: 28.4580, lng: 77.0980 },
  { name: "Sohna Road", city: "Gurugram", lat: 28.4100, lng: 77.0420 },
  { name: "Manesar", city: "Gurugram", lat: 28.3540, lng: 76.9370 },
  // Delhi
  { name: "Saket", city: "Delhi", lat: 28.5245, lng: 77.2066 },
  { name: "Lajpat Nagar", city: "Delhi", lat: 28.5677, lng: 77.2433 },
  { name: "Karol Bagh", city: "Delhi", lat: 28.6519, lng: 77.1909 },
  { name: "Dwarka", city: "Delhi", lat: 28.5921, lng: 77.0460 },
  // Noida
  { name: "Sector 18", city: "Noida", lat: 28.5708, lng: 77.3261 },
  { name: "Sector 62", city: "Noida", lat: 28.6270, lng: 77.3650 },
  // Bangalore
  { name: "Indiranagar", city: "Bangalore", lat: 12.9784, lng: 77.6408 },
  { name: "Koramangala", city: "Bangalore", lat: 12.9352, lng: 77.6245 },
  { name: "Jayanagar", city: "Bangalore", lat: 12.9250, lng: 77.5938 },
  { name: "Whitefield", city: "Bangalore", lat: 12.9698, lng: 77.7500 },
  { name: "Yelahanka", city: "Bangalore", lat: 13.1007, lng: 77.5963 },
];

// Areas that show a specific behaviour. Listed in the README.
export const SCENARIO_AREAS = {
  selfTransport: "Manesar",   // hospital far closer than any advanced ambulance
  fallback: "Yelahanka",      // no advanced ambulance nearby, basic one offered
};

export const HOSPITALS = [
  { name: "Cyber City Heart and Trauma Centre", city: "Gurugram", lat: 28.4950, lng: 77.0890, caps: ["cardiac", "trauma", "stroke"] },
  { name: "Sector 44 Multispeciality Hospital", city: "Gurugram", lat: 28.4520, lng: 77.0720, caps: ["cardiac", "stroke"] },
  { name: "Sohna Road Trauma Hospital", city: "Gurugram", lat: 28.4040, lng: 77.0480, caps: ["trauma"] },
  { name: "Manesar Community Hospital", city: "Gurugram", lat: 28.3580, lng: 76.9420, caps: ["trauma", "cardiac"] },
  { name: "South Delhi Cardiac Institute", city: "Delhi", lat: 28.5290, lng: 77.2150, caps: ["cardiac", "stroke"] },
  { name: "Ring Road Trauma Centre", city: "Delhi", lat: 28.5800, lng: 77.2100, caps: ["trauma"] },
  { name: "West Delhi General Hospital", city: "Delhi", lat: 28.6400, lng: 77.1500, caps: ["cardiac", "trauma", "stroke"] },
  { name: "Dwarka Sector 10 Hospital", city: "Delhi", lat: 28.5820, lng: 77.0580, caps: ["cardiac", "trauma", "stroke"] },
  { name: "Noida Expressway Hospital", city: "Noida", lat: 28.5800, lng: 77.3400, caps: ["cardiac", "trauma", "stroke"] },
  { name: "Old Airport Road Hospital", city: "Bangalore", lat: 12.9600, lng: 77.6500, caps: ["cardiac", "trauma", "stroke"] },
  { name: "Hosur Road Trauma Centre", city: "Bangalore", lat: 12.9200, lng: 77.6200, caps: ["trauma"] },
  { name: "South End Cardiac Hospital", city: "Bangalore", lat: 12.9300, lng: 77.5850, caps: ["cardiac", "stroke"] },
  { name: "Whitefield Main Road Hospital", city: "Bangalore", lat: 12.9750, lng: 77.7350, caps: ["cardiac", "trauma"] },
  { name: "North Bangalore General Hospital", city: "Bangalore", lat: 13.0500, lng: 77.5900, caps: ["trauma", "cardiac", "stroke"] },
];

export const AMBULANCES = [
  // Gurugram
  { id: "GGN-A1", provider: "Swift Ambulance Co.", type: "ACLS", city: "Gurugram", lat: 28.4420, lng: 77.0620 },
  { id: "GGN-A2", provider: "Capital Rescue", type: "ACLS", city: "Gurugram", lat: 28.4920, lng: 77.0910 },
  { id: "GGN-A3", provider: "Metro Life Support", type: "ACLS", city: "Gurugram", lat: 28.4110, lng: 77.0440 },
  { id: "GGN-A4", provider: "Swift Ambulance Co.", type: "ACLS", city: "Gurugram", lat: 28.4600, lng: 77.0950 },
  { id: "GGN-B1", provider: "CareLine Ambulance", type: "BLS", city: "Gurugram", lat: 28.4350, lng: 77.0600 },
  { id: "GGN-B2", provider: "Swift Ambulance Co.", type: "BLS", city: "Gurugram", lat: 28.4900, lng: 77.0950 },
  { id: "GGN-P1", provider: "CareLine Ambulance", type: "PTA", city: "Gurugram", lat: 28.4600, lng: 77.0750 },
  { id: "GGN-P2", provider: "Capital Rescue", type: "PTA", city: "Gurugram", lat: 28.4250, lng: 77.0350 },
  // Delhi
  { id: "DEL-A1", provider: "Capital Rescue", type: "ACLS", city: "Delhi", lat: 28.5350, lng: 77.2100 },
  { id: "DEL-A2", provider: "Metro Life Support", type: "ACLS", city: "Delhi", lat: 28.6300, lng: 77.1800 },
  { id: "DEL-A3", provider: "Swift Ambulance Co.", type: "ACLS", city: "Delhi", lat: 28.5700, lng: 77.2300 },
  { id: "DEL-A4", provider: "Capital Rescue", type: "ACLS", city: "Delhi", lat: 28.5950, lng: 77.0500 },
  { id: "DEL-B1", provider: "CareLine Ambulance", type: "BLS", city: "Delhi", lat: 28.5900, lng: 77.0700 },
  { id: "DEL-B3", provider: "Metro Life Support", type: "BLS", city: "Delhi", lat: 28.6480, lng: 77.1880 },
  { id: "DEL-P3", provider: "CareLine Ambulance", type: "PTA", city: "Delhi", lat: 28.5900, lng: 77.0480 },
  { id: "DEL-P2", provider: "Swift Ambulance Co.", type: "PTA", city: "Delhi", lat: 28.5280, lng: 77.2020 },
  { id: "DEL-B2", provider: "Capital Rescue", type: "BLS", city: "Delhi", lat: 28.5500, lng: 77.2400 },
  { id: "DEL-P1", provider: "Metro Life Support", type: "PTA", city: "Delhi", lat: 28.6000, lng: 77.2000 },
  // Noida
  { id: "NOI-A1", provider: "Metro Life Support", type: "ACLS", city: "Noida", lat: 28.5800, lng: 77.3300 },
  { id: "NOI-A2", provider: "Capital Rescue", type: "ACLS", city: "Noida", lat: 28.6150, lng: 77.3550 },
  { id: "NOI-B1", provider: "CareLine Ambulance", type: "BLS", city: "Noida", lat: 28.5950, lng: 77.3450 },
  { id: "NOI-P1", provider: "CareLine Ambulance", type: "PTA", city: "Noida", lat: 28.5750, lng: 77.3350 },
  // Bangalore
  { id: "BLR-A1", provider: "Namma Ambulance Services", type: "ACLS", city: "Bangalore", lat: 12.9700, lng: 77.6350 },
  { id: "BLR-A2", provider: "Metro Life Support", type: "ACLS", city: "Bangalore", lat: 12.9300, lng: 77.6150 },
  { id: "BLR-A3", provider: "Namma Ambulance Services", type: "ACLS", city: "Bangalore", lat: 12.9650, lng: 77.7300 },
  { id: "BLR-A4", provider: "Swift Ambulance Co.", type: "ACLS", city: "Bangalore", lat: 12.9350, lng: 77.6000 },
  { id: "BLR-B1", provider: "CareLine Ambulance", type: "BLS", city: "Bangalore", lat: 13.0950, lng: 77.5950 },
  { id: "BLR-B2", provider: "Namma Ambulance Services", type: "BLS", city: "Bangalore", lat: 12.9500, lng: 77.6300 },
  { id: "BLR-P1", provider: "CareLine Ambulance", type: "PTA", city: "Bangalore", lat: 12.9600, lng: 77.6100 },
  { id: "BLR-B3", provider: "Swift Ambulance Co.", type: "BLS", city: "Bangalore", lat: 12.9720, lng: 77.7450 },
  { id: "BLR-P2", provider: "Namma Ambulance Services", type: "PTA", city: "Bangalore", lat: 12.9680, lng: 77.7420 },
];

export const EMERGENCY_TYPES = [
  "Unconscious or unresponsive", "Road accident", "Fall from height", "Chest pain",
  "Shortness of breath", "Confusion or delirium", "Seizures", "Major bleeding",
  "Significant burns", "Suspected poisoning", "Snake bite", "Gunshot wound", "Stab wound",
  "Suspected fracture", "Head, neck or back injury", "Transfer from hospital, unstable patient",
  "Transfer from hospital, stable patient", "Abdominal pain", "Miscellaneous",
];

const URGENT_TYPES = new Set([
  "Chest pain", "Shortness of breath", "Seizures", "Major bleeding", "Confusion or delirium",
  "Road accident", "Fall from height", "Significant burns", "Suspected poisoning", "Snake bite",
  "Gunshot wound", "Stab wound", "Head, neck or back injury", "Transfer from hospital, unstable patient",
]);

const NEEDS = {
  "Chest pain": "cardiac", "Unconscious or unresponsive": "cardiac", "Shortness of breath": "cardiac",
  "Confusion or delirium": "stroke", "Seizures": "stroke",
  "Road accident": "trauma", "Fall from height": "trauma", "Major bleeding": "trauma",
  "Significant burns": "trauma", "Gunshot wound": "trauma", "Stab wound": "trauma",
  "Head, neck or back injury": "trauma", "Suspected fracture": "trauma",
};

// Assumptions for the demo, stated in the README.
export const DISPATCH_DELAY_MIN = 2;     // time for a crew to leave
export const MIN_PER_KM = 2.5;           // about 24 km/h in city traffic
export const NEARBY_MAX_ETA_MIN = 20;    // beyond this, a type counts as "not available nearby"
export const SELF_TRANSPORT_GAP_MIN = 5; // the helpline's rule
export const URGENT_MAX_ETA_MIN = 20;   // critical and urgent calls: never send an ambulance slower than this
const FARES = { ACLS: [3500, 45], BLS: [1800, 30], PTA: [1200, 25] }; // base INR, INR per km

const norm = (s) => String(s ?? "").trim().toLowerCase();

export function normaliseYesNo(v) {
  const s = norm(v);
  if (["yes", "y", "true", "haan", "ha"].includes(s)) return "yes";
  if (["no", "n", "false", "nahi"].includes(s)) return "no";
  return "unknown";
}

export function normaliseCity(v) {
  const s = norm(v);
  if (!s) return null;
  if (s.includes("gurgaon") || s.includes("gurugram")) return "Gurugram";
  if (s.includes("noida")) return "Noida";
  if (s.includes("bangalore") || s.includes("bengaluru")) return "Bangalore";
  if (s.includes("delhi")) return "Delhi";
  return "Other";
}

// Service regions. Delhi, Gurugram and Noida are one region: a transfer between them is in scope.
export const regionOf = (city) => (city === "Bangalore" ? "Bangalore" : ["Delhi", "Gurugram", "Noida"].includes(city) ? "Delhi NCR" : null);

export function matchEmergencyType(v) {
  const s = norm(v);
  return EMERGENCY_TYPES.find((t) => norm(t) === s)
    ?? EMERGENCY_TYPES.find((t) => s && (norm(t).includes(s) || s.includes(norm(t))))
    ?? "Miscellaneous";
}

export function km(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function triage({ emergency_type, patient_awake, patient_breathing_normally }) {
  const type = matchEmergencyType(emergency_type);
  const awake = normaliseYesNo(patient_awake);
  const breathing = normaliseYesNo(patient_breathing_normally);
  let priority;
  if (breathing === "no") priority = "critical";
  else if (awake === "no" || type === "Unconscious or unresponsive") priority = "critical";
  else if (URGENT_TYPES.has(type)) priority = "urgent";
  else if (awake === "unknown" || breathing === "unknown") priority = "urgent";
  else priority = "non_urgent";

  let required;
  if (priority !== "non_urgent") required = "ACLS";
  else if (type === "Transfer from hospital, stable patient") required = "PTA";
  else required = "BLS";
  return { type, priority, required };
}

// Find where the patient is. Shared GPS first, then an area name heard on the call, then the city centre.
export function resolvePosition({ city, sharedPosition, locationText }) {
  if (sharedPosition) return { ...sharedPosition, source: "shared location" };
  const c = normaliseCity(city);
  const text = norm(locationText);
  const byName = AREAS.find((a) => (!c || a.city === c) && text.includes(norm(a.name)));
  if (byName) return { lat: byName.lat, lng: byName.lng, area: byName.name, city: byName.city, source: "area named on the call" };
  const first = AREAS.find((a) => a.city === c);
  if (first) return { lat: first.lat, lng: first.lng, area: `${c} (city centre estimate)`, city: c, source: "city only, position estimated" };
  return null;
}

// Position of a place named on the call (a destination hospital, say). Matches a demo area name,
// then a city name. Returns null if neither is recognised.
export function resolvePlace(text) {
  const t = norm(text);
  if (!t) return null;
  const area = AREAS.find((a) => t.includes(norm(a.name)));
  if (area) return { lat: area.lat, lng: area.lng, area: area.name, city: area.city, estimated: false };
  const c = normaliseCity(text);
  const first = c && c !== "Other" ? AREAS.find((a) => a.city === c) : null;
  return first ? { lat: first.lat, lng: first.lng, area: `${c} (city centre estimate)`, city: c, estimated: true } : null;
}

export function nearestArea(lat, lng, maxKm = 40) {
  let best = null;
  for (const a of AREAS) {
    const d = km({ lat, lng }, a);
    if (!best || d < best.d) best = { ...a, d };
  }
  return best && best.d <= maxKm ? best : null;
}

function eta(unit, pos) {
  return Math.round(DISPATCH_DELAY_MIN + km(unit, pos) * MIN_PER_KM);
}

// The exact fare the operator is asked to accept. Rounded to the nearest 100 rupees.
export function exactFare(type, distanceKm) {
  const [base, perKm] = FARES[type];
  return Math.round((base + perKm * distanceKm) / 100) * 100;
}

// The range quoted to the caller before an operator has accepted the exact fare.
export function fareRange(type, distanceKm) {
  const mid = exactFare(type, distanceKm);
  return `${mid - 100} to ${mid + 100}`;
}

// Ambulances of one type, closest first.
// tripKm: distance the patient travels. For emergencies an 8 km average run to hospital is assumed;
// for transfers it is the real pickup-to-destination distance.
export function rankAmbulances(type, pos, city, tripKm = 8) {
  return AMBULANCES.filter((u) => u.type === type && u.city === city)
    .map((u) => ({ ...u, eta_minutes: eta(u, pos), fare_range_inr: fareRange(type, km(u, pos) + tripKm), fare_inr: exactFare(type, km(u, pos) + tripKm) }))
    .sort((a, b) => a.eta_minutes - b.eta_minutes);
}

export function findNearestHelp({ city, emergency_type, patient_awake, patient_breathing_normally, destination }, ctx = {}) {
  const c = normaliseCity(city);
  if (!c || c === "Other") {
    return { error: "outside_service_area", message: "This city is outside the service area. Tell the caller to call 112." };
  }
  const pos = resolvePosition({ city: c, sharedPosition: ctx.sharedPosition, locationText: ctx.locationText });
  const t = triage({ emergency_type, patient_awake, patient_breathing_normally });
  const isTransfer = t.type.startsWith("Transfer from hospital");
  const dest = isTransfer ? resolvePlace(destination) : null;
  if (dest && regionOf(dest.city) !== regionOf(c)) {
    return { error: "inter_city_transfer", message: "The destination is outside this region. Transfers between Delhi NCR and Bangalore, or to other cities, are not arranged. Hand off to a dispatcher." };
  }
  // 1.3: roads are longer than straight lines. Within one city, a city-centre estimate makes the
  // straight-line distance meaningless (both ends can land on the same point), so use the 8 km default.
  // Across cities in Delhi NCR, the distance between the two points is still a fair estimate.
  const exact = dest && !dest.estimated && (pos.source === "area named on the call" || pos.source === "shared location");
  const crossCity = dest && dest.city !== c;
  const tripEstimated = !exact;
  const tripKm = exact || crossCity ? Math.max(2, Math.round(km(pos, dest) * 1.3)) : 8;

  let candidates = rankAmbulances(t.required, pos, c, tripKm);
  let fallback = false;
  let type = t.required;
  if (!candidates.length || candidates[0].eta_minutes > NEARBY_MAX_ETA_MIN) {
    const bls = rankAmbulances("BLS", pos, c, tripKm);
    if (t.required !== "BLS" && bls.length && (!candidates.length || bls[0].eta_minutes < candidates[0].eta_minutes)) {
      candidates = bls; fallback = true; type = "BLS";
    }
  }

  // Hard cutoff on urgent calls: an ambulance that cannot arrive in time is not offered at all.
  const urgent = t.priority !== "non_urgent";
  if (urgent) candidates = candidates.filter((u) => u.eta_minutes <= URGENT_MAX_ETA_MIN);
  const noneInTime = urgent && !candidates.length;

  const need = NEEDS[t.type];
  const hospitals = HOSPITALS.filter((h) => h.city === c && (!need || h.caps.includes(need)))
    .map((h) => ({ name: h.name, travel_minutes: Math.round(km(h, pos) * MIN_PER_KM) }))
    .sort((a, b) => a.travel_minutes - b.travel_minutes);
  let hospital = hospitals[0] ?? null;
  if (isTransfer && destination) {
    // The family chooses the destination, so it replaces the nearest-hospital suggestion.
    hospital = { name: String(destination), travel_minutes: Math.round(tripKm * MIN_PER_KM) };
  }

  const top = candidates[0];
  const advise = Boolean(
    hospital && !isTransfer && urgent &&
    (noneInTime || (top && top.eta_minutes - hospital.travel_minutes >= SELF_TRANSPORT_GAP_MIN))
  );

  return {
    priority: t.priority,
    required_ambulance_type: t.required,
    ambulance_type: type,
    fallback_used: fallback,
    ambulance: top ? { provider: top.provider, eta_minutes: top.eta_minutes, fare_range_inr: top.fare_range_inr } : null,
    hospital,
    advise_self_transport: advise,
    ...(urgent ? { max_eta_minutes: URGENT_MAX_ETA_MIN, no_ambulance_in_time: noneInTime } : {}),
    ...(isTransfer ? { destination_needed: !destination, trip_km: tripKm, trip_km_estimated: tripEstimated } : {}),
    // Not needed by the agent, used by the page.
    _emergency_type: t.type,
    _destination: dest,
    _position: pos,
    _operators: operatorList(candidates, type, pos, c, tripKm, urgent),
  };
}

// Who to call, in order: the right vehicle type first, closest first. If there are fewer than three,
// fill the list with the nearest BLS units, the helpline's fallback. Each entry keeps its own type and fare.
export function operatorList(candidates, type, pos, city, tripKm, urgent = true, max = 3) {
  const list = candidates.slice(0, max);
  if (list.length < max && type !== "BLS") {
    for (const u of rankAmbulances("BLS", pos, city, tripKm)) {
      if (list.length >= max) break;
      if (!urgent || u.eta_minutes <= URGENT_MAX_ETA_MIN) list.push({ ...u, fallback: true });
    }
  }
  return list;
}

// What the agent is told, without the page-only fields.
export function forAgent(result) {
  const out = {};
  for (const [k, v] of Object.entries(result)) if (!k.startsWith("_")) out[k] = v;
  return out;
}
