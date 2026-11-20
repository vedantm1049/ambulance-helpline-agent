# Ambulance Helpline: voice intake prototype

A voice agent built on ElevenLabs ElevenAgents that runs the first minutes of an ambulance call in Hindi or English. It confirms the caller's location, triages the emergency, books the nearest suitable ambulance, and confirms dispatch with the ambulance operator while the caller stays on the line.

**Live demo:** https://vedantm1049.github.io/ambulance-helpline-agent/
**No microphone:** https://vedantm1049.github.io/ambulance-helpline-agent/?mock=1 (a scripted replay, no AI)

This is a prototype. It is not an emergency service. In a real emergency in India, call 112.

## Why I built it

I co-founded a medical emergency helpline in India covering Delhi NCR and Bangalore. I ran the call centre. Every call followed the same order: get the location right, work out how serious it is, find the closest suitable ambulance and hospital, book it, then chase the ambulance operator until a vehicle actually left. Two things went wrong most often. Locations took too long to confirm, and operators did not pick up or dispatched late.

This prototype rebuilds that flow on ElevenAgents to see how much of it a voice agent can carry.

## How a case runs

1. **Intake call.** You play the caller. The agent opens in English and follows you into Hindi, including mixed Hindi and English. It asks for location first, by voice: area, city and nearest landmark, spelled out if unclear, read back once. It does not ask about the emergency until the location is confirmed. It then asks what happened, whether the patient is awake, and whether they are breathing normally. It never asks for the phone number, which comes from caller ID.
2. **Nearest help.** The page, not the AI, decides priority, ambulance type, the nearest operator and the nearest suitable hospital. For a hospital transfer the agent asks for the destination, and the fare covers the trip to it. If the hospital is at least five minutes closer than the ambulance on a serious call, the agent suggests a cab. On critical and urgent calls, no ambulance slower than 20 minutes is offered or accepted. The caller hears a fare range and says yes or no.
3. **Confirmation on the same call.** Once the caller says yes, the agent says a colleague is calling the ambulance now and asks the caller to stay on the line. While the colleague calls operators in the background, the agent takes the patient's name and age and the caller's name. The colleague calls the nearest operator first, in Hindi for Delhi NCR and in English for Bangalore, and moves to the next one, up to three. Each operator is offered one exact fare and must accept it with the dispatch; asking for more, or "we will try", counts as no. When an operator confirms, the page passes the result into the live call and the agent tells the caller the arrival time and the exact fare. Details also go to WhatsApp.
4. **Separate calls, if you want to play the operator.** The background operators are simulated, because you cannot be the caller and the operator at once. Pick "Separate calls" on the page to play the operator yourself. The intake call then ends, the agent calls you as the operator, and then calls the caller back with the result.

Anything the agent cannot handle goes to a human dispatcher: unclear location, unsupported language, outside the service area, cost refusal, no ambulance confirmed.

## Design decisions

- **Kannada was cut after testing.** The real helpline worked in Hindi, English and Kannada, and the first version did too. In a test call with a recorded Kannada caller, speech recognition turned a short Kannada answer into Hindi script. The agent then switched to Hindi, the landmark ("near Forum Mall's back gate") came through as Kannada sounds written in Hindi letters, and the call ended in a hand-off because the location could not be confirmed. Prompt rules and place-name hints reduce this but do not fix it. Kannada callers now go straight to a human call taker. A language that fails on the location step is worse than no language.
- **Location by voice only.** The real helpline also sent an SMS link that returned GPS. In testing, the browser stand-in for it confused callers and left 17 seconds of silence, so it was cut. The agent now gets location the way a call taker does without GPS: area, landmark, spelling, one read-back.

- **The AI collects. Fixed rules decide.** Priority, ambulance type and routing are plain code in `js/dispatch.js` with unit tests. The helpline moved the same way in practice: call takers stopped judging priority and an input model did it. A wrong triage call should come from a rule someone can read, not from a model guess.
- **One agent, three calls.** The same agent handles intake, operator and callback. The page passes the stage and the case details as dynamic variables at the start of each call. One agent is easier to maintain. The risk is role confusion, which the test log tracks: the operator call once overwrote the caller's language. Splitting into three agents would give each call only its own rules and tools. It was considered and left for later, because it means retesting every call.
- **Speed over model depth.** The agent runs on Claude Sonnet 5.5 with reasoning set to low, the lowest setting ElevenLabs allows for it. Opus 5.5 missed a turn deadline in test 2, and with default reasoning, Sonnet took about 3 seconds to start each reply in test 13. On an emergency line a 3-second pause sounds like a dropped call. The rules that matter most run in code, so less model reasoning costs little. Voice speed is at the maximum, 1.2.
- **Confirm while the caller waits.** The first version hung up, confirmed with the operator, then called back. That costs a second call and leaves the caller waiting with no news. Now the operator calls run in the background and the agent uses the wait to take the details the callback used to collect. The page sends the result into the live call as a message the agent treats as a note from a colleague, not as the caller speaking. It waits until the agent stops speaking, so the agent is not cut off mid-sentence. If the caller hangs up first, the page falls back to a callback.
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

