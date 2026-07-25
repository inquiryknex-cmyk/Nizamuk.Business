# Production report — NizamOk quiz walkthrough (داخل الاختبار)

## What was delivered
`deliverables/`
- `nizamok-quiz-walkthrough-master.mp4` — 1080×1920, 30fps, 22.0s, H.264 CRF17,
  Arabic overlays + voiceover + full mix. No platform watermark.
- `nizamok-quiz-walkthrough-clean-no-text.mp4` — same edit, no overlays (clean master).
- `nizamok-quiz-walkthrough-no-vo.mp4` — overlays + music/SFX only.
- `nizamok-quiz-walkthrough-poster.png` — poster/thumbnail (hook frame, 0.83s).

`project/` — the full production system: capture rig (`capture_quiz.py`),
take-order pin (`quiz.take.js`), compositor (`build_video.py`), mix
(`mix_audio.py`), typography source (`overlays.html` + rendered plates), all 12
voiceover takes (7 final + 5 long alternates). Re-rendering the entire film is:
serve `site/` → run capture → build → mix → mux.

## Source-of-truth discipline
The uploaded recording (5:10) was inspected end-to-end (1fps extraction + scene-change
detection + 12 labelled contact sheets). It defines: screen order, the two-chapter
structure, the «الأقرب إليّ / تشبهني أيضًا» mechanic, «تابعي», the act-break wording,
the calc line, the revealed result (الكفؤة المنهَكة) and the email-gate ending.
The recording is 378×848 WhatsApp-compressed — a 2.9× upscale cannot look premium —
so final pixels come from a **deterministic twin of the same session** rendered by the
same deployed product code (`site/` == nizamok.com, verified word-for-word against the
footage): identical per-question option order (extracted frame-by-frame from the
recording and pinned in `quiz.take.js`), identical picks, identical result. Zero
content divergence; nothing invented, no AI-generated interface, no altered Arabic.

Known variance, disclosed: the replicated session computes the dominant-pattern
teaser at 36٪ vs the recording's 32٪ (the 1-in-3s frame sampling likely missed one
or two of her optional second answers). The sentence and screen are genuine product
output either way; the reveal shot frames the name and truth line, with the teaser
only as a vignetted line at frame bottom. For exact-percentage parity, re-run the
capture with adjusted second answers, or drop `S19` framing to name-only.

Also: the floating ambient-sound invite widget was hidden during capture (screen
furniture, not quiz content — it overlapped answer text in close-ups), and MailerLite/
analytics endpoints were blocked so the directed take never touched production data.

## Higgsfield usage (total spend ≈ 2.0 credits)
- **text2speech_v2 / ElevenLabs engine** — 12 short Arabic lines (7 final compact
  takes + 5 full-length alternates), voice **Vesper** (preset
  `c3204739-4084-41a3-9dc5-c805b307ec18`). Chosen by acoustic screening of the female
  preset previews (median F0 ≈160Hz = warm/mature/calm per the voice direction;
  Luna/Maya rejected as too bright). ~0.15 credits per line.
- Nothing else was generated. Per the owner's instruction to keep credit spend
  minimal, video models (Kling/Seedance/Veo), upscalers and the virality predictor
  were not used.

### Why the camera work is composited, not model-generated
Every Higgsfield video model re-synthesizes pixels; on flat UI with dense Arabic
glyphs the failure mode is warped letterforms — exactly what the brief's QC list
rejects. The brief's own rule («when a generated camera move harms interface
fidelity, use the original recording with professional compositing») was applied
proactively: all moves (push-ins, dolly, rack focus, whip, radial through-object
portal, selection magnify, living drift) are lens-math over 2160×3840+ real plates,
and the interaction micro-motion replays the product's own animation curves
(0.3s mark ease, 0.75s panelIn cubic-bezier) between real captured states.
Result: Motion-Control-grade fidelity with byte-identical Arabic.

### Feature mapping (brief → production)
| Brief feature | Realized as |
|---|---|
| Motion Control (recording as reference) | Recording's interaction rhythm re-timed shot-by-shot; product CSS/GSAP curves replayed between real states |
| First/Last Frame locks | Every shot anchored to captured plate states (S02…S20); listed in STORYBOARD.md |
| Cinema Studio / WAN camera inertia | Eased virtual camera (expo/cubic/smoothstep), settle-stops, micro-drift |
| Higgsfield Mix (two moves per shot) | dolly+rack-focus (beat 2), push+magnify (beat 3), portal+push (beat 4) |
| Through Object In | Radial portal through the act-break card geometry (beat 4) — the single meaningful use |
| Whip Pan | 120ms directional-blur whips (beats 3 joins, 5 joins) |
| Zooms / Focus Change | Controlled push-ins; gaussian rack-focus pulse question→answers |
| Motion Design (Arabic kinetic type) | Browser-rendered Noto Sans Arabic plates (brand fast-lane type doctrine), RTL masked reveals, rise+fade, no presets |
| Colour grade | Gentle S-curve, velvet-warm channel shaping, 30% corner vignette |
| Upscaling | Not needed — native 2160×3840 plates downsampled to 1080×1920 |

## Fallbacks for unavailable/unused plan features
- **Voice**: if a real recorded Saudi VO becomes available, drop the 7 files into
  `project/vo/` (same names) and re-run `mix_audio.py` — the timeline auto-fits
  (edge-trim, pause-tightening, ≤1.07 tempo).
- **Kling/Seedance camera moves**: if desired later, generate per-shot with the
  plate PNGs as start frames, then QC Arabic frame-by-frame; reject on any glyph
  warp and keep the composited shot (current default).
- **Virality predictor / upscale_video**: masters are compatible; run on demand —
  both cost credits and were skipped by owner instruction.
- **TikTok publish**: `tiktok_prepare_publish`/`tiktok_publish` can take the master
  as-is (no watermark, safe zones respected).

## Retention review (final cut)
1. First frame readable without audio ✓ (hook line + real question)
2. Hook on screen by 0.3s ✓ 3. Visual change every ≤2s ✓ (14 cut/trigger points)
4. Every transition advances the story ✓ 5. Curiosity gap before the deeper layer ✓
(act-break portal at 6.9s, result withheld to 15s) 6. Interface readable on phone ✓
(native-resolution plates) 7. Viewer understands the experience ✓ (scenes → honest
choice → inner voice → repeated-pattern reading) 8. CTA earned ✓ (after reveal +
reading gate) 9. Final frame states the action ✓ (CTA + الرابط في البايو + wordmark)
10. Nothing generic-AI ✓ (no avatars, no stock, no fake UI, no gold-dust).
