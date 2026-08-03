/*
  قالب صفحات /lamhat/<slug>/ الأربع.

  الفرق الجوهري عن قالب /rebuild/: هناك زرّ الاختبار «مهرب» صغير مقصود تحت زر
  الشراء، لأن من تصل إلى صفحة الـ109 تكون قد عرفت نمطها. هنا العكس تمامًا.
  اللمحة أول درجة، وتصلها زائرةٌ من إعلانٍ أو مقطع لا تعرف اسم نمطها بعد،
  وأمامها أربعة كتب لا تستطيع الاختيار بينها. فبيعُ الكتاب الخطأ أسوأ من
  تأجيل البيع: يعود بطلب استرداد، ويُفقد الثقة في السلّم كلّه.

  لذلك الاختبار هنا زرٌّ أول بحجمٍ كامل، له قسمه الخاص فوق الطيّة، ويتكرر قبل
  الشراء النهائي. هذا انعكاسٌ متعمَّد للقاعدة المكتوبة في template.mjs الآخر،
  لا سهوٌ عنها.
*/

const PRICE = 19;
const QUIZ = (src) => `/ikhtibar/?source=${src}&origin=lamhat_page`;

/* درجات السلّم. «أنتِ هنا» تُحسب من الشريحة لا تُكتب يدويًا. */
const RUNGS = [
  { k: 'quiz',    t: 'الاختبار',        p: 'مجاني',   d: 'ثلاث دقائق تعطيكِ نمطكِ الغالب ونسب تركيبتكِ.', href: null },
  { k: 'taqrir',  t: 'تقرير نمطكِ',      p: 'مجاني',   d: 'من أنتِ في هذا النمط، يصلكِ على بريدكِ بعد الاختبار.', href: null },
  { k: 'lamhat',  t: 'لمحات نظامك',      p: '١٩ ر.س',  d: 'ما يفعله النمط داخل يومكِ، وخطة ٣ أيام.', href: null },
  { k: 'juthur',  t: 'جذور نمطكِ',       p: '٤٩ ر.س',  d: 'من أين بدأ النمط، وما الشعور الذي يحميه، ولماذا يعود.', href: '/almasar/' },
  { k: 'rebuild', t: 'نظام إعادة البناء', p: '١٠٩ ر.س', d: 'خمس مراحل، وخطة ٣٠ يومًا، ومسار متابعة ٩٠ يومًا.', href: null }
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* لا يُكسر السطر بين الرقم ووحدته. */
const nb = (s) => String(s).replace(/ ر\.س/g, ' ر.س');

const li = (a) => a.map(x => `          <li>${x}</li>`).join('\n');

const insideRows = (a) => a.map(x => `          <li class="lm-in">
            <span class="lm-in-n" aria-hidden="true">${x.n}</span>
            <div><b>${x.t}</b><span>${x.d}</span></div>
          </li>`).join('\n');

/* قسم الاقتباسات لا يُرسَم إطلاقًا إن لم يكن هناك نصٌّ حقيقي من الكتاب.
   القيمة null تعني «الملف لم يُرفع بعد»، لا «لا يوجد ما يُقتبس». */
const passages = (p) => {
  if (!p.passages || !p.passages.length) return '';
  return `
  <section class="lm-sec lm-quotes" aria-labelledby="quotesH">
    <div class="container lm-narrow">
      <h2 id="quotesH" class="lm-h2">${p.passagesH}</h2>
      <p class="lm-note">${p.passagesNote}</p>
      <div class="lm-quote-grid">
${p.passages.map(q => `        <figure class="lm-quote">
          <blockquote>${q.t}</blockquote>
          <figcaption>صفحة ${q.p}</figcaption>
        </figure>`).join('\n')}
      </div>
    </div>
  </section>`;
};

const ladder = (slug) => `
  <section class="lm-sec lm-ladder-sec" aria-labelledby="ladderH">
    <div class="container lm-narrow">
      <h2 id="ladderH" class="lm-h2">أين تقع هذه اللمحة؟</h2>
      <p class="lm-note">سلّم نظامك خمس درجات. كل درجة تقف وحدها، ولا تحتاجين التالية لتستفيدي من هذه.</p>
      <ol class="lm-ladder" role="list">
${RUNGS.map(r => {
  const here = r.k === 'lamhat';
  const inner = `<span class="lm-rung-t">${r.t}</span>
            <span class="lm-rung-p">${nb(r.p)}</span>
            <span class="lm-rung-d">${r.d}</span>
            ${here ? '<span class="lm-here">أنتِ هنا</span>' : ''}`;
  return `        <li class="lm-rung${here ? ' is-here' : ''}"${here ? ' aria-current="step"' : ''}>
          ${r.href ? `<a href="${r.href}">${inner}</a>` : `<div>${inner}</div>`}
        </li>`;
}).join('\n')}
      </ol>
      <p class="lm-note lm-ladder-foot">لا تُشترى الدرجات دفعةً واحدة. ابدئي من هذه، وقرّري بعدها.</p>
    </div>
  </section>`;

/* الزر الكبير. يظهر مرتين، بنصّين مختلفين لا بنصٍّ مكرر: الأول يعترض قبل أن
   تقرأ شيئًا، والثاني يعترض وهي على وشك الدفع. السؤال نفسه في اللحظتين، لكن
   ما يخسرانه مختلف، فالنصّ مختلف. */
const QUIZ_COPY = {
  top: {
    h: 'لستِ متأكدة أن هذا نمطكِ؟',
    p: 'أربع لمحاتٍ لأربعة أنماط، والقراءة الصحيحة هي التي تصف يومكِ أنتِ. لا تشتري على الظنّ: الاختبار مجاني ويستغرق ٣ دقائق، ويعطيكِ نمطكِ الغالب ونسب تركيبتكِ، ثم يدلّكِ على اللمحة التي تخصّكِ.',
    btn: 'اكتشفي نمطكِ مجانًا، ٣ دقائق',
    foot: 'بلا بريدٍ إجباري لبدء الاختبار، وبلا دفع.'
  },
  mid: {
    h: 'قبل أن تدفعي، سؤال واحد.',
    p: 'قرأتِ الصفحة كلها. هل وصفت يومكِ أنتِ، أم يومًا تعرفينه في غيركِ؟ إن ترددتِ، فثلاث دقائق الآن أرخص من كتابٍ لا يخصّكِ.',
    btn: 'تأكّدي من نمطكِ أولًا، مجانًا',
    foot: 'ستعودين إلى اللمحة الصحيحة بعد النتيجة مباشرة.'
  }
};

const quizBlock = (p, pos, variant) => {
  const c = QUIZ_COPY[pos];
  return `
  <section class="lm-sec lm-quiz ${variant}" aria-labelledby="quizH-${pos}">
    <div class="container lm-narrow">
      <h2 id="quizH-${pos}" class="lm-quiz-h">${c.h}</h2>
      <p class="lm-quiz-p">${c.p}</p>
      <a class="lm-quiz-btn" href="${QUIZ(p.quizSource)}" data-lm-cta="quiz" data-lm-pos="${pos}">
        ${c.btn}
      </a>
      <p class="lm-quiz-foot">${c.foot}</p>
    </div>
  </section>`;
};

export function renderPage(p) {
  const buy = (pos, label) => `<a class="lm-buy" href="${p.dodo}" rel="nofollow noopener" target="_blank"
             data-lm-cta="buy" data-lm-pos="${pos}" data-level="lamhat" data-price="${PRICE}">${nb(label)}</a>`;

  const url = `https://nizamok.com/lamhat/${p.slug}/`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.seoTitle)}</title>
  <meta name="description" content="${esc(p.seoDesc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="نظامك">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:title" content="${esc(p.seoTitle)}">
  <meta property="og:description" content="${esc(p.seoDesc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://nizamok.com${p.coverJpg}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="preload" href="/assets/fonts/almarai-400-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/el-messiri-700-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/css/main.css?v=20260801i">
  <link rel="stylesheet" href="/assets/css/lamhat.css?v=20260803a">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "لمحات نظامك، ${p.name}",
    "description": "${esc(p.seoDesc)}",
    "brand": { "@type": "Brand", "name": "نظامك" },
    "image": "https://nizamok.com${p.coverJpg}",
    "offers": {
      "@type": "Offer",
      "price": "${PRICE}",
      "priceCurrency": "SAR",
      "url": "${url}",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
${p.faqs.map(f => `      { "@type": "Question", "name": "${esc(f.q)}", "acceptedAnswer": { "@type": "Answer", "text": "${esc(f.a.replace(/<[^>]+>/g, ''))}" } }`).join(',\n')}
    ]
  }
  </script>
