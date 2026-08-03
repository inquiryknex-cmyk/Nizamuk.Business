/* The room the whole advertisement is shot in.
 *
 * Both picture tools stage against this: render-plates.mjs for the stills and
 * render-book.mjs for the page-turn sequence. It lives in one file because the
 * two have to be the SAME room — the film cuts between them, and a ground that
 * shifted by a few percent between shots would read as a lighting error.
 *
 * Same family as the end card in render-cards.mjs.
 */
export const SITE = '/home/user/Nizamuk.Business/site';

export const A = {
  cover: '/assets/product/mubdia/cover-og.jpg',
  seal:  '/assets/img/seal.png',
  p07:   '/assets/product/mubdia/p07.webp',   // خريطة المنعطفات الأربعة
  p08:   '/assets/product/mubdia/p08.webp',   // خريطة العبور
  p23:   '/assets/product/mubdia/p23.webp',   // تجربة الوصول
  p33:   '/assets/product/mubdia/p33.webp',   // خطة ٣٠ يومًا
  p36:   '/assets/product/mubdia/p36.webp'    // قوس ٩٠ يومًا
};

export const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'
};

/* Velvet ground, one warm key from upper right, vignette, and the mandala as
   texture at 4% — a mark used as ground, not as a logo. */
export const groundCss = (f, opts = {}) => `
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${f.w}px;height:${f.h}px;overflow:hidden}
  body{
    background:
      radial-gradient(70% 55% at 74% ${opts.keyY || 14}%, rgba(201,167,94,.22), transparent 62%),
      radial-gradient(90% 70% at 16% 94%, rgba(227,168,172,.09), transparent 62%),
      linear-gradient(150deg,#241C36 0%,#191325 58%,#120D1B 100%);
    position:relative;
  }
  .vig{position:absolute;inset:0;box-shadow:inset 0 0 ${Math.round(f.w * 0.16)}px rgba(0,0,0,.62);pointer-events:none;z-index:9}
  .ghost{
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:${opts.ghost || Math.round(f.w * 0.62)}px;height:${opts.ghost || Math.round(f.w * 0.62)}px;
    opacity:${opts.ghostOpacity || '.045'};filter:blur(.4px);
  }
  .ghost img{width:100%;height:100%;display:block}
`;

export const ghost = () => `<div class="ghost"><img src="${A.seal}" alt=""></div>`;
export const vignette = () => '<div class="vig"></div>';

/* A static-file server rooted at site/, so the pages have a real origin and the
   font URLs resolve without a <base> rewrite. Callers add their own routes. */
export const serveSite = async (port, routes) => {
  const { createServer } = await import('node:http');
  const { readFile } = await import('node:fs/promises');
  const { extname, join, normalize } = await import('node:path');
  const server = createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    const hit = routes(url);
    if (hit) { res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(hit); return; }
    try {
      const p = join(SITE, normalize(decodeURIComponent(url)));
      if (!p.startsWith(SITE)) { res.writeHead(403).end(); return; }
      const buf = await readFile(p);
      res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(buf);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  return server;
};
