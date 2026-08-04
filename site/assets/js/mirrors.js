/*
  NizamOk — مرايا نظامك.

  هذا الملف لا يحمل نصًّا واحدًا من نصوص المرآة. الأسئلة والإجابات والنتائج
  كلها في HTML، مطبوعةً وقت البناء من tools/mirrors/. وما يفعله هنا ثلاثة
  أشياء فقط: يجمع النقاط من data-dim، ويُظهر ويُخفي، ويرسل الأحداث.

  وهذا شرط الفكرة لا تفصيلًا فيها: المرآة بُنيت لتكون صفحةً لا يلخّصها محرّك
  البحث بدلًا عن الزائرة. فلو كان نصّها في جافاسكربت، لم يكن هناك نصٌّ
  يُفهرَس أصلًا.

  الأحداث تمرّ بـtrackEvent المشترك في analytics.js:
    mirror_start · mirror_answer · mirror_complete · mirror_share
    mirror_quiz_click · mirror_restart
*/
(function () {
  'use strict';

  var root = document.querySelector('[data-form]');
  if (!root) return;

  var slug = document.body.getAttribute('data-mirror') || 'unknown';
  var out = document.querySelector('[data-out]');
  var bar = document.querySelector('[data-bar]');
  var qs = [].slice.call(root.querySelectorAll('.mr-q:not(.mr-tb)'));
  var tbSet = root.querySelector('[data-tiebreak]');
  var total = qs.length;

  var scores = {};
  var step = 0;
  var startedAt = 0;
  var started = false;

  function track(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params || {});
  }

  /* معاملات الحملة الواردة تُمرَّر كما هي، ويُضاف mirror، فتُعرف المرآة التي
     أرسلت الزائرة إلى الاختبار. */
  function attribution() {
    var q = new URLSearchParams(location.search);
    var p = { mirror_id: slug, mirror_pattern: document.querySelector('.mr-kicker') ? document.querySelector('.mr-kicker').textContent.trim() : '' };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (q.get(k)) p[k] = q.get(k);
    });
    if (q.get('gclid')) p.has_gclid = true;
    return p;
  }

  function quizUrl() {
    var u = new URL('/ikhtibar/', location.origin);
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (q.get(k)) u.searchParams.set(k, q.get(k));
    });
    if (!u.searchParams.get('utm_source')) u.searchParams.set('utm_source', 'nizamok_mirror');
    if (!u.searchParams.get('utm_medium')) u.searchParams.set('utm_medium', 'interactive');
    if (!u.searchParams.get('utm_campaign')) u.searchParams.set('utm_campaign', slug);
    u.searchParams.set('mirror', slug);
    return u.toString();
  }

  function setBar(n) { if (bar) bar.style.width = Math.round((n / (total + 1)) * 100) + '%'; }

  /* الترتيب النازل، ثم: هل تعادل الأول والثاني؟ */
  function ranked() {
    return Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
  }
  function tied() {
    var r = ranked();
    return r.length > 1 && scores[r[0]] === scores[r[1]];
  }

  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }

  function askTiebreak() {
    var r = ranked();
    var a = r[0], b = r[1];
    [].slice.call(tbSet.querySelectorAll('[data-tb]')).forEach(function (btn) {
      var d = btn.getAttribute('data-dim');
      btn.hidden = (d !== a && d !== b);
    });
    show(tbSet);
    setBar(total + 0.5);
    var first = tbSet.querySelector('[data-tb]:not([hidden])');
    if (first) first.focus();
  }

  function finish(dim) {
    hide(tbSet);
    qs.forEach(hide);
    var panel = out.querySelector('[data-result="' + dim + '"]');
    show(panel);
    show(out);
    setBar(total + 1);

    var link = out.querySelector('[data-quiz]');
    if (link) link.href = quizUrl();

    buildShare(panel);

    var p = attribution();
    p.result_dimension = dim;
    p.completion_seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    track('mirror_complete', p);

    out.setAttribute('tabindex', '-1');
    out.focus({ preventScroll: false });
  }

  /* المشاركة يبنيها share-article.js نفسه الذي يبنيها في المقالات، فالأزرار
     واحدة في الموقع كلّه: خمس منصّات، ومشاركة الهاتف الأصلية، ونسخ الرابط.
     ونصّ النتيجة يُمرَّر إليه، فلا يُكتب هنا حرفٌ من نصوص المرآة. */
  function buildShare(panel) {
    var row = out.querySelector('[data-share-row]');
    if (!row || typeof window.nzShare !== 'function') return;
    var t = panel.querySelector('.mr-result-t');
    var line = t ? t.textContent.trim() : document.title;
    var url = location.origin + location.pathname;
    row.setAttribute('data-share-title', line);
    row.setAttribute('data-share-url', url);
    window.nzShare(row, {
      title: line,
      url: url,
      context: 'mirror',
      heading: 'عرفتِ إحداهنّ في هذه النتيجة؟',
      sub: 'أرسليها لها، فقد توفّر عليها شهورًا من المحاولة في الاتجاه الخطأ.'
    });
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.mr-a') : null;
    if (!btn) return;
    var dim = btn.getAttribute('data-dim');

    if (!started) {
      started = true; startedAt = Date.now();
      track('mirror_start', attribution());
    }

    /* إجابة سؤال الحسم تُنهي المرآة مباشرة. */
    if (btn.hasAttribute('data-tb')) {
      var p = attribution(); p.result_dimension = dim; p.tiebreak = true;
      track('mirror_answer', p);
      finish(dim);
      return;
    }

    scores[dim] = (scores[dim] || 0) + 1;

    var pa = attribution();
    pa.question_index = step + 1;
    pa.answer_dimension = dim;
    track('mirror_answer', pa);

    hide(qs[step]);
    step++;
    setBar(step);

    if (step < total) {
      show(qs[step]);
      var lg = qs[step].querySelector('.mr-a');
      if (lg) lg.focus();
      return;
    }

    /* تعادل الأولَين؟ سؤالٌ واحد يحسمه. وإلا فترتيب المفاتيح هو من يقرّر،
       وهو ترتيبٌ لا معنى له نفسيًا. */
    if (tied()) { askTiebreak(); return; }
    finish(ranked()[0]);
  });

  var restart = document.querySelector('[data-restart]');
  if (restart) {
    restart.addEventListener('click', function () {
      scores = {}; step = 0; started = false; startedAt = 0;
      [].slice.call(out.querySelectorAll('[data-result]')).forEach(hide);
      hide(out); hide(tbSet);
      qs.forEach(function (q, i) { q.hidden = i !== 0; });
      setBar(0);
      track('mirror_restart', attribution());
      var f = qs[0] && qs[0].querySelector('.mr-a');
      if (f) f.focus();
      root.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  var quizLink = document.querySelector('[data-quiz]');
  if (quizLink) {
    quizLink.href = quizUrl();
    quizLink.addEventListener('click', function () { track('mirror_quiz_click', attribution()); });
  }
  var lamhatLink = document.querySelector('[data-lamhat]');
  if (lamhatLink) {
    lamhatLink.addEventListener('click', function () {
      var p = attribution(); p.level = 'lamhat';
      track('mirror_lamhat_click', p);
    });
  }

  setBar(0);
})();
