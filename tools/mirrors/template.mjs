/*
  قالب «مرايا نظامك».

  النموذج الأولي وضع الأسئلة والنتائج كلها في mirror-data.js وحقنها بعد
  التحميل. وهذا ينقض حجّة المرايا نفسها: بُنيت لتكون صفحةً لا يستطيع محرّك
  البحث أن يلخّصها بدلًا عن الزائرة — فإن لم يكن في الصفحة نصّ، فلا شيء
  يُلخَّص ولا شيء يُرتَّب.

  فهنا كل حرفٍ في HTML قبل أي جافاسكربت، في ثلاث طبقات:

    ١. مقدمة تُقرأ قبل التفاعل — تشرح الفرق الذي تقيسه المرآة. وهي ما
       يمنح الصفحة عمقًا موضوعيًا، فلا تُقرأ واجهةً فارغة.
    ٢. التفاعل — الأسئلة وإجاباتها عناصر حقيقية، وكل إجابة تحمل آليتها في
       data-dim. فالجافاسكربت لا يعرف نصًّا، إنما يجمع نقاطًا ويُظهر ويُخفي.
    ٣. تفسير ظاهر بعد التفاعل — الآليات الثلاث موصوفةً، تُقرأ بلا إجابة أي
       سؤال. هذه هي التي تمنع الصفحة من أن تُقرأ «حالات اختبارٍ مخفية».

  والنتائج الثلاث موجودة في HTML أيضًا لكنها hidden: إحداها مخرَجٌ شخصي لا
  يصلح أن يُعرض للجميع، وتفسيرها العام ظاهرٌ في الطبقة الثالثة.

  ولا بوابة بريد، ولا سؤال قبل النتيجة، ولا ادعاء تشخيص.
*/

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SITE = 'https://nizamok.com';

