/* NizamOk — English content bundle. Loaded ONLY on /en/ pages, before
   main.js/quiz.js. Arabic remains the primary experience; this bundle
   carries the premium English rendition of the quiz content model and all
   runtime UI strings. Pattern slugs, scoring, mapping, endpoints, and the
   MailerLite payload (which keeps Arabic pattern names for the Arabic
   automations) are untouched by design. */
window.NIZAMOK_I18N_EN = {

  patterns: {
    mubdia: {
      name: 'The Scattered Creative',
      truth: "You don't lack ideas; you lack one idea that arrives.",
      headline: "You're not running from finishing — you're running from the middle of the road. Beginnings give you a new version of yourself, but they pull you away from the thing that was almost there.",
      wound: "What repeats isn't a lack of ability, but the difficulty of staying with an idea once its shine fades and it asks for patience instead of excitement.",
      step: "Choose one project you abandoned though it deserves better, and protect it from every new idea for seven days only. Don't kill the ideas — park them."
    },
    asira: {
      name: "Perfection's Captive",
      truth: 'Unfinished work does not mean something unfinished in you.',
      headline: "You're not afraid of the work — you're afraid of the moment it appears before another eye. So revising became a safe house you live in instead of delivering.",
      wound: "What repeats is that the work's quality has fused with your own worth; every possible remark on the work became a personal threat to you.",
      step: "Send a 'good' version of your work to one person you trust — before it becomes perfect. Watch: the world will not collapse."
    },
    mutafadiya: {
      name: 'The Clever Avoider',
      truth: "You're not avoiding the task, but the feeling behind it.",
      headline: "You're not lazy — your day is full of small accomplishments. But the one door that matters grows larger in imagination with every day of delay, until it looms far beyond its size.",
      wound: 'What repeats is that the feeling behind the task — tension, judgment, confrontation — arrives before the task does, so you buy a daily truce at the price of a week.',
      step: "Open the door for ten minutes only: the message, the file, the call. The goal isn't to finish — the goal is for reality to return to its true size."
    },
    kafua: {
      name: 'The Depleted Capable',
      truth: 'Being capable does not mean being endlessly available.',
      headline: "Everyone assumes you're fine because you always come through. But your capability became an open entry pass for everyone — except you.",
      wound: "What repeats is that every quick 'yes' buys the relationship a moment of comfort, and pays for it out of your energy, your project, and what is yours.",
      step: "Before the next agreement, ask silently: what does this yes cost? And reserve one weekly hour for yourself alone — an appointment that doesn't get cancelled."
    }
  },

  /* Same order as the Arabic questions; options align by index (the pattern
     mapping lives in quiz.js and never changes). */
  questions: [
    {
      scene: 'After the House Goes Quiet',
      text: 'The house is finally quiet, and you have a whole hour to yourself. Honestly… how does that hour usually end?',
      options: [
        'I open it excited about my project, then leave with a new idea lovelier than the project itself — and fall asleep planning it.',
        "I actually work… but spend it all improving something nearly finished; arranging, polishing — never “done”.",
        'I tell myself to start with the important thing, and end up finishing many small ones — the important one never opened.',
        "It melts away on a “we need you for a minute” message or a sudden request; it becomes everyone's hour, not mine."
      ]
    },
    {
      scene: 'The Family Group Chat',
      text: "In the family WhatsApp group, you've been asked to organize an upcoming occasion — everyone certain you'd “never fall short”. What happens inside you?",
      options: [
        "I type “consider it done” within the minute… and feel its weight only after I hit send.",
        "I accept, and exhaust myself over the details until they're flawless — and any small remark cuts deeper than it should.",
        "I delay replying while knowing I'll accept; postponing has become my way of delaying the decision.",
        'I light up and propose ideas to make it a different kind of occasion… then my enthusiasm fades before the doing, and the load stays on me.'
      ]
    },
    {
      scene: 'The Paid Course',
      text: "You paid from your own money for a course or program and said: “this time it's serious”. Where did things end up?",
      options: [
        'I reached lesson three… then another course or idea sparkled, and the enthusiasm moved on.',
        "I replayed the same lesson more than once, not letting myself advance before “mastering” what came first.",
        'I postponed its first assignment; and the bigger the delay grew, the heavier opening the platform itself became.',
        "Every time I came back to it, someone's request got there first — someone used to me “never falling short”; my time is spent on everyone else first, and my course keeps waiting for my turn."
      ]
    },
    {
      scene: '11 P.M.',
      text: "Before sleep, you open Instagram and find a woman your age who launched a project just like the one in your head. What's the truest sentence that passes through you?",
      options: [
        "“Mine is more beautiful than this… but it's not ready, and I won't publish something unfinished for people to pick apart.”",
        "“I have far stronger ideas; the problem was never the ideas…” — and I open my overflowing notes as proof.",
        "I switch the phone off quickly; the sight of her brought a feeling too close — one I don't want to face tonight.",
        "“She has time for herself… my time is portioned out to everyone but me.” — and I keep scrolling, exhausted."
      ]
    },
    {
      scene: 'The Busy Season',
      text: 'A crowded season approaches — Ramadan, weddings, exams, work pressure. What happens to your own project?',
      options: [
        "No one asks whether I'm free; I'm simply handed the whole season, and my project is the first thing set aside.",
        "I say “after the season I'll start strong”; seasons have become postponed appointments giving birth to one another.",
        'I enter the season with one project… and leave it excited about a completely different one.',
        "I keep working on it in silence but show no one; “it's not the time, and it's not ready”."
      ]
    },
    {
      scene: "The New Year's Notebook",
      text: 'You have an elegant notebook — or notes on your phone — holding the plans of new years past. If you opened it now, what would it tell about you?',
      options: [
        'Five plans for five different projects, each begun with opening-day passion… and only the first page filled.',
        "One plan rewritten in “more precise” wording every time; planning itself became my project.",
        'A clear, excellent plan… whose very first step is exactly the one that never began.',
        'My goals written at the bottom of the page — after the lists for the house, the family, and the job.'
      ]
    },
    {
      scene: 'The Sentence That Rules You',
      text: 'If you listened closely to the deep voice that stops you every time, which sentence sounds most like it?',
      options: [
        "“If my work comes out lacking… I'm the one who comes out lacking in their eyes.”",
        "“If I open this door now, a feeling heavier than me will come through.”",
        "“If I commit to one thing, I bury every possible version of me.”",
        "“If I say no… the standing I've worked so hard for begins to shake.”"
      ]
    },
    {
      scene: 'Halfway Through',
      text: 'In the middle of any project comes the moment the shine fades. What does that moment do to you?',
      options: [
        "I read it as a sign the idea “isn't the one” — and suddenly believe my next idea is the right one.",
        'I read it as proof I must raise the standard even higher… before anyone sees it.',
        'I convert it into sensible busyness with lighter things, and postpone the heart of the project itself.',
        "I blame myself for the “indulgence”: enthusiasm is a luxury, and duties come first."
      ]
    },
    {
      scene: 'The Bitter Rest',
      text: 'You finally sit down to rest with no agenda — tea, quiet, no one asking for anything. From the inside… when does the rest break?',
      options: [
        "With the sense that someone might need me right now; I rest with “one ear awake”.",
        "With the memory of the unfinished thing; I don't know how to rest while something is “not quite right”.",
        "With a rest tinged by faint guilt: I know I'm resting from something I'm avoiding in the first place.",
        'With a new idea leaping into the quiet and setting my head alight; rest turns into a brainstorm.'
      ]
    },
    {
      scene: 'What They Say About You',
      text: 'Which sentence was said about you — and wronged you, because the one who said it never saw the whole story?',
      options: [
        "“You never finish anything” — and they never saw how many honest beginnings pull at me.",
        "“So complicated, such a perfectionist” — and they never felt that what shakes me is their judgment if a flaw shows.",
        "“Laziness and procrastination” — and they never knew how many times I came close… and withdrew from the weight behind the door.",
        "“Strong — nothing ever breaks her” — and they never noticed I break silently under everything I'm handed."
      ]
    },
    {
      scene: 'The Hidden Payoff',
      text: 'Every habit stays alive on a hidden payoff. If you were completely honest: what does this habit secretly buy you?',
      options: [
        "The moment of beginning gives me a new version of myself; I stay “promising”… without the final exam.",
        'As long as the work stays in my hands, no one has judged it; revising shields me from the hour of judgment.',
        'Every day of delay buys me a short truce from one heavy feeling.',
        "Every “yes” I give cements my place with them; exhaustion itself became a currency of love."
      ]
    },
    {
      scene: 'If You Were Honest With Yourself',
      text: 'Away from the grand plans: which small step, done this week, would make you feel you had been honest with yourself?',
      options: [
        'Return to one project I abandoned though it deserves better — and guard it from every new idea, for seven days only.',
        "Send a “good” version of my work to one person… before it becomes perfect.",
        'Open the file — or the message — I have been circling for weeks. Ten minutes, no more.',
        "Reserve one hour a week for myself alone, and let them know it's an appointment that “doesn't get cancelled”."
      ]
    }
  ],

  /* Runtime strings for quiz.js */
  t: {
    act1: 'Act One — Scenes From Your Day',
    act2: 'Act Two — The Voice No One Hears',
    scene: function (n, name) { return 'Scene ' + n + ' · ' + name; },
    markClosest: 'Closest to me',
    markSecond: 'Also like me',
    promptClosest: 'Choose the answer closest to you, then add a second one if it also feels like you.',
    promptSecond: 'Add a second answer if it also feels like you — it\'s your choice.',
    emailInvalid: 'Please enter a valid email address.',
    emailPreparing: 'Opening your reading and preparing your first report…',
    pctSign: '%',
    teaserColead: function (a, b) {
      return 'A rare result: two patterns share your lead this season — <b>' + a + '</b> and <b>' + b + '</b> are working together. Your full reading untangles this alliance.';
    },
    teaserHigh: function (pct) {
      return 'Your pattern is unusually clear — it appeared at <b>' + pct + '%</b>, a clarity few show. And alongside it, a hidden pattern works in the shadows… your full reading reveals it.';
    },
    teaserNormal: function (pct) {
      return 'Your dominant pattern appeared at <b>' + pct + '%</b> — with a hidden pattern working in the background. Your full reading reveals it, with your blend map and precise mirrors drawn from your own answers.';
    },
    hiddenColead: function (name, pct) {
      return '✦ A rare result: <b>' + name + '</b> shares your lead at ' + pct + '% — the two patterns are working together this season.';
    },
    hiddenNormal: function (name, pct) {
      return '✦ Your hidden pattern: <b>' + name + '</b> at ' + pct + '% — it works in the shadows when your dominant pattern tires.';
    },
    mirrorsHeading: 'Precise mirrors — from your own answers',
    mirrorEcho: function (name) {
      return 'The pattern “' + name + '” appeared again and again as your second choice without ever taking the lead — an echo accompanying your dominant pattern: it does not steer your decisions, but it colors them from behind.';
    },
    mirrorInner: 'Your outer day does not give you away — yet in “the inner voice” your answers were decisive. Your pattern lives in your silent decisions more than your visible behavior, which is why those around you never notice it.',
    mirrorOuter: 'Strikingly, your pattern shows in the details of your day more than your inner convictions admit — your body and your day know before your mind agrees.',
    mirrorSilent: function (name) {
      return 'Across twelve scenes you never once touched the pattern “' + name + '” — that door simply is not your battle. Do not spend your energy on advice written for another woman.';
    },
    pathHeading: 'Your path, by your pattern',
    pathIntro: 'Three stages of gradual depth — the series was developed through a method joining behavioral psychology, editorial analysis, and practical application exercises. The books are crafted in Arabic, the native voice of NizamOk.',
    cardLamhat: { label: 'Step 1 · Available now', title: 'Your Lamhat', desc: 'A focused reading of what is happening in your day right now: where you stall, and which behavior deceives you.', cta: 'Open Your Lamhat' },
    cardJuthur: { label: 'Step 2 · The deeper reading', title: 'Your Pattern Roots', desc: 'A book on the origin of the pattern: why it began, which feeling it protects, and why it returns.', cta: 'Read the Roots' },
    cardRebuild: { label: 'Step 3 · The practical shift', title: 'The Rebuild System', desc: 'A complete practical system that turns understanding into motion: stages, tools, and steps that fit your pattern.', cta: 'Begin the Rebuild' },
    price: function (v) { return v + ' SAR'; },
    soon: 'Coming soon',
    waitlistBanner: function (price) {
      return '<b>Your Interactive Pattern Board — coming soon.</b> A daily space that organizes your tasks and energy around your pattern, at a monthly subscription of ' + price + ' SAR at launch.';
    },
    waitlistCta: 'Join the Waiting List',
    interdashUrl: '/en/interdash/'
  },

  /* Runtime strings for main.js (ambient control + waitlist form) */
  mainUi: {
    ambient: {
      initial: 'Begin the sound journey',
      playing: 'Pause the sound',
      paused: 'Resume the sound'
    },
    waitlist: {
      invalid: 'Please enter a valid email address.',
      sending: 'Signing you up…',
      success: "You're on the list. We'll write to you when early access opens.",
      error: "We couldn't send that right now. Please try again in a moment."
    }
  }
};