</head>
<body class="lm-body" data-lm-pattern="${p.slug}" data-lang-alt="/en/" style="--lm-ground:${p.ground};--lm-accent:${p.accent}">

<!-- ====== 1, الواجهة ====== -->
<header class="lm-hero">
  <div class="container lm-hero-in">
    <a class="lm-brand" href="/" aria-label="نظامك، الصفحة الرئيسية">
      <img src="/assets/img/wordmark.png" alt="نظامك" width="460" height="150" loading="eager">
    </a>

    <div class="lm-hero-grid">
      <div class="lm-hero-copy">
        <p class="lm-kicker">${p.kicker}</p>
        <h1 class="lm-h1">${p.h1}</h1>
        <p class="lm-lead">${p.lead}</p>
        <p class="lm-price"><b>${nb('١٩ ر.س')}</b> <span>·  ملف PDF يصلكِ على بريدكِ بعد الدفع مباشرة</span></p>
        ${buy('hero', 'خذي اللمحة، ١٩ ر.س')}
        <p class="lm-assure">السعر شامل الضرائب · وصولٌ رقميّ فوري</p>
      </div>
      <figure class="lm-cover">
        <img src="${p.cover}" alt="غلاف لمحات نظامك، ${p.name}" width="700" height="964" loading="eager" fetchpriority="high">
        <figcaption>لمحات نظامك · ${p.name}</figcaption>
      </figure>
    </div>
  </div>
