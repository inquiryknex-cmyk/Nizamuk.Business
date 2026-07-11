# Deploying nizamok.com

The site is fully static — everything lives in `site/`.

## Cloudflare Pages (recommended, matches current setup)

Dashboard route:
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Repository: `inquiryknex-cmyk/Nizamuk.Business`, production branch: `main`.
3. Build command: *(leave empty)* · Build output directory: `site`.
4. Add the custom domain `nizamok.com` under the project's Custom Domains.

CLI route (Wrangler):
```bash
npx wrangler pages deploy site --project-name nizamok
```

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
