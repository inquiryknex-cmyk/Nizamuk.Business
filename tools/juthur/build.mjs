/*
  يولّد /juthur/ وصفحات الكتب الأربع.

      npm run build:juthur

  ويتوقف إن غاب غلاف، أو إن سقط كتابٌ من الفهرس.
*/
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JUTHUR, PEEK } from './content.mjs';
import { renderIndex, renderBook } from './template.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'site');
const ROOT = join(SITE, 'juthur');

for (const b of JUTHUR) {
  for (const ext of ['jpg', 'webp']) {
    if (!existsSync(join(SITE, 'assets', 'covers', `${b.cover}.${ext}`))) {
      throw new Error(`${b.slug}: الغلاف غير موجود — ${b.cover}.${ext}`);
    }
  }
  for (const k of PEEK) {
    /* المصغَّرة وحدها تُنشر. والنسخة الكاملة لا تُرفع عمدًا: لو كانت على
       عنوانٍ عام لقُرئت الصفحة كاملةً، وهذا نقضُ الجولة لا إتمامها. */
    const f = join(SITE, 'assets', 'juthur', b.slug, `${k.file}-thumb.webp`);
    if (!existsSync(f)) throw new Error(`${b.slug}: صورة الجولة غائبة — ${k.file}-thumb.webp`);
  }
  const dir = join(ROOT, b.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderBook(b), 'utf8');
  console.log(`wrote site/juthur/${b.slug}/index.html`);
}

const idx = renderIndex();
for (const b of JUTHUR) {
  if (!idx.includes(`/juthur/${b.slug}/`)) throw new Error(`الفهرس لا يذكر ${b.slug}`);
}
mkdirSync(ROOT, { recursive: true });
writeFileSync(join(ROOT, 'index.html'), idx, 'utf8');
console.log(`wrote site/juthur/index.html  (${JUTHUR.length} كتب)`);
