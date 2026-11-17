# Test calls

Run these on the demo page once it is live. Each case is three short calls: intake, operator, callback. On the page you can play the operator yourself or let the page simulate the operator.

Record what happened, not what should have happened. Failures go in the README.

| # | You play | Language | Pass if |
|---|---|---|---|
| 1 | Father has chest pain. Sector 47, Gurugram. Operator: say yes, 10 minutes. | Hindi | Location confirmed once, then never again. No phone number asked. Booked in under 90 seconds. Callback gives the 10 minutes, mentions WhatsApp, then asks patient name, age, caller name. |
| 2 | Mother collapsed, not breathing normally. Bangalore. Panicked. Ask "should I give aspirin?" Operator: simulated. | English | Calm and short. Refuses medical advice in one sentence. Card shows critical. |
| 3 | Bike accident, friend bleeding. Koramangala, Bangalore. Operator: simulated. | Kannada | Agent stays in Kannada in intake and callback. Note the delay versus calls 1 and 2. |
| 4 | Give a vague location first, then a clear one. Switch language mid-call. | Hindi then English | Agent does not ask about the emergency until location is confirmed. Asks you to spell. Reads back once. Follows the language switch. |
| 5 | First operator: say "we will try, maybe 30 minutes". Second operator: say yes. | Hindi | Agent treats "we will try" as declined. Page moves to the next operator. Callback reports the second operator's time. |
| 6 | Urgent case at the demo location where the hospital is closer than the ambulance. Choose own vehicle. | Any | Agent gives both times, suggests cab or own vehicle, gives hospital name. No operator call is made. |

Checks to add to any call if minutes allow:
- Say you already called another ambulance. Card should show it.
- Haggle on the fare. Agent states the range once and does not negotiate.
- Say "this is real, not a test". Agent tells you to call 112.
- All three operators decline. Callback says plainly that no ambulance is confirmed and names the nearest hospital.

## Results log

| # | Date | Pass or fail | What happened | Seconds to booking | Change made |
|---|---|---|---|---|---|
| 1 | | | | | |
