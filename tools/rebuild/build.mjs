/*
  يولّد صفحات /rebuild/<slug>/index.html الأربع من قالب واحد + ملف محتوى لكل نمط.

      npm run build:rebuild

  المخرَج HTML ثابت يُحفظ في المستودع؛ الموقع لا يحتاج خطوة بناء وقت التشغيل.
  شغّلي الأمر بعد أي تعديل على القالب أو على أي ملف محتوى، وأدرجي الصفحات
  الناتجة في نفس الـ commit.
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, renderIndex } from './template.mjs';

import mubdia from './content/mubdia.mjs';
import asirat from './content/asirat.mjs';
import kafua from './content/kafua.mjs';
import mutafadia from './content/mutafadia.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'site', 'rebuild');

for (const p of [mubdia, asirat, kafua, mutafadia]) {
  const dir = join(ROOT, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderPage(p), 'utf8');
  console.log('wrote site/rebuild/' + p.slug + '/index.html');
}

/* الفهرس: /rebuild/ كانت تعطي 404 بينما صفحاتها الأربع منشورة. */
{
  const ALL = [mubdia, asirat, mutafadia, kafua];
  const html = renderIndex(ALL);
  for (const p of ALL) {
    if (!html.includes(`/rebuild/${p.slug}/`)) throw new Error(`الفهرس لا يذكر ${p.slug}`);
  }
  writeFileSync(join(ROOT, "index.html"), html);
  console.log(`wrote site/rebuild/index.html  (${ALL.length} أنظمة)`);
}
