// Opening lines the page writes for each call. The agent speaks these first, then follows the system prompt.
// Kannada and Hindi lines should be checked by a native speaker.

export const LANG_CODE = { English: "en", Hindi: "hi", Kannada: "kn" };

export function intakeOpening() {
  return "Ambulance helpline, demo line. What is your emergency?";
}

export function operatorOpening(lang, c) {
  if (lang === "Hindi") {
    return `एम्बुलेंस हेल्पलाइन से बोल रहे हैं, अर्जेंट बुकिंग है। ${c.place} में ${c.emergency} केस के लिए अभी ${c.type} एम्बुलेंस चाहिए। क्या आप अभी भेज सकते हैं?`;
  }
  return `Ambulance Helpline here, urgent booking. ${c.type} ambulance needed now for ${c.emergency} at ${c.place}. Can you dispatch now?`;
}

export function callbackOpening(lang, confirmed, eta) {
  if (confirmed) {
    if (lang === "Hindi") return `एम्बुलेंस हेल्पलाइन से कॉल बैक है। आपकी एम्बुलेंस कन्फर्म हो गई है, लगभग ${eta} मिनट में पहुँचेगी।`;
    if (lang === "Kannada") return `ಆಂಬ್ಯುಲೆನ್ಸ್ ಹೆಲ್ಪ್‌ಲೈನ್‌ನಿಂದ ಮರಳಿ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇವೆ. ನಿಮ್ಮ ಆಂಬ್ಯುಲೆನ್ಸ್ ಖಚಿತವಾಗಿದೆ, ಸುಮಾರು ${eta} ನಿಮಿಷದಲ್ಲಿ ತಲುಪುತ್ತದೆ.`;
    return `Ambulance Helpline calling back. Your ambulance is confirmed and should reach you in about ${eta} minutes.`;
  }
  if (lang === "Hindi") return "एम्बुलेंस हेल्पलाइन से कॉल बैक है। माफ़ कीजिए, हम एम्बुलेंस कन्फर्म नहीं कर पाए।";
  if (lang === "Kannada") return "ಆಂಬ್ಯುಲೆನ್ಸ್ ಹೆಲ್ಪ್‌ಲೈನ್‌ನಿಂದ ಮರಳಿ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇವೆ. ಕ್ಷಮಿಸಿ, ನಮಗೆ ಆಂಬ್ಯುಲೆನ್ಸ್ ಖಚಿತಪಡಿಸಲು ಆಗಲಿಲ್ಲ.";
  return "Ambulance Helpline calling back. I am sorry, we could not confirm an ambulance.";
}