- **Manesar, Gurugram:** no advanced ambulance can arrive within 20 minutes and a hospital is 2 minutes away, so the agent should offer no ambulance and suggest a cab.
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

Every call run on the live demo, in order, including failures. Fourteen test cases, 24 conversations in all: most cases are an intake call plus operator and callback calls. One 3-second call that was hung up before anyone spoke is left out.

| # | Date | Scenario | Language | Result | What happened | Change made |
|---|---|---|---|---|---|---|
| 1 | 17 Nov 2026, 15:14 | Chest pain, Sector 47, Gurugram. Callback collects names | English | Pass, with changes | Triage and booking were right: "difficulty breathing" became critical, ACLS 6 minutes away. Three faults: the SMS location request left about 19 seconds of silence; audio tags such as "[Seriously]" showed in the transcript; the agent said "Take your time" to an emergency caller. | Location is now taken by voice only. Audio tags are stripped. "Take your time" is banned in the prompt. Voice speed raised. |
| 2 | 17 Nov 2026, 15:23 | Mother collapsed, not awake, caller asks about aspirin, Koramangala | Hindi then English | Pass, with changes | Refused medical advice correctly and booked ACLS. Three faults: the tone was loud and swung between calm and alarmed; the callback came in Hindi although the caller had switched to English; Opus missed a turn deadline and the backup model answered. | Expressive mode off and a steady tone rule. Caller language now read from what the caller said, then locked. Model moved from Opus to Sonnet. |
| 3 | 17 Nov 2026, 15:31 | Friend in an accident, heavy bleeding, Forum Mall, Koramangala | Hindi | Pass | Location read back once, urgent triage, ACLS 5 minutes away, Hindi callback with names. No faults. | None |
| 4 | 17 Nov 2026, 15:37 | Bike accident, caller speaks only Kannada, gives the address in the first sentence | Kannada | Fail, fixed | The agent replied in Kannada once, then speech recognition wrote the caller's Kannada in Hindi script and the agent switched to Hindi. It asked the caller to spell the address twice, then handed off for "Location not confirmed". | Kannada dropped. Callers in other languages are asked once if they can speak Hindi or English, then handed to a human. |
| 5 | 17 Nov 2026, 15:50 | Road accident, Koramangala, caller speaks only Kannada | Kannada | Pass, with change | Handed off correctly. It did not first ask whether the caller could speak Hindi or English. | Agent now asks once in English and Hindi before handing off. |
| 6 | 17 Nov 2026, 15:51 | Vague location, spelled out, switches language | Hindi then English | Pass, with change | Vague location and the language switch were handled well. The male voice used a feminine Hindi verb ("kar rahi hoon"). | Prompt now requires masculine Hindi forms for the agent. |
| 7 | 17 Nov 2026, 15:57 | Hospital transfer, Indraprastha Apollo to CK Birla. Live operator says "30 minutes, we will try" | English, operator Hindi | Pass, with changes | Operator's "we will try" was correctly treated as a decline. Four faults: the agent asked for a landmark after a hospital name; the destination was not recorded, so the fare ignored it; the operator call opened in English for Delhi and said "urgent" for a non-urgent transfer; the operator's switch to Hindi overwrote the caller's language, so the callback came in Hindi. | Named places count as landmarks. Transfers ask for the destination and price the trip. Operator calls default to Hindi in Delhi NCR and English in Bangalore. The operator call can no longer write to the caller's card, and the caller's language is locked at the end of intake. |
| 8 | 17 Nov 2026, 16:12 | Hospital transfer, Indraprastha Apollo, Delhi to Bhatia Hospital, Gurugram. Caller does not know the destination's area | English | Fail, fixed | The agent called Delhi to Gurugram an inter-city transfer and handed off as "Outside service area". Delhi NCR is one service area, so this should have been booked. | Delhi, Gurugram and Noida now count as one city in the prompt, the knowledge base and the code. Only Delhi NCR to Bangalore is refused. A cross-city trip is priced on its distance, not the 8 km default. The destination's area is no longer required. |
| 9 | 17 Nov 2026, 16:14 | Hospital transfer, CK Birla to Artemis, Gurugram. Simulated operators, first does not pick up | English | Fail, fixed | Callback came in English, as it should. Three faults: the agent asked which city Artemis was in, though the caller had named it; Gurugram had only one PTA ambulance, so when that operator did not pick up there was no one left to call and the callback said no ambulance; both hospitals resolved to the same city-centre point, so the trip was priced at 0 km. | A named destination is read back with the pickup city instead of asked again. The operator list now fills up to three with the nearest BLS units, the helpline's fallback, and Gurugram has a second PTA unit. Estimated trips use the 8 km default. The failure callback names the next step, and never suggests a cab for a transfer. |
| 10 | 17 Nov 2026, 16:20 | Hospital transfer, Artemis to CK Birla, Gurugram. Live operator in Hindi asks about the fare | English intake, Hindi operator | Pass, with changes | Pickup and destination were read back in one line, as fixed in test 9. Three gaps: the agent asked "awake?" and "breathing?" though the caller asked for a patient transfer vehicle; the agent told the operator the fare was not its business; no exact fare reached the caller. The page was also still serving the old code, so this call ran without test 9's fixes for operators and trip distance. | An explicit PTA request skips the awake and breathing questions. Operators are offered an exact fare and must accept it. The callback and WhatsApp give that fare. Urgent calls have a 20-minute cutoff, for both the offer and the operator's quoted time. |
| 11 | 17 Nov 2026, 16:24 | Manesar, caller has trouble breathing, names several areas, cannot give a landmark | English | Fail, fixed | The agent asked which area, which was right. Then it asked for a landmark twice, asked the caller to spell Manesar, and handed off for "Location not confirmed" though area and city were clear. The cutoff and cab advice were never reached. | A landmark is asked for once and is optional. A confirmed area and city are enough to continue. Spelling is only for words the agent did not catch. |
| 12 | 17 Nov 2026, 16:40 | Manesar, chest pain, not breathing normally, no landmark | English | Pass | Landmark asked once, then accepted as unknown. No ACLS within 20 minutes, so no ambulance was offered. The agent named Manesar Community Hospital, 2 minutes away, and the caller chose to go by own vehicle. | None |
| 13 | 20 Nov 2026, 14:38 | Retest of test 8: Indraprastha Apollo, Delhi to Bhatia Hospital, Gurugram. Simulated operators, first does not pick up | English | Pass, with change | Booked as a Delhi NCR transfer, no hand-off. PTA quoted at 3 minutes, priced on the 24 km trip. The first operator did not pick up, so the next PTA confirmed at 23 minutes and INR 2,000. The callback gave 23 minutes with no reason, and the caller asked why it was not 3. The caller also declined to give names, which the agent accepted. | When the confirmed ambulance is not the one quoted, the callback now says the nearest one was not available and the next one was booked, in Hindi and English. |
| 14 | 20 Nov 2026, 14:50 | Bystander in Cubbon Park sees a stranger collapse, not awake, unsure about breathing. Reasoning set to low | English | Pass, with change | Replies started in 0.4 to 1.2 seconds, down from about 2.3 in test 13. Critical triage, ACLS 5 minutes away. The first operator did not pick up, and the callback explained the switch, as fixed in test 13. When the caller did not know the patient's name, the agent asked for sex and rough age instead. One gap: the intake quoted INR 3,800 to 4,000, but the second, farther ambulance cost INR 4,100, outside the quoted range. | The callback now says the next ambulance is "from further away", so a higher fare and longer time have a reason. |
| 15 | | Background dispatch: chest pain, Sector 47. First operator does not pick up. Details taken while waiting, confirmation on the same call | Any | | | |

## Known limits

- Six test calls show the flow works. They do not show it is reliable.
- Hindi opening lines need a native speaker's check.
- A public agent ID can be used by anyone on an allowed domain. The allowlist and a call length cap limit this, but do not prevent it.
- The SDK bundle in `vendor/` is `@elevenlabs/client` 1.36.1 (MIT licence), vendored so the page does not depend on a CDN.