</header>

<!-- ====== 2, الزر الكبير: من لا تعرف نمطها بعد ====== -->
${quizBlock(p, 'top', 'is-top')}

<!-- ====== 3, المرآة ====== -->
<section class="lm-sec" aria-labelledby="mirrorH">
  <div class="container lm-narrow">
    <h2 id="mirrorH" class="lm-h2">${p.mirrorH}</h2>
    <ul class="lm-list" role="list">
${li(p.mirror)}
    </ul>
    <p class="lm-close">إن تعرّفتِ على ثلاثةٍ منها أو أكثر، فالمشكلة ليست أنكِ لا تعرفين ماذا تفعلين. المشكلة أن هناك نمطًا يعيد ترتيب قراركِ في اللحظة الحاسمة.</p>
  </div>
</section>

<!-- ====== 4, من داخل الكتاب (يظهر فقط حين يوجد نصّ حقيقي) ====== -->
${passages(p)}

<!-- ====== 5, ما الذي تفتحه اللمحة ====== -->
<section class="lm-sec lm-inside" aria-labelledby="insideH">
  <div class="container lm-narrow">
    <h2 id="insideH" class="lm-h2">${p.insideH}</h2>
    <ul class="lm-in-list" role="list">
${insideRows(p.inside)}
    </ul>
    <p class="lm-promise"><span>${p.promiseH}</span>${p.promise}</p>
  </div>
</section>

<!-- ====== 6, السلّم ====== -->
${ladder(p.slug)}

<!-- ====== 7, الزر الكبير مرة أخرى، قبل القرار ====== -->
${quizBlock(p, 'mid', 'is-mid')}

<!-- ====== 8, الشراء ====== -->
<section class="lm-sec lm-buy-sec" aria-labelledby="buyH">
  <div class="container lm-narrow">
    <h2 id="buyH" class="lm-h2">لمحات نظامك · ${p.name}</h2>
    <p class="lm-buy-price">${nb('١٩ ر.س')}</p>
    <p class="lm-buy-d">${p.promise}</p>
    ${buy('final', 'خذي اللمحة الآن')}
    <p class="lm-assure">السعر شامل الضرائب · وصولٌ رقميّ فوري · دعم على support@nizamok.com</p>
  </div>
</section>

<!-- ====== 9, الأسئلة ====== -->
<section class="lm-sec" aria-labelledby="faqH">
  <div class="container lm-narrow">
    <h2 id="faqH" class="lm-h2">أسئلة قبل أن تقرري</h2>
    <div class="lm-faq">
${p.faqs.map(f => `      <details>
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`).join('\n')}
    </div>
  </div>
</section>

<!-- ====== 10, الحدود ====== -->
<footer class="lm-foot">
  <div class="container lm-narrow">
    <p class="lm-limits">نظامك منصة عربية للتفكير الذاتي والإدارة السلوكية العملية للنساء. تساعدكِ هذه القراءة على تسمية نمطٍ متكرر وتجربة استجاباتٍ أكثر وعيًا. لا تقدّم تشخيصًا نفسيًا أو طبيًا، ولا تعد بنتيجةٍ مضمونة، ولا تستبدل العلاج أو الرعاية المتخصصة عند الحاجة.</p>
    <nav class="lm-foot-nav">
      <a href="/">الرئيسية</a>
      <a href="/almasar/">المسار</a>
      <a href="/ikhtibar/">الاختبار</a>
      <a href="/maqalat/">المقالات</a>
      <a href="/privacy/">الخصوصية</a>
      <a href="/terms/">الشروط</a>
      <a href="/refund/">الاسترداد</a>
    </nav>
  </div>
</footer>

<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=20260801a"></script>
<script src="/assets/js/lamhat.js?v=20260803a" defer></script>
<script src="/assets/js/main.js?v=20260801b" defer></script>
</body>
</html>
`;
}
