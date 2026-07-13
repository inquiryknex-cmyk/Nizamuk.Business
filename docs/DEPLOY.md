# Deploying nizamok.com

The site is fully static (vanilla HTML/CSS/JS + GSAP — no framework).
Everything deployable lives in `site/`. Deployment is **Cloudflare Workers
Static Assets** (assets-only Worker, no server script), driven by the
Workers Git integration. `wrangler.toml` at the repo root carries the config.

## Cloudflare Workers (Static Assets) — exact settings

| Setting | Value |
|---|---|
| Repository | `inquiryknex-cmyk/Nizamuk.Business` |
| Production branch | `main` |
| Build command | `npm run build` *(validation only — confirms all pages/assets exist)* |
| Deploy command | `wrangler deploy` |
| Root directory | `/` (repo root — leave empty) |
| Static-assets output directory | `site` (set via `[assets] directory = "./site"`) |
| Environment variables | **none required** |

`wrangler.toml`:

```toml
name = "nizamok"
compatibility_date = "2026-07-01"
preview_urls = true
workers_dev = true

[assets]
directory = "./site"
not_found_handling = "404-page"
```

Routing (verified against the local Workers runtime, `wrangler dev`):
- `/`, `/ikhtibar/`, `/interdash/`, `/privacy/`, `/terms/`, `/refund/` →
  each a real directory served as `index.html` → **200**, so a refresh on
  any of them can never 404.
- `/quiz` and `/quiz/` → **301 → /ikhtibar/** via `site/_redirects`.
- Unknown URLs → **404** serving the branded `site/404.html`
  (`not_found_handling = "404-page"`).
- `site/_headers` sets asset caching (honored by Workers Static Assets).

`_headers` and `_redirects` must stay **inside `site/`** — that is the assets
directory Workers reads. Do not move them to the repo root.

## Canonical domain — apex `nizamok.com`

The single canonical production host is **`https://nizamok.com`** (apex). All
in-repo canonical tags, Open Graph / Twitter URLs, `sitemap.xml`, `robots.txt`,
and the email dashboard link use the apex domain.

After the first deploy:
1. Add the custom domain **`nizamok.com`** (apex) to the Worker as the primary host.
2. Add **`www.nizamok.com`** as well.
3. Configure a **Cloudflare Bulk Redirect** (host-level redirects are not
   expressible in `site/_redirects` on Workers):
   - Source hostname: `www.nizamok.com`
   - Target: `https://nizamok.com`
   - Status: **301 Permanent Redirect**
   - Preserve query string: **enabled**
   - Subpath matching: **enabled**
   - Preserve path suffix: **enabled**
   - So `https://www.nizamok.com/ikhtibar/?source=email` → `https://nizamok.com/ikhtibar/?source=email`.
4. Verify: `curl -sI https://www.nizamok.com/` → `301`, `location: https://nizamok.com/`;
   `curl -sI https://nizamok.com/` → `200`.
5. After both hosts serve valid HTTPS and the redirect is verified, set
   `workers_dev = false` (retire the public `*.workers.dev` route) and only then
   consider enabling **HSTS** at Cloudflare (do not enable HSTS preload initially).

## Go-live checklist

- [ ] Drop the 12 cover JPGs into `site/assets/covers/` (names in that folder's README).
- [ ] Drop the mandala seal at `site/assets/img/seal.png`.
- [ ] MailerLite: create the 4 per-pattern quiz forms + 1 waitlist form, paste
      their form-action URLs into `site/assets/js/config.js`, set `enabled: true`.
- [ ] Keep the free-report PDFs available at `/reports/…` (paths in config.js),
      or copy them into `site/reports/`.
- [ ] The Interdash film is already at `site/assets/video/interdash.mp4`
      (16.5 MB, faststart — streams progressively; within the 25 MiB Pages limit).
- [ ] Existing legal pages (`/privacy/`, `/terms/`, `/refund/`) must be carried
      over — the new footer links to them.