export function renderMirror(m) {
  const url = `${SITE}/mirrors/${m.slug}/`;
  const dims = Object.keys(m.results);

  const questions = m.questions.map((q, i) => `
        <fieldset class="mr-q" data-q="${i}"${i ? ' hidden' : ''}>
          <legend class="mr-q-t">${q.text}</legend>
${q.answers.map(a => `          <button type="button" class="mr-a" data-dim="${a.dim}">${a.text}</button>`).join('\n')}
        </fieldset>`).join('\n');

  /* سؤال الحسم: لا يُعرض إلا حين تتعادل آليتان، وإجاباته تُبنى من عبارتيهما.
     فالتعادل يُحسم باختيارها هي، لا بترتيب المفاتيح في الشريحة. */
  const tiebreak = `
        <fieldset class="mr-q mr-tb" data-tiebreak hidden>
          <legend class="mr-q-t">${m.tiebreakH}</legend>
${dims.map(d => `          <button type="button" class="mr-a" data-dim="${d}" data-tb hidden>${m.tb[d]}</button>`).join('\n')}
        </fieldset>`;

  const results = dims.map(d => {
    const r = m.results[d];
    return `
        <article class="mr-result" data-result="${d}" hidden>
          <p class="mr-result-k">ما يبدو من إجاباتكِ</p>
          <h2 class="mr-result-t">${r.title}</h2>
          <p class="mr-result-s">${r.summary}</p>
          <p class="mr-result-r"><b>ولماذا يتكرر؟</b> ${r.repeats}</p>
          <p class="mr-result-a"><b>حركة واحدة اليوم:</b> ${r.action}</p>
        </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(m.title)} | نظامك</title>
  <meta name="description" content="${esc(m.description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="نظامك">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:title" content="${esc(m.title)}">
  <meta property="og:description" content="${esc(m.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/img/quiz-result.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="preload" href="/assets/fonts/almarai-400-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/el-messiri-700-arabic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/css/main.css?v=20260804b">
  <link rel="stylesheet" href="/assets/css/mirrors.css?v=20260804a">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "${esc(m.title)}",
    "url": "${url}",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Any",
    "inLanguage": "ar",
    "isAccessibleForFree": true,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "SAR" },
    "publisher": { "@type": "Organization", "name": "نظامك", "url": "${SITE}/" },
    "description": "${esc(m.description)}"
  }
  </script>
</head>
<body class="mr-body" data-ambient data-lang-alt="/en/" data-mirror="${m.slug}">

<div class="mr-wrap">
  <div class="container mr-narrow">

    <header class="mr-top">
      <a class="mr-brand" href="/" aria-label="نظامك، الصفحة الرئيسية">
        <img src="/assets/img/wordmark.png" alt="نظامك" width="460" height="150" loading="eager">
      </a>
      <a class="mr-home" href="/mirrors/"><span aria-hidden="true">⌂</span> كل المرايا</a>
    </header>

    <p class="mr-kicker">${m.slugAr} · ${m.pattern}</p>
    <h1 class="mr-h1">${m.title}</h1>
    <p class="mr-lead">${m.description}</p>

    <!-- ====== الطبقة ١: مقدمة تُقرأ قبل أي تفاعل ====== -->
    <section class="mr-intro" aria-labelledby="introH">
      <h2 id="introH" class="mr-h2">${m.introH}</h2>
${m.intro.map(p => `      <p>${p}</p>`).join('\n')}
    </section>

    <!-- ====== الطبقة ٢: التفاعل، وأسئلته في HTML لا في جافاسكربت ====== -->
    <section class="mr-tool" aria-labelledby="toolH">
      <h2 id="toolH" class="mr-h2">أربعة مواقف، أقلّ من دقيقة</h2>
      <p class="mr-note">لا بريد، ولا تسجيل. النتيجة تظهر فور الإجابة الرابعة.</p>

      <div class="mr-bar" role="presentation"><span data-bar></span></div>

      <form class="mr-form" data-form>
${questions}
${tiebreak}
      </form>

      <div class="mr-out" data-out hidden>
${results}

        <div class="mr-next">
          <a class="mr-cta" href="/ikhtibar/" data-quiz>اعرفي نمطكِ الكامل، ٣ دقائق مجانًا</a>
          <div class="mr-next-row">
            <a class="mr-ghost" href="${m.lamhat}" data-lamhat>لمحة ${m.pattern} · ١٩ ر.س</a>
            <button type="button" class="mr-ghost" data-restart>أعيدي المرآة</button>
          </div>
          <div class="mr-share" data-share-row></div>
        </div>
      </div>
    </section>

    <!-- ====== الطبقة ٣: تفسير ظاهر، يُقرأ بلا إجابة أي سؤال ====== -->
    <section class="mr-interp" aria-labelledby="interpH">
      <h2 id="interpH" class="mr-h2">${m.interpH}</h2>
      <ul class="mr-mech" role="list">
${m.interp.map(i => `        <li><b>${i.t}</b><span>${i.d}</span></li>`).join('\n')}
      </ul>
      <p class="mr-more">وللقراءة الأطول: <a href="${m.article}">${m.articleName}</a>.</p>
    </section>

    <p class="mr-disc">هذه المرآة أداة للفهم الذاتي والتنظيم العملي، وليست تشخيصًا نفسيًا ولا بديلًا عن استشارة مختصة.</p>

    <nav class="mr-foot-nav">
      <a href="/">الرئيسية</a>
      <a href="/mirrors/">المرايا</a>
      <a href="/ikhtibar/">الاختبار</a>
      <a href="/almasar/">المسار</a>
      <a href="/maqalat/">المقالات</a>
      <a href="/privacy/">الخصوصية</a>
    </nav>

  </div>
</div>

<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=20260801a"></script>
<script src="/assets/js/mirrors.js?v=20260804a" defer></script>
<script src="/assets/js/main.js?v=20260801b" defer></script>
</body>
</html>
`;
}

export function renderIndex(mirrors) {
  const url = `${SITE}/mirrors/`;
  const desc = 'مرايا قصيرة من نظامك: أربعة مواقف في أقلّ من دقيقة، تفرّق بين آلياتٍ تتشابه في الشعور وتختلف في العلاج.';
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>مرايا نظامك: أدوات قصيرة تفرّق بين ما يتشابه | نظامك</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="نظامك">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:title" content="مرايا نظامك">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/img/quiz-result.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="index,follow">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/fonts/fonts.css">
  <link rel="stylesheet" href="/assets/css/main.css?v=20260804b">
  <link rel="stylesheet" href="/assets/css/mirrors.css?v=20260804a">
</head>
<body class="mr-body" data-ambient data-lang-alt="/en/">
<div class="mr-wrap">
  <div class="container mr-narrow">
    <header class="mr-top">
      <a class="mr-brand" href="/" aria-label="نظامك، الصفحة الرئيسية">
        <img src="/assets/img/wordmark.png" alt="نظامك" width="460" height="150" loading="eager">
      </a>
      <a class="mr-home" href="/"><span aria-hidden="true">⌂</span> الصفحة الرئيسية</a>
    </header>

    <p class="mr-kicker">مرايا نظامك</p>
    <h1 class="mr-h1">أشياء كثيرة تتشابه في الشعور، وتختلف في العلاج.</h1>
    <p class="mr-lead">${desc}</p>

    <section class="mr-intro">
      <p>«فقدتُ الشغف»، و«لم يجهز بعد»، و«أنا مشغولة» — ثلاث جملٍ تُقال عن مواقف مختلفة تمامًا، ولكلٍّ منها حركةٌ مختلفة تُخرج منه. المرآة لا تعطيكِ نمطكِ ولا تشخّصكِ؛ تفرّق بين آليتين أو ثلاث تتشابه في الإحساس.</p>
      <p>وإن أردتِ نمطكِ الكامل ونسب تركيبتكِ، فذلك <a href="/ikhtibar/">الاختبار</a>: اثنا عشر موقفًا في ثلاث دقائق، بلا بريد وبلا دفع.</p>
    </section>

    <ul class="mr-cards" role="list">
${mirrors.map(m => `      <li class="mr-card">
        <a href="/mirrors/${m.slug}/">
          <span class="mr-card-k">${m.pattern}</span>
          <b>${m.title}</b>
          <span class="mr-card-d">${m.description}</span>
          <span class="mr-card-go">ابدئي المرآة ←</span>
        </a>
      </li>`).join('\n')}
    </ul>

    <p class="mr-disc">هذه المرايا أدوات للفهم الذاتي والتنظيم العملي، وليست تشخيصًا نفسيًا ولا بديلًا عن استشارة مختصة.</p>

    <nav class="mr-foot-nav">
      <a href="/">الرئيسية</a>
      <a href="/ikhtibar/">الاختبار</a>
      <a href="/almasar/">المسار</a>
      <a href="/maqalat/">المقالات</a>
      <a href="/privacy/">الخصوصية</a>
    </nav>
  </div>
</div>
<script src="/assets/js/config.js"></script>
<script src="/assets/js/analytics.js?v=20260801a"></script>
<script src="/assets/js/main.js?v=20260801b" defer></script>
</body>
</html>
`;
}
