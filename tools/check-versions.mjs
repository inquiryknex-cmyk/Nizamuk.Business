/*
  حارس أرقام النسخ.

  ترويسات التخزين تضع /assets/css/* و/assets/js/* على سنة كاملة مع immutable،
  وهذا صحيح ما دام رقم النسخة في الرابط يتغيّر مع كل نشر. لكن نسيان الترقيم
  في ملف واحد لا يظهر أثره فورًا: الصفحة تبدو سليمة عندنا، بينما المتصفح
  الذي زار الموقع من قبل يبقى على شيفرة قديمة سنة كاملة.

  حدث هذا فعلًا: صفحات الكتب الأربع بقيت على main.js من 19 يوليو بينما
  انتقلت بقية الصفحات إلى نسخة 1 أغسطس، فاختفى زر اللغة عنها.

  هذا الفحص يكسر البناء إن اختلف رقم أي ملف بين الصفحات.
*/
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('site/**/*.html');
const seen = new Map();   // asset -> Map(version -> [pages])

for (const f of files) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/\/assets\/(?:css|js)\/([a-z0-9-]+\.(?:css|js))\?v=([0-9a-z]+)/g)) {
    const [, asset, ver] = m;
    if (!seen.has(asset)) seen.set(asset, new Map());
    const byVer = seen.get(asset);
    if (!byVer.has(ver)) byVer.set(ver, []);
    if (!byVer.get(ver).includes(f)) byVer.get(ver).push(f);
  }
}

let bad = false;
for (const [asset, byVer] of seen) {
  if (byVer.size > 1) {
    bad = true;
    console.error(`\nاختلاف في رقم نسخة ${asset}:`);
    for (const [ver, pages] of byVer) {
      console.error(`  ?v=${ver}  (${pages.length} صفحة)`);
      pages.slice(0, 4).forEach(p => console.error(`      ${p}`));
      if (pages.length > 4) console.error(`      وغيرها ${pages.length - 4}`);
    }
  }
}

if (bad) {
  console.error('\nالبناء متوقف. وحّدي رقم النسخة، وتذكّري القالب في tools/rebuild/ إن كانت الصفحة مولّدة.');
  process.exit(1);
}
console.log(`أرقام النسخ متسقة عبر ${files.length} صفحة، و${seen.size} ملفًا.`);
