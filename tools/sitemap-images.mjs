/*
  خريطة الصور: إضافة صور المنتج إلى sitemap.xml.

  لماذا نحتاجها هنا تحديدًا. معرض صفحات الكتاب يخفي كل لقطة حتى يتأكد
  السكربت أن ملفها موجود، ويضع الرابط في `data-src` لا في `src`. هذا
  يحمي الصفحة من معرض فارغ، لكنه يجعل الصور بعيدة عن متناول فهرس صور
  Google، لأنها لا تظهر في HTML الساكن ولا داخل قسم مرئي.

  خريطة الصور هي الأداة الرسمية لهذه الحالة بالضبط: تُعلن الصور مباشرة
  بمعزل عن طريقة عرض الصفحة لها.

  ولماذا يستحق الأمر العناء. نملك 52 لقطة أصلية من داخل الكتب لا يملكها
  أحد غيرنا، وبحث الصور قناة لا تلمسها ملخصات الذكاء الاصطناعي.

  الاستخدام: npm run sitemap:images
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://nizamok.com';
const NS = 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';

const BOOKS = ['mubdia', 'asirat', 'mutafadia', 'kafua'];
/* اسم المجلد في assets/product لا يطابق دائمًا اسم المسار في /rebuild. */
const ASSET_DIR = { mubdia: 'mubdia', asirat: 'asirat', mutafadia: 'mutafadia', kafua: 'kafua' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/* اللقطات موصوفة في HTML المبني: alt هو الوصف، data-src هو الملف. */
function shotsFor(slug) {
  const html = fs.readFileSync(path.join(ROOT, 'site', 'rebuild', slug, 'index.html'), 'utf8');
  const out = [];
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const src = (tag.match(/data-src="([^"]+)"/) || [])[1];
    if (!src || !src.includes('/assets/product/')) continue;
    const alt = (tag.match(/alt="([^"]*)"/) || [])[1] || '';
    /* نعلن النسخة الكاملة لا المصغّرة: بحث الصور يفضّل الأكبر. */
    const full = src.replace(/-thumb\.webp$/, '.webp');
    const onDisk = fs.existsSync(path.join(ROOT, 'site', full.replace(/^\//, '')));
    out.push({ loc: SITE + (onDisk ? full : src), title: alt });
  }
  /* الغلاف قد يتكرر بين البطاقة والمعرض. */
  const seen = new Set();
  return out.filter(s => !seen.has(s.loc) && seen.add(s.loc));
}

const sitemapPath = path.join(ROOT, 'site', 'sitemap.xml');
let xml = fs.readFileSync(sitemapPath, 'utf8');

/* إعادة التوليد تعني حذف ما أضفناه سابقًا أولًا، وإلا تراكمت النسخ. */
xml = xml.replace(/<image:image>[\s\S]*?<\/image:image>/g, '');
if (!xml.includes(NS)) {
  xml = xml.replace('<urlset ', `<urlset ${NS} `);
}

let total = 0;
for (const slug of BOOKS) {
  const shots = shotsFor(slug);
  if (!shots.length) { console.warn(`لا لقطات لـ ${slug}`); continue; }
  total += shots.length;

  const block = shots.map(s =>
    `<image:image><image:loc>${esc(s.loc)}</image:loc>` +
    (s.title ? `<image:title>${esc(s.title)}</image:title>` : '') +
    `</image:image>`).join('');

  const urlLoc = `${SITE}/rebuild/${slug}/`;
  const re = new RegExp(`(<url><loc>${urlLoc.replace(/[/.]/g, '\\$&')}</loc>[\\s\\S]*?)(</url>)`);
  if (!re.test(xml)) { console.warn(`الرابط غير موجود في الخريطة: ${urlLoc}`); continue; }
  xml = xml.replace(re, `$1${block}$2`);
  console.log(`${slug.padEnd(11)} ${shots.length} صورة`);
}

fs.writeFileSync(sitemapPath, xml);
console.log(`\nالمجموع: ${total} صورة في site/sitemap.xml`);
