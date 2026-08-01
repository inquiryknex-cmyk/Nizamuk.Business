/* Shareable result pages: /natija/<slug>/
 *
 * Why these exist. The quiz's own `?result=` link is useless as a share: it
 * restores from the SHARER's localStorage, so a friend who opens it lands on a
 * blank quiz. A shared link needs a page that stands on its own, and it needs
 * static Open Graph tags, because WhatsApp, X and Telegram scrape HTML and do
 * not run JavaScript.
 *
 * They are generated rather than hand-written so the pattern copy cannot drift
 * from quiz.js, which is the single source for name/truth/headline/wound/step.
 *
 * The visitor here did NOT take the quiz. She arrived because someone she knows
 * did, so the page's job is one thing: get her to take it. The 19 SAR rung sits
 * below that as the only purchase offered, because a stranger three seconds into
 * the brand does not buy a 109 system.
 *
 *   node tools/natija-pages.mjs        # writes site/natija/<slug>/index.html
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = '/home/user/Nizamuk.Business/site';
const V = { css: '20260801h', analytics: '20260801a', main: '20260801b' };

/* slug = public URL, key = internal quiz key. The mismatch is deliberate and
   already documented in config.js; this is the second place it is reconciled. */
const PATTERNS = [
  {
    slug: 'mubdia', cover: 'mubdia', key: 'mubdia', name: 'المبدعة المشتّتة',
    truth: 'لا تنقصكِ الأفكار، تنقصكِ فكرة واحدة تصل.',
    headline: 'ليس الهرب من الإنجاز، بل من منتصف الطريق. البداية تعطيها نسخة جديدة منها، لكنها تسحبها من الشيء الذي كان على وشك الوصول.',
    wound: 'الذي يتكرر ليس نقص قدرة، بل صعوبة البقاء مع الفكرة عندما يبهت بريقها وتطلب صبرًا بدل حماس.',
    lamhat: 'https://dodo.pe/lamhat-mubdia-inter',
    rebuild: '/rebuild/mubdia/',
    article: '/maqalat/idman-al-bidayat/',
    articleName: 'لماذا يختفي الحماس بعد البداية؟'
  },
  {
    slug: 'asirat', cover: 'asira', key: 'asira', name: 'أسيرة الكمال',
    truth: 'نقص العمل لا يعني نقصًا فيها.',
    headline: 'ليس الخوف من العمل، بل من لحظة ظهوره أمام عين أخرى. لذلك صار التعديل بيتًا آمنًا تسكنه بدل التسليم.',
    wound: 'الذي يتكرر أن جودة الشغل التصقت بقيمتها هي، فصارت كل ملاحظة محتملة على العمل تهديدًا شخصيًا.',
    lamhat: 'https://dodo.pe/lamhat-asirat-inter',
    rebuild: '/rebuild/asirat/',
    article: '/maqalat/al-taswif-laysa-mushkilat-waqt/',
    articleName: 'التسويف ليس مشكلة وقت'
  },
  {
    slug: 'mutafadia', cover: 'mutafadiya', key: 'mutafadiya', name: 'المتفادية الذكية',
    truth: 'لا تتجنب المهمة، بل الشعور الذي خلفها.',
    headline: 'ليست كسولة، ويومها مليء بالإنجاز الصغير. لكن الباب الواحد المهم يكبر في الخيال كل يوم تأجيل، حتى يصير أكبر من حجمه.',
    wound: 'الذي يتكرر أن الشعور خلف المهمة، توتر أو حكم أو مواجهة، يصل قبلها، فتُشترى هدنة يومية بثمن أسبوع.',
    lamhat: 'https://dodo.pe/lamhat-mutafadia-inter',
    rebuild: '/rebuild/mutafadia/',
    article: '/maqalat/al-taswif-laysa-mushkilat-waqt/',
    articleName: 'التسويف ليس مشكلة وقت'
  },
  {
    slug: 'kafua', cover: 'kafua', key: 'kafua', name: 'الكفؤة المنهَكة',
    truth: 'أن تكون قادرة لا يعني أن تكون متاحة دائمًا.',
    headline: 'الجميع يظن أنها بخير لأنها دائمًا تتصرف. لكن قدرتها صارت تصريح دخول مفتوحًا للجميع، إلا لها.',
    wound: 'الذي يتكرر أن كل «نعم» سريعة تشتري راحة العلاقة لحظة، وتدفع ثمنها من طاقتها ومشروعها وما يخصها.',
    lamhat: 'https://dodo.pe/lamhat-kafua-inter',
    rebuild: '/rebuild/kafua/',
    article: '/maqalat/al-kasal-wa-ilajuh/',
    articleName: 'الكسل وعلاجه، وماذا لو كان عارضًا لشيء آخر'
  }
];

