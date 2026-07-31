# Book covers

Drop the final cover images here with these exact filenames (JPG, ~900×1200px,
under 300 KB each if possible). Until a file exists, the site shows an elegant
CSS fallback cover in the correct tier color, so nothing breaks.

| File | Book |
|------|------|
| `lamhat-mubdia.jpg` | لمحات — المبدعة المشتّتة (green) |
| `lamhat-asira.jpg` | لمحات — أسيرة الكمال (green) |
| `lamhat-mutafadiya.jpg` | لمحات — المتفادية الذكية (green) |
| `lamhat-kafua.jpg` | لمحات — الكفؤة المنهكة (green) |
| `juthur-mubdia.jpg` | جذور نمطك — المبدعة المشتّتة (burgundy) |
| `juthur-asira.jpg` | جذور نمطك — أسيرة الكمال (burgundy) |
| `juthur-mutafadiya.jpg` | جذور نمطك — المتفادية الذكية (burgundy) |
| `juthur-kafua.jpg` | جذور نمطك — الكفؤة المنهكة (burgundy) |
| `rebuild-mubdia.jpg` | إعادة البناء — المبدعة المشتّتة (plum) |
| `rebuild-asira.jpg` | إعادة البناء — أسيرة الكمال (plum) |
| `rebuild-mutafadiya.jpg` | إعادة البناء — المتفادية الذكية (plum) |
| `rebuild-kafua.jpg` | إعادة البناء — الكفؤة المنهكة (plum) |

## Where they appear

- `lamhat-*.jpg` — the لمحات card grid on `/` and `/en/`.
- `rebuild-*.jpg` — the نظام إعادة البناء band on `/` (`#rebuild`).
- `juthur-*.jpg` — not wired to a grid yet; جذور still uses the CSS mini cover.

Cache-busted with `?v=N` in the markup. **Bump that number whenever you replace
a file**, or returning visitors keep seeing the old cover.

## Brand rules a cover must follow

The four `rebuild-*.jpg` files currently in this folder are typographic
placeholders. The final art replaces them at the same filenames. Whoever
produces that art has to match the identity the site already ships, because a
cover that disagrees with the header reads as a different company:

1. **Wordmark — use `/assets/img/wordmark.png`, do not redraw it.** The real
   wordmark is a connected italic script: «Nizam» in muted lavender-grey,
   «OK» in gold, with the K's tail sweeping up and to the right. A Times /
   serif «NizamOk» set in a text field is not the wordmark.
2. **Capitalisation is `NizamOk`** — one capital N, one capital O, lowercase k.
   Not `NizamOK`, not `NIZAMOK`. Keep it identical on all four covers.
3. **Seal — use `/assets/img/seal.png`, do not redraw it.** The real seal is a
   gold circular medallion with «نظامك» in Arabic calligraphy at its centre and
   «علم النفس والتطوير الذاتي» beneath. A mandala with a Latin «N», a leaf, or
   an empty centre is not the seal.
4. **One brand block per cover.** Seal above wordmark, centred, top of the
   cover — the same stacking as the site header. Do not print the seal on one
   cover and omit it on another.
5. **Footer lockup** reads «نظامك» then «علم النفس والتطوير الذاتي» — spelled
   exactly that way. (`التفس` for `النفس` is the typo to watch for.)
6. **Palette** stays inside the house tokens: `--gold #C9A75E`,
   `--gold-soft #E6D3A3`, `--gold-deep #A6813C`, ivory `#F8F1E3`, and the tier
   colour for the band — plum `--tier-rebuild #35244D` for إعادة البناء. Cover
   art may lean warmer or cooler per pattern, but gold and ivory carry the type.
7. **Legibility at 255px wide.** The card grid renders these small. The pattern
   name must survive that; long body copy on the cover will not, so leave the
   selling text to the page.
