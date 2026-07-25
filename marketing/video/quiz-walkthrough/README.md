# NizamOk — «جولة داخل اختبار نظامك» (quiz walkthrough demo)

Step-by-step product demo, 1080×1920 @ 30fps, 34.6s. No voiceover — Arabic
captions, step chips, gold pointers, highlight rings and tap ripples carry the
instruction. Built for TikTok first, then Reels/Shorts.

## Deliverables
| File | Use |
|---|---|
| `deliverables/nizamok-quiz-walkthrough-v2.mp4` | Master — captions + music/SFX |
| `deliverables/nizamok-quiz-walkthrough-v2-clean-no-text.mp4` | Clean plate, no captions |
| `deliverables/nizamok-quiz-walkthrough-v2-poster.png` | Poster / thumbnail |

## The seven demonstrated steps
1. **اقرئي المشهد** — a real scene from her day, arrow to the question.
2. **اختاري الأقرب إليكِ** — tap ripple on the real answer, gold «الأقرب إليّ» mark appears, highlight ring holds.
3. **أضيفي إجابة ثانية — اختياري** — second tap, rose «تشبهني أيضًا» mark, callout «اختيارُها ينقلكِ تلقائيًا», real auto-advance.
4. **تابعي خطّ تقدّمكِ الذهبي** — ring on the live progress line and scene counter.
5. **بعد ٦ مشاهد… تدخلين صوتكِ الداخلي** — the real chapter-break card, tap into chapter two.
6. **نمطكِ الغالب — ومعه نمط خفي** — calculating screen → the real result (الكفؤة المنهَكة) with «النتيجة فورية» callout.
7. **ضعي بريدكِ — يصلكِ تقريركِ الأول مجانًا** — arrow + ring on the real email field, then the CTA end card.

## Sources
Interface: pixel-true 2160×3840 plates of the deployed quiz (`site/`) replaying
the uploaded recording's exact session — same option order, same picks, same
result. No AI touches the Arabic or the UI. Backdrop: one Higgsfield image +
`kling3_0_turbo` ambient motion clip (`project/backdrop-higgsfield.mp4`),
ping-pong looped. Audio: brand ambient master + synthesized UI accents.
Total Higgsfield spend for this version ≈ 9 credits.

## Re-render
Serve `site/` on :8807 → `capture_quiz.py` → `build_video_v2.py` →
`mix_audio_v2.py` → mux. Captions live in `overlays2.html`.

Publish note: keep the quiz link in bio — the end card says «الرابط في البايو».
