# Ambulance Helpline: voice intake prototype

A voice agent built on ElevenLabs ElevenAgents that runs the first minutes of an ambulance call in Hindi or English. It confirms the caller's location, triages the emergency, books the nearest suitable ambulance, calls the ambulance operator to confirm dispatch, and calls the caller back.

**Live demo:** https://vedantm1049.github.io/ambulance-helpline-agent/
**No microphone:** https://vedantm1049.github.io/ambulance-helpline-agent/?mock=1 (a scripted replay, no AI)

This is a prototype. It is not an emergency service. In a real emergency in India, call 112.

## Why I built it

I co-founded a medical emergency helpline in India covering Delhi NCR and Bangalore. I ran the call centre. Every call followed the same order: get the location right, work out how serious it is, find the closest suitable ambulance and hospital, book it, then chase the ambulance operator until a vehicle actually left. Two things went wrong most often. Locations took too long to confirm, and operators did not pick up or dispatched late.

This prototype rebuilds that flow on ElevenAgents to see how much of it a voice agent can carry.

## How a case runs

1. **Intake call.** You play the caller. The agent opens in English and follows you into Hindi, including mixed Hindi and English. It asks for location first, by voice: area, city and nearest landmark, spelled out if unclear, read back once. It does not ask about the emergency until the location is confirmed. It then asks what happened, whether the patient is awake, and whether they are breathing normally. It never asks for the phone number, which comes from caller ID.
2. **Nearest help.** The page, not the AI, decides priority, ambulance type, the nearest operator and the nearest suitable hospital. If the hospital is at least five minutes closer than the ambulance on a serious call, the agent suggests a cab. The caller says yes or no.
3. **Operator call.** The agent calls the nearest operator and asks if they can dispatch now. "We will try" counts as no. It moves to the next operator, up to three. You can play the operator yourself or let the page simulate them.
4. **Callback.** The agent calls the caller back with the confirmed arrival time, says the vehicle details are on WhatsApp, then collects the patient's name and age and the caller's name.

Anything the agent cannot handle goes to a human dispatcher: unclear location, unsupported language, outside the service area, cost refusal, no ambulance confirmed.

## Design decisions

- **Kannada was cut after testing.** The real helpline worked in Hindi, English and Kannada, and the first version did too. In a test call with a recorded Kannada caller, speech recognition turned a short Kannada answer into Hindi script. The agent then switched to Hindi, the landmark ("near Forum Mall's back gate") came through as Kannada sounds written in Hindi letters, and the call ended in a hand-off because the location could not be confirmed. Prompt rules and place-name hints reduce this but do not fix it. Kannada callers now go straight to a human call taker. A language that fails on the location step is worse than no language.
- **Location by voice only.** The real helpline also sent an SMS link that returned GPS. In testing, the browser stand-in for it confused callers and left 17 seconds of silence, so it was cut. The agent now gets location the way a call taker does without GPS: area, landmark, spelling, one read-back.

- **The AI collects. Fixed rules decide.** Priority, ambulance type and routing are plain code in `js/dispatch.js` with unit tests. The helpline moved the same way in practice: call takers stopped judging priority and an input model did it. A wrong triage call should come from a rule someone can read, not from a model guess.
- **One agent, three calls.** The same agent handles intake, operator and callback. The page passes the stage and the case details as dynamic variables at the start of each call. One agent is easier to maintain. The risk is role confusion, which the test log tracks.
- **The page writes the operator and callback opening lines.** The time-critical facts (what is needed, where, the arrival time) are spoken from page text, not generated. The model handles the conversation after that.
- **Client tools, no server.** All five tools run in the browser. The agent is public with a domain allowlist, so there is no API key to hide.

## What is real and what is simulated

| Part | Status |
|---|---|
| Voice conversation, language switching, tool calls | Real, ElevenAgents |
| Triage and routing rules | Real code, invented data |
| Hospitals, ambulance operators, drivers, vehicles, fares | Invented |
| Patient position | Matched from the area name the caller speaks to a list of demo areas |
| Operator and callback phone calls | Played in the browser, by you or simulated. No phone rings |
| WhatsApp messages | Shown on screen only |

Travel times assume a two-minute dispatch delay and about 24 km/h in city traffic.

## Demo locations worth trying

- **Manesar, Gurugram:** the nearest hospital is far closer than any advanced ambulance, so the agent should suggest a cab.
- **Yelahanka, Bangalore:** no advanced life support ambulance is nearby, so the agent should offer a basic one and say so.

## Tools the agent can call

| Tool | Waits for a reply | What it does |
|---|---|---|
| `updateDispatchCard` | No | Fills the dispatch card as facts come in |
| `findNearestHelp` | Yes | Returns priority, ambulance type, operator, ETA, fare, hospital, and the cab rule |
| `bookAmbulance` | No | Records the caller's decision and starts operator calls |
| `reportOperatorResponse` | No | Records confirmed, declined or unclear |
| `handOffToDispatcher` | No | Hands the case to a human with a summary |

The full agent setup (system prompt, tool definitions, knowledge base, triage rules) is in `agent/`.

## Adapting it to another helpline

The agent is generic. A different helpline would change four things:

1. `js/dispatch.js`: its own areas, hospitals, fleet and triage rules.
2. `agent/system_prompt.md`: its own call order and handoff rules.
3. `agent/knowledge_base.md`: its own coverage, fares and policies.
4. `js/config.js`: its own agent ID.

For production, three parts would move to a server: real outbound calls to operators and callers through a telephony provider, WhatsApp through the Business API, and the dispatch data from a live fleet feed instead of a file.

## Run it locally

```
python3 -m http.server 8000
```

Open http://localhost:8000. Add `localhost:8000` to the agent's allowlist first, or the agent will refuse the connection.

Tests:

```
node --test tests/dispatch.test.mjs
```

## Test log

Calls run on the live demo. Results are recorded as they happened, including failures.

| # | Date | Scenario | Language | Result | What happened | Change made |
|---|---|---|---|---|---|---|
| 1 | | Chest pain, Sector 47, clear answers | Hindi | | | |
| 2 | | Collapsed, not breathing, panicked caller, asks about aspirin | English | | | |
| 3 | 17 Nov 2026 | Road accident, Koramangala, caller speaks only Kannada | Kannada | Pass, with change | Handed off correctly. It did not first ask whether the caller could speak Hindi or English. | Agent now asks once in English and Hindi before handing off. |
| 4 | 17 Nov 2026 | Vague location, spelled out, switches language | Hindi then English | Pass, with change | Vague location and the language switch were handled well. The male voice used a feminine Hindi verb ("kar rahi hoon"). | Prompt now requires masculine Hindi forms for the agent. |
| 5 | | Live operator says "we will try", second confirms | Hindi | | | |
| 6 | | Manesar, caller chooses own vehicle | Any | | | |

## Known limits

- Six test calls show the flow works. They do not show it is reliable.
- Hindi opening lines need a native speaker's check.
- A public agent ID can be used by anyone on an allowed domain. The allowlist and a call length cap limit this, but do not prevent it.
- The SDK bundle in `vendor/` is `@elevenlabs/client` 1.36.1 (MIT licence), vendored so the page does not depend on a CDN.
