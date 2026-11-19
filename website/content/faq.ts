export const coreFaq = [
  {
    q: "Is Dialbubble really free?",
    a: "Yes. The app is free, with no subscription and no markup. You pay Twilio directly for the calls, texts and numbers you use, at Twilio's normal rates.",
  },
  {
    q: "Do I need a Twilio account?",
    a: "For real calls and texts, yes. The app walks you through signing up if you don't have one. To look around first, Demo Mode works with no account at all.",
  },
  {
    q: "Does Dialbubble make calls over the internet?",
    a: "No. Dialbubble has no in-app VoIP. On a Talk call, Twilio rings your regular phone and connects you to the other person, so you talk on your normal phone line.",
  },
  {
    q: "What number does the other person see?",
    a: "The Twilio number you chose for the call, or a verified caller ID from your account. They don't see your personal number.",
  },
  {
    q: "Why does a Talk call cost two legs?",
    a: "Twilio places two calls and joins them: one to your phone and one to the other person. Twilio bills each leg at its normal rate. A Voice Message call uses one leg, because it only calls the other person.",
  },
  {
    q: "Will I get notified about new texts?",
    a: "While the app is open, new texts appear right away in an in-app banner. You can also turn on an app icon badge and alerts while the app is closed. Those use Background App Refresh, and iOS decides when checks run, so they can arrive late. Dialbubble has no server, so there are no instant push notifications.",
  },
  {
    q: "Where are my Twilio credentials stored?",
    a: "In the iPhone Keychain, on that device only. Dialbubble has no server, so we never see or receive them.",
  },
  {
    q: "Is Dialbubble open source?",
    a: "Yes. All of the code is on GitHub under the MIT license, so you can check exactly what the app does with your credentials, build it yourself, or contribute.",
  },
  {
    q: "Is there an Android version?",
    a: "No. Dialbubble is iPhone only and needs iOS 26 or later.",
  },
];
