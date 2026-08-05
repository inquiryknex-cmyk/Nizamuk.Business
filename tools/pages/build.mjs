/*
  يولّد صفحتين محوريّتين لم تكونا موجودتين:

      /juthur/   جذور نمطكِ الأربعة، وكانت تُباع من داخل /almasar/#juthur وحده
      /rukn/     ركن المعرفة، تحته المقالات والمرايا

      npm run build:pages

  لماذا /juthur/. كل درجةٍ في السلّم لها محورها الآن — /lamhat/ و/rebuild/
  و/interdash/ — إلا جذور. فكانت الدرجة الوحيدة التي لا باب لها، ولا يصلها
  أحدٌ إلا بمرساةٍ داخل صفحةٍ أخرى. وتشخيص GA4 أرى /juthur مطروقًا ويعطي
  404، أي أن الناس يكتبونه بحثًا عن بابٍ لم يكن.

  لماذا /rukn/. المقالات والمرايا كانتا بندين منفصلين في شريط التنقّل،
  وهما شيءٌ واحد: قراءةٌ بلا دفع. فجُمعتا تحت ركنٍ واحد، وصار الشريط
  يحمل بندًا واحدًا بدل اثنين.

  وأسماء الأغلفة لا تطابق الشرائح: asira مقابل asirat، وmutafadiya مقابل
  mutafadia. وهذا فخٌّ قائم في المستودع، فيُصرَّح به هنا حقلًا مستقلًا
  بدل أن يُشتقّ، ويتوقف البناء إن غاب ملفٌ منها.
*/
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCrumbs, jsonLdCrumbs } from '../crumbs.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..', '..', 'site');
const ORIGIN = 'https://nizamok.com';
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* الشريحة للمسار، والغلاف لاسم الملف، ولا يُشتقّ أحدهما من الآخر. */
const JUTHUR = [
  { slug: 'mubdia',    name: 'المبدعة المشتّتة',  cover: 'juthur-mubdia',
    dodo: 'https://dodo.pe/juthur-mubdia-inter',
    line: 'لمن تبدأ بحماسٍ ثم تُزاحم الأفكارُ بعضها، فيضيع الخيط الهادئ الذي كان سيقودها إلى الإنجاز.' },
  { slug: 'asirat',    name: 'أسيرة الكمال',      cover: 'juthur-asira',
    dodo: 'https://dodo.pe/juthur-asirat-inter',
    line: 'لمن لا تؤجّل لأنها لا تهتم، بل لأنها تريد أن يكون كل شيءٍ صحيحًا من البداية.' },
  { slug: 'mutafadia', name: 'المتفادية الذكية',  cover: 'juthur-mutafadiya',
    dodo: 'https://dodo.pe/juthur-mutafadia-inter',
    line: 'لمن تعرف ما يجب فعله، لكنها تتوقف عند الخطوة الحاسمة حين يصبح القرار مهمًّا فعلًا.' },
  { slug: 'kafua',     name: 'الكفؤة المنهَكة',   cover: 'juthur-kafua',
    dodo: 'https://dodo.pe/juthur-kafua-inter',
    line: 'لمن تبدو قادرةً من الخارج، بينما تتراكم داخلها طبقاتٌ من التعب الصامت والمسؤولية الطويلة.' }
];

function head({ url, title, desc, image, crumbs, extraLd = '' }) {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${ORIGIN}${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="نظامك">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${ORIGIN}${url}">
  <meta property="og:image" content="${ORIGIN}${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/assets/img/seal.png">
  <link rel="apple-touch-icon" href="/assets/img/seal.png">
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/css/main.css?v=20260805e">
  <link rel="stylesheet" href="/assets/css/mirrors.css?v=20260804d">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "${ORIGIN}${url}#page",
        "name": "${esc(title)}",
        "url": "${ORIGIN}${url}",
        "inLanguage": "ar",
        "description": "${esc(desc)}",
        "publisher": { "@type": "Organization", "name": "نظامك", "url": "${ORIGIN}/" }
      },${extraLd}
      {
        "@type": "BreadcrumbList",
        "@id": "${ORIGIN}${url}#breadcrumb",
        "itemListElement": [
          ${jsonLdCrumbs(crumbs)}
        ]
      }
    ]
  }
  </script>
