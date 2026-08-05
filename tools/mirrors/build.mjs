/*
  يولّد /mirrors/ وصفحات المرايا الثلاث من قالبٍ واحد وثلاثة ملفات محتوى.

      npm run build:mirrors

  ويتحقق من أن نصّ النتائج موجودٌ فعلًا في HTML المُخرَج: هذا هو الشرط الذي
  سقط في النموذج الأولي، ولا قيمة للمرايا بدونه.
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMirror, renderIndex } from './template.mjs';

import bidayat from './content/bidayat.mjs';
import irsal from './content/irsal.mjs';
import muhimma from './content/muhimma.mjs';
import naam from './content/naam.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'site', 'mirrors');
const ALL = [bidayat, irsal, muhimma, naam];

for (const m of ALL) {
  const html = renderMirror(m);

  for (const bad of ['undefined', 'null', 'NaN', '[object Object]']) {
    if (html.includes(`>${bad}<`)) throw new Error(`${m.slug}: القالب طبع «${bad}»`);
  }
  /* الشرط الأساسي: كل نتيجة وكل سؤال في HTML، لا في جافاسكربت. */
  for (const [d, r] of Object.entries(m.results)) {
    if (!html.includes(r.title)) throw new Error(`${m.slug}: نتيجة «${d}» ليست في HTML`);
    if (!html.includes(r.action)) throw new Error(`${m.slug}: حركة «${d}» ليست في HTML`);
  }
  for (const q of m.questions) {
    if (!html.includes(q.text)) throw new Error(`${m.slug}: سؤالٌ ليس في HTML`);
    for (const a of q.answers) if (!html.includes(a.text)) throw new Error(`${m.slug}: إجابةٌ ليست في HTML`);
  }
  for (const p of m.intro) if (!html.includes(p)) throw new Error(`${m.slug}: فقرة المقدمة ليست في HTML`);
  for (const i of m.interp) if (!html.includes(i.d)) throw new Error(`${m.slug}: تفسير آلية ليس في HTML`);

  const dir = join(ROOT, m.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  const words = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
  console.log(`wrote site/mirrors/${m.slug}/index.html   ${words} كلمة في HTML`);
}

mkdirSync(ROOT, { recursive: true });
writeFileSync(join(ROOT, 'index.html'), renderIndex(ALL), 'utf8');
console.log('wrote site/mirrors/index.html');
