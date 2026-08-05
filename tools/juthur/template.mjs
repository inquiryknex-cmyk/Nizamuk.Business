/*
  قالب «جذور نمطكِ»: الفهرس بأربع بطاقات كتب، وصفحةٌ لكل كتاب.

  البطاقات على هيئة بطاقات لمحات: غلافٌ حقيقي، واسم، وسؤال الكتاب،
  والسعر، وزرّ الشراء. والأغلفة هي الصور المرفوعة سابقًا في
  /assets/covers/juthur-*، لا أغلفة الكتب المرسلة الآن.

  وكل ما في الصفحات مستخرَجٌ من الكتب: الاقتباسات، والفصول، وأسماء
  المراجع. فالصفحة تُري ما في الكتاب بدل أن تَعِد به.
*/
import { renderCrumbs, jsonLdCrumbs } from '../crumbs.mjs';
import { JUTHUR, COMMON, PEEK } from './content.mjs';

const ORIGIN = 'https://nizamok.com';
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shell({ url, title, desc, image, crumbs, extraLd = '', body, nav }) {
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
  <link rel="stylesheet" href="/assets/css/main.css?v=20260805m">
  <link rel="stylesheet" href="/assets/css/mirrors.css?v=20260804d">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [${extraLd}
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
${body}
    <nav class="mr-foot-nav">
${nav.map(([t, h]) => `      <a href="${h}">${t}</a>`).join('\n')}
    </nav>
  </div>
</div>
<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=20260805a"></script>
<script src="/assets/js/main.js?v=20260801b" defer></script>
<script src="/assets/js/share-article.js?v=20260804d" defer></script>
<script src="/assets/js/peek.js?v=20260805a" defer></script>
</body>
</html>
`;
}

const FOOT = [['الرئيسية', '/'], ['الاختبار', '/ikhtibar/'], ['المسار', '/almasar/'],
              ['لمحات', '/lamhat/'], ['إعادة البناء', '/rebuild/'], ['ركن المعرفة', '/rukn/'],
              ['الخصوصية', '/privacy/']];

/* ------------------------------ الفهرس ------------------------------ */
export function renderIndex() {
  const desc = `أربعة كتب، واحد لكل نمط، في أصل النمط لا في مظهره: من أين بدأ، ولماذا يعود. ${COMMON.pages} صفحة لكل كتاب، بمراجع مؤرَّخة. ${COMMON.price} ريالًا للواحد.`;
  const crumbs = [{ name: 'الرئيسية', url: '/' }, { name: 'المسار', url: '/almasar/' }, { name: 'جذور نمطكِ' }];
  const ld = `
      {
        "@type": "CollectionPage",
        "@id": "${ORIGIN}/juthur/#page",
        "name": "جذور نمطكِ",
        "url": "${ORIGIN}/juthur/",
        "inLanguage": "ar",
        "description": "${esc(desc)}",
        "publisher": { "@type": "Organization", "name": "نظامك", "url": "${ORIGIN}/" }
      },
      {
        "@type": "ItemList",
        "@id": "${ORIGIN}/juthur/#list",
        "numberOfItems": ${JUTHUR.length},
        "itemListElement": [
${JUTHUR.map((b, i) => `          { "@type": "ListItem", "position": ${i + 1}, "name": "${esc('جذور ' + b.name)}", "url": "${ORIGIN}/juthur/${b.slug}/" }`).join(',\n')}
        ]
      },`;

  const body = `
    <p class="mr-kicker">الدرجة الثالثة، ${COMMON.price} ريالًا</p>
    <h1 class="mr-h1">جذور نمطكِ: أربعة كتب، واحد لكل نمط</h1>
    <p class="mr-lead">${desc}</p>

    <section class="mr-intro">
      <p>اللمحة تقول لكِ ما يتكرر. وجذور نمطكِ تقول من أين بدأ: اللحظة التي وُلد فيها النمط، والحاجة التي وُلد ليخدمها. وهو سؤال «لماذا يعود حتى حين أعرف أنه يؤخّرني؟»، لا سؤال «كيف أنظّم يومي؟».</p>
      <p>ولكل نمطٍ كتابه، لأن جذر المبدعة ليس جذر الكفؤة. وإن لم تحسمي أيّها يشبهكِ، فـ<a href="/ikhtibar/">الاختبار</a> يدلّكِ في ثلاث دقائق — مساعدةٌ لمن لم تحسم، لا شرطٌ للشراء.</p>
    </section>

    <ul class="book-grid" role="list">
${JUTHUR.map(b => `      <li class="book-card">
        <a class="book-cover" href="/juthur/${b.slug}/" aria-label="${esc('جذور ' + b.name)}">
          <picture>
            <source srcset="/assets/covers/${b.cover}.webp?v=1" type="image/webp">
            <img src="/assets/covers/${b.cover}.jpg?v=1" alt="${esc('غلاف جذور ' + b.name)}" width="700" height="964" loading="lazy">
          </picture>
        </a>
        <div class="book-body">
          <h2><a href="/juthur/${b.slug}/">${esc('جذور ' + b.name)}</a></h2>
          <p class="book-q">${esc(b.sub)}</p>
          <p class="book-meta">${COMMON.pages} صفحة، و${b.nrefs} مرجعًا مؤرَّخًا</p>
          <div class="book-cta">
            <a class="btn btn-rose" href="/juthur/${b.slug}/"
               data-ev="juthur_card_click" data-pattern="${b.slug}" data-level="juthur" data-section="juthur_index">اطّلعي على الكتاب، ${COMMON.price} ريالًا</a>
          </div>
        </div>
      </li>`).join('\n')}
    </ul>

    <div class="stage-read">
      <h3>ما يجمع الأربعة</h3>
      <p>كل كتابٍ ${COMMON.pages} صفحة، وفيه رحلةُ جذرٍ في سبعة أيام، و«ملاحظة المنهج والسلامة» تقول صراحةً متى يكون طلبُ مختصٍّ أولى من القراءة، وقائمةُ مراجع مؤرَّخة تُقرأ وتُراجَع.</p>
    </div>

    <div class="mr-share-sec">
      <div data-article-share data-share-context="juthur_index"
           data-share-h="تعرفين من قد تشبه أحد هذه الأنماط؟"
           data-share-sub="أرسليها لها، فقد توفّر عليها شهورًا من المحاولة في الاتجاه الخطأ."></div>
    </div>

    <p class="mr-disc">جذور نمطكِ قراءات تعليمية للفهم الذاتي والتنظيم العملي، وليست تشخيصًا نفسيًا ولا بديلًا عن استشارة مختصة.</p>
`;
  return shell({
    url: '/juthur/', title: `جذور نمطكِ: أربعة كتب، واحد لكل نمط | نظامك`,
    desc, image: '/assets/covers/juthur-mubdia.jpg?v=1', crumbs, extraLd: ld, body, nav: FOOT
  });
}

/* --------------------------- صفحة كل كتاب --------------------------- */
export function renderBook(b) {
  const url = `/juthur/${b.slug}/`;
  const title = `جذور ${b.name}: كتابٌ في أصل النمط | نظامك`;
  const desc = `${b.sub} ${COMMON.pages} صفحة في جذر النمط، بـ${b.nrefs} مرجعًا مؤرَّخًا. ${COMMON.price} ريالًا.`;
  const crumbs = [{ name: 'الرئيسية', url: '/' }, { name: 'جذور نمطكِ', url: '/juthur/' }, { name: b.name }];
  const ld = `
      {
        "@type": "Book",
        "@id": "${ORIGIN}${url}#book",
        "name": "${esc('جذور ' + b.name)}",
        "inLanguage": "ar",
        "bookFormat": "https://schema.org/EBook",
        "numberOfPages": ${COMMON.pages},
        "description": "${esc(b.sub)}",
        "publisher": { "@type": "Organization", "name": "نظامك", "url": "${ORIGIN}/" },
        "image": "${ORIGIN}/assets/covers/${b.cover}.jpg",
        "offers": {
          "@type": "Offer",
          "price": "${COMMON.price}",
          "priceCurrency": "SAR",
          "availability": "https://schema.org/InStock",
          "url": "${ORIGIN}${url}"
        }
      },`;

  const body = `
    <div class="book-hero">
      <div class="book-hero-cover">
        <picture>
          <source srcset="/assets/covers/${b.cover}.webp?v=1" type="image/webp">
          <img src="/assets/covers/${b.cover}.jpg?v=1" alt="${esc('غلاف جذور ' + b.name)}" width="700" height="964" loading="eager">
        </picture>
      </div>
      <div class="book-hero-copy">
        <p class="mr-kicker">كتابٌ في أصلِ النمط، ${COMMON.pages} صفحة</p>
        <h1 class="mr-h1">جذور ${esc(b.name)}</h1>
        <p class="book-hero-q">${esc(b.sub)}</p>
        <p class="mr-lead">${esc(b.lead)}</p>
        <a class="btn btn-rose book-buy" href="${b.dodo}" target="_blank" rel="noopener"
           data-ev="juthur_click" data-pattern="${b.slug}" data-level="juthur" data-section="juthur_page">اقتني الكتاب، ${COMMON.price} ريالًا</a>
        <p class="book-assure">دفعة واحدة، ووصول رقمي فور الدفع، والسعر شامل الضرائب.</p>
      </div>
    </div>

    <section class="book-sec">
      <h2>من داخل الكتاب</h2>
      <ul class="book-quotes" role="list">
${b.passages.map(q => `        <li>«${esc(q)}»</li>`).join('\n')}
      </ul>
    </section>

    <section class="book-sec">
      <h2>جولة سريعة في الداخل</h2>
      <p>أربع صفحاتٍ من ${COMMON.pages}. انقري لتكبير أيّها. تُري كيف بُني الكتاب، لا ما يقوله.</p>
      <ul class="peek-grid" role="list">
${PEEK.map(k => `        <li class="peek">
          <button type="button" data-peek-full="/assets/juthur/${b.slug}/${k.file}.webp" aria-label="تكبير: ${esc(k.cap)}">
            <img src="/assets/juthur/${b.slug}/${k.file}-thumb.webp" alt="${esc(k.cap)}" width="620" height="827" loading="lazy">
          </button>
          <span class="peek-cap">${esc(k.cap)}</span>
        </li>`).join('\n')}
      </ul>
    </section>

    <section class="book-sec">
      <h2>ما ستمرّين به</h2>
      <ol class="book-chapters">
${COMMON.chapters.map(c => `        <li>${esc(c)}</li>`).join('\n')}
      </ol>
    </section>

    <section class="book-sec">
      <h2>المنهج، والحدّ الذي لا يتجاوزه الكتاب</h2>
      <p>الكتاب يستند إلى أدبٍ منشور، لا إلى رأيٍ عام. وفيه <strong>${b.nrefs} مرجعًا مؤرَّخًا</strong> تُقرأ وتُراجَع، منها:</p>
      <ul class="book-refs" role="list">
${b.refs.map(r => `        <li>${esc(r)}</li>`).join('\n')}
      </ul>
      <p class="book-safety">وفيه «ملاحظة المنهج والسلامة» تقول صراحةً: إن كنتِ تمرّين بضيقٍ شديد أو أعراضٍ مستمرة تؤثّر في حياتكِ اليومية، فالأفضل طلب مساعدةٍ مختصّة مؤهلة. وهذا كتابٌ للفهم الذاتي، وليس تشخيصًا نفسيًا ولا بديلًا عن العلاج.</p>
    </section>

    <section class="book-sec">
      <h2>لستِ متأكدة أن هذا نمطكِ؟</h2>
      <p>لكل نمطٍ كتابه، وقراءة كتابِ نمطٍ آخر لا تنفع. و<a href="/ikhtibar/">الاختبار المجاني</a> ثلاث دقائق بلا دفع، ونمطكِ يظهر فور انتهائكِ، ويُطلب بريدكِ لفتح القراءة الكاملة.</p>
      <p>وإن كنتِ تعرفين نمطكِ ولم تقرئي لمحته بعد، فـ<a href="/lamhat/${b.slug}/">لمحة ${esc(b.name)}</a> هي الدرجة التي قبل هذه.</p>
    </section>

    <div class="mr-share-sec">
      <div data-article-share data-share-context="juthur_${b.slug}"
           data-share-h="تعرفين من قد تشبه هذا النمط؟"
           data-share-sub="أرسليها لها، فقد توفّر عليها شهورًا من المحاولة في الاتجاه الخطأ."></div>
    </div>

    <p class="mr-disc">جذور نمطكِ قراءات تعليمية للفهم الذاتي والتنظيم العملي، وليست تشخيصًا نفسيًا ولا بديلًا عن استشارة مختصة.</p>
`;
  return shell({ url, title, desc, image: `/assets/covers/${b.cover}.jpg?v=1`, crumbs, extraLd: ld, body, nav: FOOT });
}