</head>
<body class="mr-body" data-ambient data-lang-alt="/en/">
<div class="mr-wrap">
  <div class="container mr-narrow">

    <header class="mr-top">
      <a class="mr-brand" href="/" aria-label="نظامك، الصفحة الرئيسية">
        <img class="seal-img" src="/assets/img/seal.png" alt="ختم نظامك" width="92" height="92">
        <img class="mr-wordmark" src="/assets/img/wordmark-ink.png" alt="نظامك" width="460" height="150" loading="eager">
      </a>
      <a class="mr-home" href="/">الصفحة الرئيسية</a>
    </header>

    ${renderCrumbs(crumbs)}
`;
}

const foot = (nav) => `
    <nav class="mr-foot-nav">
${nav.map(([t, h]) => `      <a href="${h}">${t}</a>`).join('\n')}
    </nav>
  </div>
</div>
<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=20260805a"></script>
<script src="/assets/js/main.js?v=20260801b" defer></script>
<script src="/assets/js/share-article.js?v=20260804d" defer></script>
</body>
</html>
`;

/* ---------------------------- /juthur/ ---------------------------- */
for (const b of JUTHUR) {
  for (const ext of ['jpg', 'webp']) {
    const f = join(SITE, 'assets', 'covers', `${b.cover}.${ext}`);
    if (!existsSync(f)) throw new Error(`${b.slug}: الغلاف غير موجود — ${b.cover}.${ext}`);
  }
}

const jDesc = 'أربعة كتب، واحد لكل نمط، في أصل النمط لا في مظهره: من أين يبدأ، ولماذا يعود حتى حين تعرفين أنه يؤخّركِ. 49 ريالًا للواحد.';
const jCrumbs = [{ name: 'الرئيسية', url: '/' }, { name: 'المسار', url: '/almasar/' }, { name: 'جذور نمطكِ' }];
const jLd = `
      {
        "@type": "ItemList",
        "@id": "${ORIGIN}/juthur/#list",
        "numberOfItems": ${JUTHUR.length},
        "itemListElement": [
${JUTHUR.map((b, i) => `          { "@type": "ListItem", "position": ${i + 1}, "name": "${esc('جذور ' + b.name)}" }`).join(',\n')}
        ]
      },`;

const juthur = head({
  url: '/juthur/', title: 'جذور نمطكِ: أربعة كتب، واحد لكل نمط | نظامك',
  desc: jDesc, image: '/assets/covers/juthur-mubdia.jpg?v=1', crumbs: jCrumbs, extraLd: jLd
}) + `
    <p class="mr-kicker">الدرجة الثالثة، 49 ريالًا</p>
    <h1 class="mr-h1">جذور نمطكِ: أربعة كتب، واحد لكل نمط</h1>
    <p class="mr-lead">${jDesc}</p>

    <section class="mr-intro">
      <p>اللمحة تقول لكِ ما يتكرر. وجذور نمطكِ تقول من أين بدأ: الجذر الخفيّ بين الشعور، والخوف، والعادة التي تعيد نفسها. وهو سؤال «لماذا يعود النمط حتى حين أعرف أنه يؤخّرني؟»، لا سؤال «كيف أنظّم يومي؟».</p>
      <p>ولكل نمطٍ كتابه، لأن جذر المبدعة ليس جذر الكفؤة. وإن لم تحسمي أيّها يشبهكِ، فـ<a href="/ikhtibar/">الاختبار</a> ثلاث دقائق بلا دفع — وهو مساعدةٌ لمن لم تحسم، لا شرطٌ للشراء.</p>
    </section>

    <ul class="mr-cards" role="list">
