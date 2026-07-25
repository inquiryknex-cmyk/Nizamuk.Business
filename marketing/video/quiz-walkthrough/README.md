# NizamOk — «جولة داخل اختبار نظامك» (guided quiz walkthrough)

Calm, premium product demo: 1080×1920 @ 30fps, **62.4s**, no voiceover.
Directives, pointers and written explanations carry the whole experience.

## Deliverables
| File | Use |
|---|---|
| `deliverables/nizamok-quiz-walkthrough-v4.mp4` | Master |
| `deliverables/nizamok-quiz-walkthrough-v4-poster.png` | Poster / thumbnail |

## Structure — seven explained steps
Each step carries a counter (`01 / 07`), a kicker line, a headline, and an ivory
explanation card («التجربة خطوة بخطوة» + a question and its answer). Then the
real interaction plays out on the phone with dotted gold pointers, highlight
rings and soft tap indications.

1. **عيشي المشهد** — ماذا يحدث هنا؟ Twelve scenes written from her real day.
2. **اختاري بصدق** — كيف تختارين؟ The closest answer, not the nicest one.
3. **الإجابة الثانية** — لماذا إجابتان؟ Optional, and it auto-advances.
4. **تقدّمكِ** — أين أنتِ الآن؟ The golden progress line, chapter and scene number.
5. **الفصل الثاني** — ما الفرق؟ From visible situations to the inner voice.
6. **اكتمال الصورة** — كيف تُقرأ إجاباتكِ؟ The result is built on what repeats.
7. **قراءتكِ وتقريركِ** — وماذا بعد؟ Instant result, then the free first report.

## Motion & sound doctrine
- Scroll ramps 2.6–2.8s on a quintic slow-in/slow-out; every step holds.
- **No click anywhere.** A tap is a 90ms breath of air with no transient; marks
  are slow-attack warm tones. Sub pulse at 46 BPM. Brand ambient carries the bed.
- Phone view is full-size and readable throughout (no aggressive zooming).

## Sources
Interface: pixel-true 2160×3840 plates of the deployed quiz (`site/`) replaying
the uploaded recording's session — same option order, same picks, same result
(الكفؤة المنهَكة). No AI model ever touches the Arabic or the UI.
Higgsfield: backdrop still (`soul_2`) + ambient motion (`kling3_0_turbo`),
diffused into a quiet velvet field — `project/backdrop-higgsfield.mp4`.

## Re-render
Serve `site/` on :8807 → `capture_quiz.py` → `build_video_v4.py` →
`mix_audio_v4.py` → mux. Captions and cards live in `overlays3.html`.

Publish note: keep the quiz link in bio — the end card says «الرابط في البايو».
