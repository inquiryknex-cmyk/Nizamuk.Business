/*
  IndexNow — إشعار فوري لمحركات البحث بأن صفحة جديدة أو محدَّثة موجودة.

  تدعمه Bing وYandex وSeznam ومحركات أخرى، ولا تدعمه Google، فهذه أداة
  لنصف المعادلة لا لكلها. الفائدة أن الصفحة تدخل فهرس Bing خلال ساعات
  بدل أسابيع الانتظار، وهو أسرع مصدر ملاحظات على العناوين والأوصاف.

  كيف يعمل: نستضيف ملف مفتاح على جذر الموقع، ثم نرسل قائمة الروابط مع
  المفتاح نفسه. يجلب المحرّك ملف المفتاح ليتأكد أن من أرسل يملك النطاق.

  الاستخدام:
    npm run indexnow                 كل روابط sitemap.xml
    npm run indexnow -- <url> [url]  روابط بعينها، وهو الأفضل بعد نشر مقال

  ملاحظة: لا ترسلي القائمة كاملة كل يوم بلا سبب. IndexNow للتغييرات،
  والإرسال المتكرر بلا تغيير قد يُقرأ إساءةَ استخدام.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'nizamok.com';
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

/* المفتاح هو اسم الملف الموجود في site/، فلا يمكن أن يختلف الاثنان. */
function readKey() {
  const f = fs.readdirSync(path.join(ROOT, 'site'))
    .find(n => /^[0-9a-f]{8,128}\.txt$/.test(n));
  if (!f) throw new Error('لا يوجد ملف مفتاح IndexNow في site/');
  const key = path.basename(f, '.txt');
  const body = fs.readFileSync(path.join(ROOT, 'site', f), 'utf8').trim();
  if (body !== key) throw new Error(`محتوى ${f} لا يطابق اسمه، وهو شرط التحقق`);
  return key;
}

function urlsFromSitemap() {
  const xml = fs.readFileSync(path.join(ROOT, 'site', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

const key = readKey();
const args = process.argv.slice(2).filter(a => a.startsWith('http'));
const urlList = args.length ? args : urlsFromSitemap();

const wrong = urlList.filter(u => new URL(u).hostname !== HOST);
if (wrong.length) {
  console.error('روابط خارج النطاق، وIndexNow يرفض الدفعة كلها بسببها:');
  wrong.forEach(u => console.error('  ' + u));
  process.exit(1);
}

console.log(`المفتاح: ${key}`);
console.log(`الروابط: ${urlList.length}${args.length ? ' (محدّدة يدويًا)' : ' (من sitemap.xml)'}`);
urlList.forEach(u => console.log('  ' + u));

/* المحرّك يجلب هذا الملف للتحقق، فإن لم يكن منشورًا فشل الإرسال كله. */
const probe = await fetch(`https://${HOST}/${key}.txt`);
if (!probe.ok) {
  console.error(`\nملف المفتاح غير منشور بعد (${probe.status}). انشري الموقع أولًا.`);
  process.exit(1);
}
console.log('ملف المفتاح منشور ويستجيب.');

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList })
});

const text = await res.text();
console.log(`\nالردّ: ${res.status} ${res.statusText}${text ? ' ' + text : ''}`);

/* 200 قُبلت، 202 قُبلت والمفتاح قيد التحقق. وكلاهما نجاح. */
if (res.status === 200 || res.status === 202) {
  console.log('تم الإرسال. الفهرسة عند Bing تستغرق ساعات عادةً لا أسابيع.');
} else {
  console.error('لم يُقبل الإرسال. 400 صيغة، 403 مفتاح غير صالح، 422 رابط خارج النطاق، 429 إرسال متكرر.');
  process.exit(1);
}