${JUTHUR.map(b => `      <li class="mr-card">
        <a href="${b.dodo}" target="_blank" rel="noopener" data-ev="juthur_click" data-pattern="${b.slug}" data-level="juthur" data-section="juthur_index">
          <span class="mr-card-k">كتابٌ في أصلِ النمط</span>
          <b>${esc('جذور ' + b.name)}</b>
          <span class="mr-card-d">${esc(b.line)}</span>
          <span class="mr-card-go">اقرئي جذوركِ، 49 ريالًا</span>
        </a>
      </li>`).join('\n')}
    </ul>

    <div class="mr-share-sec">
      <div data-article-share data-share-context="juthur_index"
           data-share-h="تعرفين من قد تشبه أحد هذه الأنماط؟"
           data-share-sub="أرسليها لها، فقد توفّر عليها شهورًا من المحاولة في الاتجاه الخطأ."></div>
    </div>

    <p class="mr-disc">جذور نمطكِ قراءات تعليمية للفهم الذاتي والتنظيم العملي، وليست تشخيصًا نفسيًا ولا بديلًا عن استشارة مختصة.</p>
` + foot([['الرئيسية', '/'], ['الاختبار', '/ikhtibar/'], ['المسار', '/almasar/'],
          ['لمحات', '/lamhat/'], ['إعادة البناء', '/rebuild/'], ['ركن المعرفة', '/rukn/'],
          ['الخصوصية', '/privacy/']]);

mkdirSync(join(SITE, 'juthur'), { recursive: true });
writeFileSync(join(SITE, 'juthur', 'index.html'), juthur, 'utf8');
console.log(`wrote site/juthur/index.html  (${JUTHUR.length} كتب)`);

/* ---------------------------- /rukn/ ---------------------------- */
const rDesc = 'كل ما يُقرأ بلا دفع في نظامك: مقالات أطول في التسويف والبدايات والإنهاك، ومرايا قصيرة تفرّق بين آلياتٍ تتشابه في الشعور وتختلف في العلاج.';
const rCrumbs = [{ name: 'الرئيسية', url: '/' }, { name: 'ركن المعرفة' }];

const rukn = head({
  url: '/rukn/', title: 'ركن المعرفة: المقالات والمرايا | نظامك',
  desc: rDesc, image: '/assets/img/seal.png', crumbs: rCrumbs
}) + `
    <p class="mr-kicker">بلا دفع، وبلا بريد</p>
    <h1 class="mr-h1">ركن المعرفة</h1>
    <p class="mr-lead">${rDesc}</p>

    <section class="mr-intro">
      <p>ليس كل ما في نظامك يُشترى. وهذا الركن هو ما يُقرأ ويُفهَم قبل أي قرار: بابان، أحدهما أطول نفَسًا والآخر أسرع.</p>
    </section>

    <ul class="mr-cards" role="list">
      <li class="mr-card">
        <a href="/maqalat/" data-ev="rukn_click" data-section="maqalat">
          <span class="mr-card-k">القراءة الأطول</span>
          <b>المقالات</b>
          <span class="mr-card-d">سبع قراءات في التسويف، وإدمان البدايات، والكسل، وكثرة التفكير، وما بعد MBTI. تُقرأ كاملةً بلا مقابل.</span>
          <span class="mr-card-go">ادخلي المقالات</span>
        </a>
      </li>
      <li class="mr-card">
        <a href="/mirrors/" data-ev="rukn_click" data-section="mirrors">
          <span class="mr-card-k">أقلّ من دقيقة</span>
          <b>المرايا</b>
          <span class="mr-card-d">أربعة مواقف تفرّق بين آلياتٍ تتشابه في الشعور ويختلف علاجها اختلافًا تامًّا. بلا بريد ولا تسجيل، والنتيجة فور الإجابة الرابعة.</span>
          <span class="mr-card-go">ادخلي المرايا</span>
        </a>
      </li>
    </ul>

    <div class="stage-read">
      <h3>وإن أردتِ ما هو أعمق</h3>
      <p><a href="/ikhtibar/">الاختبار المجاني</a> يسمّي نمطكِ في ثلاث دقائق، و<a href="/almasar/">صفحة المسار</a> تشرح المراحل الخمس بعده.</p>
    </div>
` + foot([['الرئيسية', '/'], ['المقالات', '/maqalat/'], ['المرايا', '/mirrors/'],
          ['الاختبار', '/ikhtibar/'], ['المسار', '/almasar/'], ['الخصوصية', '/privacy/']]);

mkdirSync(join(SITE, 'rukn'), { recursive: true });
writeFileSync(join(SITE, 'rukn', 'index.html'), rukn, 'utf8');
console.log('wrote site/rukn/index.html');