const page = (p) => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>نمط ${p.name} في اختبار نظامك | نظامك</title>
  <meta name="description" content="${p.name}: ${p.truth} تعرّفي إلى النمط، ثم اكتشفي نمطكِ أنتِ في اثني عشر مشهدًا خلال ثلاث دقائق، بلا بريد وبلا دفع.">
  <link rel="canonical" href="https://nizamok.com/natija/${p.slug}/">
  <link rel="alternate" hreflang="ar" href="https://nizamok.com/natija/${p.slug}/">
  <link rel="alternate" hreflang="x-default" href="https://nizamok.com/natija/${p.slug}/">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:site_name" content="نظامك">
  <meta property="og:title" content="نمطي في اختبار نظامك: ${p.name}">
  <meta property="og:description" content="${p.truth} اكتشفي نمطكِ في ثلاث دقائق، بلا بريد وبلا دفع.">
  <meta property="og:url" content="https://nizamok.com/natija/${p.slug}/">
  <meta property="og:image" content="https://nizamok.com/assets/share/natija-${p.slug}.jpg?v=1">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="نمط ${p.name} من اختبار نظامك">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="نمطي في اختبار نظامك: ${p.name}">
  <meta name="twitter:description" content="${p.truth} اكتشفي نمطكِ في ثلاث دقائق.">
  <meta name="twitter:image" content="https://nizamok.com/assets/share/natija-${p.slug}.jpg?v=1">

  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/assets/img/seal.png">
  <link rel="apple-touch-icon" href="/assets/img/seal.png">
  <link rel="preload" href="/assets/fonts/almarai-400-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/css/main.css?v=${V.css}">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "name": "نمط ${p.name} في اختبار نظامك",
        "description": "${p.truth}",
        "url": "https://nizamok.com/natija/${p.slug}/",
        "inLanguage": "ar",
        "primaryImageOfPage": { "@type": "ImageObject", "url": "https://nizamok.com/assets/share/natija-${p.slug}.jpg?v=1", "width": 1200, "height": 630 },
        "isPartOf": { "@type": "WebSite", "name": "نظامك", "url": "https://nizamok.com/" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://nizamok.com/" },
          { "@type": "ListItem", "position": 2, "name": "الاختبار", "item": "https://nizamok.com/ikhtibar/" },
          { "@type": "ListItem", "position": 3, "name": "${p.name}" }
        ]
      }
    ]
  }
  </script>
</head>
<body data-lang-alt="/en/quiz/">

<header class="site-header">
  <div class="container nav">
    <a class="brand" href="/">
      <img class="seal-img" src="/assets/img/seal.png" alt="ختم نظامك">
      <img class="wordmark-img" src="/assets/img/wordmark.png" alt="NizamOk">
    </a>
    <button class="nav-toggle" aria-label="القائمة"><span></span><span></span><span></span></button>
    <nav class="nav-links">
      <a href="/">الرئيسية</a>
      <a href="/maqalat/">مقالات</a>
      <a href="/almasar/">المسار</a>
      <a class="btn btn-rose" href="/ikhtibar/?source=natija_${p.slug}&amp;origin=share">ابدئي الاختبار</a>
    </nav>
  </div>
</header>

