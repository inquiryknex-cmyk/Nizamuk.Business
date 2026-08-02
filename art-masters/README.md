# الأصول الفنية

هذا المجلد خارج `site/`، أي خارج ما يُنشر على nizamok.com.
`wrangler.toml` ينشر `./site` فقط، فلا شيء هنا يصل إلى الويب.

## لماذا هنا لا هناك

ملفات PNG الأصلية للأغلفة (1024×1536) وزنها 11 ميغابايت مجتمعة، ولا تشير
إليها أي صفحة: الموقع يخدم `site/assets/covers/rebuild/*.webp` بعرض 700
بكسل (نحو 53 كيلوبايت للغلاف)، مع `*.jpg` كبديل.

حين كانت الأصول داخل `site/` كانت تُنشر مع كل إصدار، وكانت قابلة للتحميل
بدقتها الكاملة لمن يعرف رابطها. نقلها إلى هنا يحفظها كما هي بلا تعديل
(بصمة SHA-256 لكل ملف لم تتغير) ويخرجها من النشر.

## إعادة توليد ما يُخدَم

عند تحديث أي غلاف، ضعي الأصل هنا ثم ولّدي النسختين المنشورتين:

```sh
node -e "
const s=require('sharp');
const n='rebuild-mubdia';
const src='art-masters/covers/rebuild/'+n+'.png';
const out='site/assets/covers/rebuild/'+n;
s(src).resize({width:700,withoutEnlargement:true}).toBuffer().then(b=>
  Promise.all([
    s(b).webp({quality:74,effort:6}).toFile(out+'.webp'),
    s(b).jpeg({quality:78,mozjpeg:true,progressive:true}).toFile(out+'.jpg')
  ]));
"
```

700 بكسل هو الحد الكافي: أوسع عرض تُرسم به الأغلفة على الموقع 346 بكسل،
أي 692 على شاشة بكثافة مضاعفة.
