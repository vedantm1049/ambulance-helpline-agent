// Scripted walkthrough for ?mock=1. No AI and no voice: it replays a fixed call by calling the
// same client tools the real agent calls. Used to test the page and to show it without a microphone.

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const SCRIPTS = {
  INTAKE: [
    ["agent", "{opening}"],
    ["user", "Mera father ko chest pain ho raha hai, bahut paseena aa raha hai."],
    ["agent", "Aap kahan hain? Area aur city bataiye."],
    ["user", "Sector 47, Gurugram. Tower B."],
    ["agent", "Sabse paas ka landmark kya hai?"],
    ["user", "Sector 47 market."],
    ["tool", "updateDispatchCard", { language: "Hindi", location_text: "Tower B, Sector 47", landmark: "Sector 47 market", city: "Gurugram" }],
    ["agent", "Tower B, Sector 47, market ke paas, Gurugram. Sahi hai?"],
    ["user", "Haan."],
    ["agent", "Kya mareez hosh mein hain aur jawab de rahe hain?"],
    ["user", "Haan, baat kar rahe hain."],
    ["agent", "Kya woh theek se saans le rahe hain?"],
    ["user", "Haan."],
    ["tool", "updateDispatchCard", { emergency_type: "Chest pain", what_happened: "Father has chest pain and is sweating.", patient_awake: "yes", patient_breathing_normally: "yes" }],
    ["agent", "Kya aapne pehle se koi aur ambulance bulayi hai?"],
    ["user", "Nahi."],
    ["tool", "updateDispatchCard", { other_ambulance_called: "no" }],
    ["tool", "findNearestHelp", { city: "Gurugram", emergency_type: "Chest pain", patient_awake: "yes", patient_breathing_normally: "yes" }],
    ["agent", "Advanced life support ambulance lagbhag {eta} minute mein aa sakti hai. Kiraya {fare} rupaye. Book karoon?"],
    ["user", "Haan, jaldi kijiye."],
    ["tool", "bookAmbulance", { choice: "ambulance" }],
    ["agent", "Book ho gaya. Main ambulance se confirm kar raha hoon. Do minute mein call back karunga. Phone free rakhiye."],
  ],
  OPERATOR: [
    ["agent", "{opening}"],
    ["user", "Haan ji, gaadi free hai. Nikal rahe hain."],
    ["agent", "Kitne minute mein pahunchenge?"],
    ["user", "Das minute."],
    ["tool", "reportOperatorResponse", { response: "confirmed", eta_minutes: "10", note: "Operator confirmed, leaving now, 10 minutes." }],
    ["agent", "Das minute, theek hai. Patient ki details WhatsApp par aa rahi hain. Dhanyavaad."],
  ],
  CALLBACK: [
    ["agent", "{opening}"],
    ["agent", "Ambulance aur driver ki details WhatsApp par bhej di hain. Mareez ka naam kya hai?"],
    ["user", "Rajesh Kumar."],
    ["tool", "updateDispatchCard", { patient_name: "Rajesh Kumar" }],
    ["agent", "Unki umar kitni hai?"],
    ["user", "Sixty two."],
    ["tool", "updateDispatchCard", { patient_age: "62", patient_gender: "male" }],
    ["agent", "Aur aapka naam?"],
    ["user", "Amit."],
    ["tool", "updateDispatchCard", { caller_name: "Amit" }],
    ["agent", "Mareez ke saath rahiye aur phone free rakhiye. Driver aapko call kar sakta hai."],
  ],
};

export class MockConversation {
  static async startSession(opts, stage) {
    const c = new MockConversation(opts, stage);
    c.run();
    return c;
  }

  constructor(opts, stage) {
    this.o = opts;
    this.stage = stage;
    this.stopped = false;
    this.help = null;
  }

  async run() {
    await pause(500);
    this.o.onConnect?.({ conversationId: "mock" });
    for (const step of SCRIPTS[this.stage] ?? []) {
      if (this.stopped) return;
      const [kind, a, b] = step;
      if (kind === "tool") {
        this.o.onModeChange?.({ mode: "listening" });
        const out = await this.o.clientTools[a](b);
        if (a === "findNearestHelp") this.help = JSON.parse(out);
        await pause(400);
        continue;
      }
      let text = a.replace("{opening}", this.o.dynamicVariables.opening_line);
      if (this.help?.ambulance) text = text.replace("{eta}", this.help.ambulance.eta_minutes).replace("{fare}", this.help.ambulance.fare_range_inr);
      this.o.onModeChange?.({ mode: kind === "agent" ? "speaking" : "listening" });
      this.o.onMessage?.({ message: text, role: kind === "agent" ? "agent" : "user", source: kind === "agent" ? "ai" : "user" });
      await pause(kind === "agent" ? 1100 : 800);
    }
    this.o.onDisconnect?.({ reason: "agent" });
  }

  async endSession() {
    this.stopped = true;
    this.o.onDisconnect?.({ reason: "user" });
  }
}
