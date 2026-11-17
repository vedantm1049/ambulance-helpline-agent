# Triage rules (reviewed by Vedant, 16 Nov 2026)

These rules run in the page code, not in the AI model. The agent collects the inputs. The code decides. That matches how Guardians ended up working: call takers stopped judging priority themselves and an input model did it.

Written from the console video and Vedant's description of the call flow. The original CDSS was not available. This is a prototype rule set, not a clinical tool.

## Priority

Checked in order. First match wins.

| # | Condition | Priority |
|---|---|---|
| 1 | Patient not breathing normally | critical |
| 2 | Patient not awake, or type is "Unconscious or unresponsive" | critical |
| 3 | Type is one of: Chest pain; Shortness of breath; Seizures; Major bleeding; Confusion or delirium; Road accident; Fall from height; Significant burns; Suspected poisoning; Snake bite; Gunshot wound; Stab wound; Head, neck or back injury; Transfer from hospital, unstable patient | urgent |
| 4 | Awake or breathing is "unknown", any remaining type | urgent |
| 5 | Type is one of: Suspected fracture; Abdominal pain; Transfer from hospital, stable patient; Miscellaneous | non_urgent |

Stroke has no entry of its own. It is logged as "Confusion or delirium" and is urgent. Confirmed.

## Ambulance type

| Priority or type | Ambulance |
|---|---|
| critical | ACLS (advanced life support: doctor-level equipment, for patients who may need resuscitation) |
| urgent | ACLS |
| non_urgent | BLS (basic life support: oxygen and a trained attendant) |
| Transfer from hospital, stable patient | PTA (patient transport, no life support) |

## Fallback

The first priority is always the required type. Only if none is available nearby does the page offer a BLS instead, with `fallback_used = true`. The agent must tell the caller it is a basic ambulance.

## Self transport rule

From your description. Applied only to critical and urgent calls.

```
advise_self_transport = (ambulance_eta_minutes - hospital_travel_minutes) >= 5
```

If true, the agent tells the caller a cab or own vehicle will be faster, and lets them choose.
