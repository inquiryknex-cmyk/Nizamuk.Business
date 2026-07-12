# Deploying nizamok.com

The site is fully static (vanilla HTML/CSS/JS + GSAP — no framework).
Everything deployable lives in `site/`. `wrangler.toml` at the repo root
carries the Pages config (`pages_build_output_dir = "site"`).

## Cloudflare Pages — exact settings

| Setting | Value |
|---|---|
| Repository | `inquiryknex-cmyk/Nizamuk.Business` |
| Production branch | `main` |
| Framework preset | **None** (static HTML) |
| Build command | `npm run build` *(validation only — or leave empty)* |
| Build output directory | `site` |
| Root directory | `/` (repo root — leave empty) |
| Environment variables | **none required** |
| Deploy command (CLI alt.) | `npx wrangler pages deploy site --project-name nizamok` |

Routing: every page is a real directory (`/`, `/ikhtibar/`, `/interdash/`,
`/privacy/`, `/terms/`, `/refund/`) so refreshes can never 404 — no SPA
fallback needed. `site/_redirects` maps the short alias `/quiz` → `/ikhtibar/`
(301). `site/404.html` is the branded not-found page. `site/_headers` sets
asset caching.

After the first deploy: add the custom domain `nizamok.com` under the
project's Custom Domains.

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
