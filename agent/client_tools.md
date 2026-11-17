# Client tools

A client tool is a function that runs on the demo web page, not on a server. The agent calls it during the conversation. The page code for these comes in step 4.

Create each one in the dashboard: Add tool, Tool Type "Client". Names are case-sensitive and must match exactly. Every parameter is Data Type String.

There are five tools and 25 parameters in total. An earlier sixth tool, `requestLocationShare`, was removed after the first test call: location is now taken by voice only.

The "Returns" notes are for the page code, not the dashboard. There is no field for them. Skip them when you set up each tool.

## 1. updateDispatchCard (14 parameters, none required, Wait for response OFF)

**Description:** Update the dispatch card on the dispatcher's screen. Call this every time the other person gives or corrects a detail. Send only the fields that changed.

| Identifier | Description |
|---|---|
| `language` | Language the caller is speaking: Hindi or English. Any other language is Other. |
| `location_text` | Location as confirmed with the caller: house or society, street, area. |
| `landmark` | Nearest landmark the caller named. |
| `city` | One of: Gurugram, Delhi, Noida, Bangalore, Other. |
| `destination` | Hospital transfers only: the destination hospital name, area and city. |
| `emergency_type` | Exactly one value from the emergency types list in the system prompt. |
| `what_happened` | One short sentence in English describing what the caller reported. |
| `patient_awake` | yes, no or unknown. |
| `patient_breathing_normally` | yes, no or unknown. |
| `other_ambulance_called` | yes, no or unknown. |
| `patient_name` | Name of the patient. |
| `patient_age` | Age of the patient in years, as a number. |
| `patient_gender` | male, female or other, only if the caller mentions it. |
| `caller_name` | Name of the caller. |

## 3. findNearestHelp (5 parameters, first 4 required, Wait for response ON)

**Description:** Get the priority, ambulance type, nearest ambulance and nearest suitable hospital for this call. Call only after the location is confirmed and emergency type, awake and breathing are known. Call again if any of them change.

| Identifier | Description |
|---|---|
| `city` | One of: Gurugram, Delhi, Noida, Bangalore. |
| `emergency_type` | Exactly one value from the emergency types list. |
| `patient_awake` | yes, no or unknown. |
| `patient_breathing_normally` | yes, no or unknown. |
| `destination` | Optional. Hospital transfers only: destination hospital, area and city. The fare covers the trip to it. |

Returns:

```json
{
  "priority": "critical | urgent | non_urgent",
  "required_ambulance_type": "ACLS | BLS | PTA",
  "ambulance_type": "ACLS | BLS | PTA",
  "fallback_used": false,
  "ambulance": { "provider": "...", "eta_minutes": 10, "fare_range_inr": "4400 to 4600" },
  "hospital": { "name": "...", "travel_minutes": 4 },
  "advise_self_transport": true
}
```

`fallback_used` is true when the required type is not available nearby and a BLS is offered instead. The page decides priority and ambulance type with fixed rules, not the AI model. See `triage_rules.md`. Providers, hospitals, times and fares are invented demo data.

## 4. bookAmbulance (1 parameter, required, Wait for response OFF)

**Description:** Record the caller's decision at the end of the intake call. Call once, as soon as the caller says yes to the ambulance or chooses their own vehicle. This starts the confirmation call to the ambulance operator.

| Identifier | Description |
|---|---|
| `choice` | One of: ambulance, own_vehicle. |

## 5. reportOperatorResponse (3 parameters, Wait for response OFF)

**Description:** Record what the ambulance operator said. Call once, in the operator stage only, as soon as the operator confirms, declines or stays unclear.

| Identifier | Required | Description |
|---|---|---|
| `response` | yes | One of: confirmed, declined, unclear. |
| `eta_minutes` | no | Minutes to reach the patient, as a number. Only when confirmed. |
| `note` | no | One short sentence in English on what the operator said. |

If the response is declined or unclear, the page moves to the next best operator and starts a new operator call. After three failures it stops and marks the case for a human.

## 6. handOffToDispatcher (2 parameters, both required, Wait for response OFF)

**Description:** Hand the case to a human dispatcher. Call when the caller needs a human, the location cannot be confirmed, the caller is outside the service area or speaks an unsupported language, the caller declines, no ambulance can be confirmed, or the call is a hoax.

| Identifier | Description |
|---|---|
| `summary` | Two sentences in English: who needs help, where, what happened, and why a human is needed. |
| `outcome` | One of: Enquiry only; Declined because of cost; Language not supported; Outside service area; Location not confirmed; No ambulance confirmed; Hoax or test call. |

## System tools to switch on

- **Language detection:** lets the agent change language when the other person does.
- **End call:** lets the agent hang up.

## Dynamic variables

A dynamic variable is a blank in the prompt that the web page fills in at the start of each call, like a mail merge. The system prompt and first message use seven:

| Variable | Placeholder value to enter in the dashboard |
|---|---|
| `opening_line` | Ambulance helpline, demo line. What is your emergency? |
| `call_stage` | INTAKE |
| `caller_number` | 9800000000 |
| `caller_language` | unknown |
| `case_summary` | none yet |
| `operator_name` | none |
| `booking_result` | none yet |

The placeholder is what the agent uses in the dashboard preview. On the web page, the page code supplies the real values.