<main class="section">
  <div class="container legal-wrap">

    <nav class="crumbs" aria-label="مسار التصفح">
      <a href="/">الرئيسية</a><span aria-hidden="true">/</span>
      <a href="/ikhtibar/">الاختبار</a><span aria-hidden="true">/</span>
      <span aria-current="page">${p.name}</span>
    </nav>

    <article class="legal-card">

      <span class="art-kicker">نمط من أنماط نظامك الأربعة</span>
      <h1>${p.name}</h1>
      <p class="art-byline">${p.truth}</p>
      <div class="ornament"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/><circle cx="12" cy="12" r="2.6"/></svg></div>

      <p class="art-lead">وصلتِ إلى هذه الصفحة لأن إحداهنّ أخذت اختبار نظامك وخرجت بهذا النمط.<br>
      وهذه قراءته المختصرة. أما نمطكِ أنتِ فقد يكون هذا، وقد يكون واحدًا من ثلاثة أخرى.</p>

      <h2>ما الذي يبدو أنه يحدث؟</h2>
      <p>${p.headline}</p>

      <h2>ما الذي يتكرر؟</h2>
      <p>${p.wound}</p>

      <p class="art-pull">وهذا توصيف لنمط سلوكي يومي، لا حكم على الشخصية ولا تشخيص نفسي.</p>

      <div class="art-bridge">
        <span class="art-bridge-h">وما نمطكِ أنتِ؟</span>
        <p>الأنماط الأربعة تتشابه من الخارج وتختلف في العلاج تمامًا. اثنا عشر مشهدًا من يومكِ في ثلاث دقائق، بلا بريد وبلا دفع، ويقرأ مزيجكِ لا خانتكِ.</p>
        <a class="btn btn-rose art-bridge-btn" href="/ikhtibar/?source=natija_${p.slug}&amp;origin=share" data-ev="quiz_click_from_share" data-section="natija_${p.slug}">اكتشفي نمطكِ مجانًا خلال 3 دقائق</a>
      </div>

      <h2>وإن كان هذا نمطكِ فعلًا</h2>

      <p>فالخطوة التالية ليست نظامًا كاملًا من أول لقاء. «لمحات» كرّاسة قصيرة ترين فيها النمط وهو يعمل في يومكِ: علاماته، وثغراته، ولحظاته، وخريطة تعرّف في ثلاثة أيام.</p>

      <div class="art-types">
        <article class="art-type">
          <a href="${p.rebuild}?source=natija_${p.slug}" aria-label="نظام ${p.name}">
            <picture><source srcset="/assets/covers/rebuild/rebuild-${p.cover}.webp?v=2" type="image/webp"><img src="/assets/covers/rebuild/rebuild-${p.cover}.jpg?v=2" alt="غلاف نظام ${p.name}" loading="lazy" width="180" height="270"></picture>
          </a>
          <div>
            <span class="art-type-h">لمحات ${p.name}، 19 ر.س</span>
            <p>المرآة الكاملة للنمط في كرّاسة واحدة. وإن أردتِ بعدها المسار التطبيقي الكامل، فهو في <a href="${p.rebuild}?source=natija_${p.slug}" data-ev="rebuild_card_click" data-pattern="${p.key}" data-level="rebuild" data-section="natija_${p.slug}">نظام إعادة بناء ${p.name}</a>.</p>
            <p class="art-type-fix"><a href="${p.lamhat}" rel="nofollow noopener" target="_blank" data-ev="lamhat_click" data-pattern="${p.key}" data-level="lamhat" data-section="natija_${p.slug}">ابدئي بلمحات، 19 ر.س</a></p>
          </div>
        </article>
      </div>

      <p>وللقراءة المجانية أولًا: <a href="${p.article}">${p.articleName}</a>.</p>

      <p class="art-note">محتوى نظامك مخصص للفهم الذاتي والتنظيم العملي، ولا يُعدّ تشخيصًا نفسيًا ولا بديلًا عن مختصة مؤهلة.</p>

    </article>
  </div>
</main>

<footer class="site-footer velvet">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img class="wordmark-img" src="/assets/img/wordmark.png" alt="NizamOk">
        <span>مسار عربي للفهم الذاتي والتنظيم العملي.</span>
      </div>
      <nav class="footer-links">
        <a href="/ikhtibar/?source=natija_${p.slug}&amp;origin=share">الاختبار</a>
        <a href="/almasar/">المسار</a>
        <a href="/maqalat/">مقالات</a>
        <a href="/interdash/">لوحة نمطكِ</a>
        <a href="/privacy/">سياسة الخصوصية</a>
        <a href="/terms/">الشروط والأحكام</a>
      </nav>
    </div>
    <p class="disclaimer">محتوى نظامك مخصص للفهم الذاتي والتنظيم العملي، ولا يُعدّ تشخيصًا نفسيًا أو بديلًا عن مختص. © <span data-year></span> نظامك</p>
  </div>
</footer>

<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=${V.analytics}"></script>
<script src="/assets/js/main.js?v=${V.main}" defer></script>
</body>
</html>
`;

for (const p of PATTERNS) {
  const dir = join(ROOT, 'natija', p.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(p));
  console.log(`  /natija/${p.slug.padEnd(11)} ${p.name}`);
}
console.log(`\n${PATTERNS.length} صفحات نتيجة قابلة للمشاركة.`);
