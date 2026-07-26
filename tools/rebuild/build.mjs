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
import { renderPage } from './template.mjs';

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
