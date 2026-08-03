/*
  يولّد صفحات /lamhat/<slug>/index.html الأربع من قالب واحد + ملف محتوى لكل نمط.

      npm run build:lamhat

  المخرَج HTML ثابت يُحفظ في المستودع؛ الموقع لا يحتاج خطوة بناء وقت التشغيل.
  شغّلي الأمر بعد أي تعديل على القالب أو على أي ملف محتوى، وأدرجي الصفحات
  الناتجة في نفس الإيداع.
*/
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './template.mjs';

import mubdia from './content/mubdia.mjs';
import asirat from './content/asirat.mjs';
import kafua from './content/kafua.mjs';
import mutafadia from './content/mutafadia.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', '..', 'site');
const ROOT = join(SITE, 'lamhat');

let quoted = 0;
for (const p of [mubdia, asirat, kafua, mutafadia]) {
  /* الغلاف يُشار إليه بالاسم لا يُولَّد، فغيابه يجب أن يكسر البناء لا أن يمرّ
     صامتًا إلى صفحةٍ منشورة بصورةٍ مفقودة. */
  for (const img of [p.cover, p.coverJpg]) {
    if (!existsSync(join(SITE, img.replace(/^\//, '')))) {
      throw new Error(`${p.slug}: الغلاف غير موجود — site${img}`);
    }
  }

  const dir = join(ROOT, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderPage(p), 'utf8');

  const hasQuotes = Array.isArray(p.passages) && p.passages.length > 0;
  if (hasQuotes) quoted++;
  console.log(
    'wrote site/lamhat/' + p.slug + '/index.html' +
    (hasQuotes ? `  (${p.passages.length} اقتباسًا من الكتاب)` : '  (بلا اقتباسات — الملف لم يُرفع بعد)')
  );
}

if (quoted < 4) {
  console.log(`\nملاحظة: ${quoted} من ٤ صفحات تقتبس الكتاب حرفيًا.`);
  console.log('البقية تعرض بنية اللمحة بدل الاقتباس، عمدًا: لا تُنسب إلى كتابٍ جملةٌ لم تُقرأ فيه.');
  console.log('حين يصل ملف أي لمحة، أضيفي passages في ملف محتواها ثم أعيدي البناء.');
}
