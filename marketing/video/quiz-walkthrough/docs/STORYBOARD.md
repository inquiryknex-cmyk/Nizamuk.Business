# «داخل الاختبار» — NizamOk quiz walkthrough (9:16, 22.0s, 30fps)

**Source of truth:** the real quiz recording `WhatsApp Video 2026-07-25 at 1.16.03 PM.mp4`
(5:10, 378×848). Every screen, question, mechanic, selection behaviour and the shown
result (الكفؤة المنهَكة) come from that session. Final pixels are a deterministic
high-resolution twin of the same deployed product (`site/` == nizamok.com) re-rendered
at 2160×3840+ with the recording's exact per-question option order and picks
(see `project/capture_quiz.py`, `project/quiz.take.js`).

## Beat map

| Beat | Time | Shot / camera | Source frames | Arabic overlay | VO |
|---|---|---|---|---|---|
| 1 — Scroll stop | 0.00–1.30 | Rapid push-in (ease-out-expo, zoom 3.1→2.05) that *stops* on the Scene-1 question «هدأ البيت أخيرًا، وصارت عندكِ ساعة كاملة لكِ وحدكِ…» | Plate S02 (Scene 1 fresh) | «مو اختبار شخصية **عادي**.» + «لأنه ما يسألكِ: من أنتِ؟» (0.55s) | «مو اختبار شخصية عادي.» |
| 2 — Real-life scenes | 1.30–4.20 | Vertical/diagonal dolly from question to the four answers (zoom 2.05→1.50) with mid-travel rack-focus pulse | Plate S02 | «يضعكِ داخل مواقف تشبه يومكِ فعلًا.» | «يمرّركِ على مواقف تشبه يومكِ فعلًا.» |
| 3 — The choice | 4.20–6.90 | 120ms whip → Scene-2. Tap ⓐ 4.75s: gold «الأقرب إليّ» mark (real 0.3s CSS curve) + **+11% magnify** on the chosen card; tap ⓑ 5.75s: rose «تشبهني أيضًا»; 6.15s auto-advance (real 0.75s panelIn bezier) into Scene 3 | Plates S05 → S05b → S05c → S06 | «وتختارين **اللي يصير فعلًا**…» + «مو اللي تتمنين يصير.» | «تختارين اللي يصير فعلًا… مو المثالي.» |
| 4 — Deeper layer | 6.90–10.60 | Arrive wide on the act-break card → slow push on the calligraphic line «انتهت المشاهد التي يراها الجميع…» → **through-object portal**: radial wipe from card centre into Scene 7 (inner voice) | Plates S10 → S11 | «ثم ينتقل من اللي يشوفه الناس…» + «إلى **صوتكِ الداخلي**.» (blush) | «وبعدين… ينتقل لصوتكِ الداخلي.» |
| 5 — The pattern forms | 10.60–13.70 | Accelerated succession, constant downward motion, whip-blur joins: Scene 8 (منتصف الطريق) → Scene 10 (كلامهم عنكِ) → Scene 11 (المكسب الخفي); golden progress line advances 8→11 of 12 | Plates S13, S15, S16 | «ما يقرأ إجابة واحدة.» → «يقرأ **الشيء اللي يتكرر** بينها كلها.» | «النتيجة تنبني على الشيء اللي يتكرر.» |
| 6 — Completion | 13.70–17.20 | Calc screen (seal + «نقرأ مزيجكِ عبر الأنماط الأربعة…») slow push → luminous mix → reveal dolly-in settling on «نمطكِ الغالب / **الكفؤة المنهَكة**» + truth line | Plates S18 → S19 | «وبعد آخر مشهد… تبدأ قراءتكِ.» | «وبعد آخر مشهد… تبدأ قراءتكِ.» |
| 7 — Conversion | 17.20–22.00 | Email-gate screen as living background (soft blur, 62% dim, barely-perceptible drift zoom 1.28→1.40) | Plate S20 | «يمكن **3 دقائق** تفسّر شيئًا يتكرر معكِ **من سنوات**.» + CTA pill «ابدئي اختبار نمطكِ المجاني» + «الرابط في البايو»; wordmark final 0.7s | «يمكن ثلاث دقائق تفسّر اللي يتكرر معكِ من سنوات.» |

## First/last-frame references per moving shot
- Hook: first = tight crop q1 question (zoom 3.1), last = settled zoom 2.05 same anchor.
- Scenes: first = hook's last frame; last = options block centred (zoom 1.50).
- Choice: first = S05 fresh; states S05b (closest) / S05c (both) mixed on the product's
  own 0.3s mark curve; last = S06 rising on the product's 0.75s panelIn bezier.
- Portal: first = act-break wide (zoom 1.08); mid-hold = calligraphy line (1.56);
  last = Scene-7 question settled (1.60) via radial mask.
- Pattern: per segment, first = question above centre (zoom 1.78), last = question
  below centre (1.60) — constant downward vector across cuts.
- Completion: first = calc seal (1.16); last = reveal name+truth (1.84).
- Convert: first = email H2 low in frame; last = drifted +50px, zoom 1.40.

## Cut triggers (interface actions as editorial triggers)
1.30 hook settles → travel; 4.75 closest tap; 5.75 second tap; 6.15 auto-advance;
6.90 chapter end; 9.35 portal opens; 11.75 / 12.80 scene changes; 13.70 last answer →
calc; 14.75 reveal; 17.20 reading gate; 21.15 brand sign-off.

## Safe zones
No essential text below y=1670 (bottom 250px kept clear); overlays centred with
≥110px side margins clear of TikTok's right icon rail; wordmark ends y≈1657.
