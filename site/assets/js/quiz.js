/* ============================================================
   اختبار نظامك — cinematic two-act quiz engine.
   Mechanic: per scene, choose الأقرب then الأبعد (+2 / −1),
   normalized to percentages across the four patterns.
   ============================================================ */
(function () {
  'use strict';

  const CONFIG = window.NIZAMOK || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ---------- The four patterns ---------- */
  const patterns = {
    mubdia: {
      name: 'المبدعة المشتّتة',
      short: 'تشتعلين بفكرة جديدة قبل أن تحمي الفكرة التي كانت قريبة من الوصول.',
      truth: 'أنتِ لا تنقصكِ الأفكار؛ تنقصكِ فكرة واحدة تصل.',
      headline: 'يبدو أنكِ تتحركين بقوة مع البدايات. الفكرة الجديدة تعطيكِ شعورًا جميلًا بالاتساع، لكنها أحيانًا تسحبكِ من الشيء الذي كان قريبًا من الوصول.',
      wound: 'ما يتكرر هنا ليس نقصًا في القدرة، بل صعوبة في البقاء مع منتصف الطريق عندما يصبح أقل لمعانًا وأكثر طلبًا للصبر.',
      step: 'اختاري فكرة واحدة لهذا الأسبوع. لا تلغي باقي الأفكار؛ فقط اتركيها في مكان آمن حتى تعطين فكرة واحدة حقها في الوصول.'
    },
    asira: {
      name: 'أسيرة الكمال',
      short: 'تؤجلين الظهور لأن العمل لم يصل بعد إلى الصورة التي لا تُنتقد.',
      truth: 'نقص العمل لا يعني نقصًا فيكِ.',
      headline: 'يبدو أنكِ لا تخافين من العمل نفسه، بل من ظهوره ناقصًا أمام عين أخرى. لذلك يصبح التعديل طريقة لتهدئة القلق، لا دائمًا لتحسين النتيجة.',
      wound: 'ما يتكرر هنا أن جودة العمل تختلط بقيمتكِ الشخصية. كأن كل ملاحظة على العمل ستصبح ملاحظة عليكِ أنتِ.',
      step: 'قبل أي تعديل جديد، اسألي: هل هذا يخدم العمل فعلًا، أم يخفف قلقي فقط؟ ثم أخرجي نسخة قابلة للتحسين.'
    },
    mutafadiya: {
      name: 'المتفادية الذكية',
      short: 'تعرفين الباب الذي يجب فتحه، لكن الشعور خلفه يبدو أثقل من المهمة نفسها.',
      truth: 'أنتِ لا تتجنبين المهمة، بل الشعور الذي خلفها.',
      headline: 'يبدو أنكِ تعرفين غالبًا ما يجب فعله، لكن الاقتراب من المهمة يفتح شعورًا غير مريح؛ فتبدين منشغلة، بينما الباب الأساسي يبقى كما هو.',
      wound: 'ما يتكرر هنا أن الشعور يكبر قبل المهمة نفسها: توتر، غموض، احتمال رفض، أو لحظة مواجهة لا تريدينها الآن.',
      step: 'افتحي الباب دقيقة واحدة فقط. رسالة، ملف، مكالمة، أو قرار. المطلوب ليس إنهاء كل شيء؛ المطلوب أن يصغر الشعور قليلًا.'
    },
    kafua: {
      name: 'الكفؤة المنهَكة',
      short: 'يحملكِ الجميع لأنكِ قادرة، فتغيبين أنتِ عن نهاية يومكِ.',
      truth: 'أن تكوني قادرة لا يعني أن تكوني متاحة دائمًا.',
      headline: 'يبدو أنكِ تعوّدتِ أن تكوني الشخص الذي يعرف ماذا يفعل. هذا جميل، لكنه يصبح مرهقًا حين تتحول القدرة إلى توفر دائم.',
      wound: 'ما يتكرر هنا أن قول «نعم» يريح العلاقة لحظة، لكنه يأخذ من وقتكِ وطاقتكِ وما يخصكِ أنتِ.',
      step: 'قبل الموافقة التالية، اسألي بهدوء: ما ثمن هذه «النعم»؟ وهل هذا دوري فعلًا؟'
    }
  };

  /* ---------- The twelve scenes, arranged in two acts ----------
     Act I  — مشاهد يراها الجميع (outer scenes)
     Act II — الصوت الداخلي (the inner voice)                    */
  const questions = [
    // ---- Act I ----
    {
      act: 1, scene: 'البداية',
      text: 'تبدئين شيئًا جديدًا بحماس. بعد الأيام الأولى، ما الذي يحدث غالبًا؟',
      options: [
        { p: 'mubdia',     t: 'تظهر فكرة ثانية، وأشعر أنها أقرب لما أريد فعله فعلًا.' },
        { p: 'asira',      t: 'أبقى أعدّل لأن النسخة لا تطمئنني بعد.' },
        { p: 'mutafadiya', t: 'أترك الجزء الأثقل، وأشغل نفسي بشيء أسهل.' },
        { p: 'kafua',      t: 'ينسحب وقتي على طلبات الناس، ويختفي مشروعي بهدوء.' }
      ]
    },
    {
      act: 1, scene: 'الرسالة',
      text: 'تصلكِ رسالة تحتاج ردًا واضحًا. ما الذي يحصل عادة؟',
      options: [
        { p: 'mutafadiya', t: 'أؤجل الرد حتى أهدأ أو أعرف ماذا أقول بالضبط.' },
        { p: 'asira',      t: 'أكتب الرد ثم أعدله أكثر من مرة، حتى لا أبدو ناقصة أو قاسية.' },
        { p: 'kafua',      t: 'أرد بسرعة حتى لا ينتظرني أحد أو يزعل مني.' },
        { p: 'mubdia',     t: 'أفتح شيئًا آخر فجأة، وكأن الرد قطع عليّ مزاجي.' }
      ]
    },
    {
      act: 1, scene: 'المديح',
      text: 'عندما يقولون لكِ: «ما شاء الله عليكِ، دائمًا تتصرفين»، ماذا تشعرين؟',
      options: [
        { p: 'kafua',      t: 'أفرح قليلًا، ثم أشعر أنني صرت مسؤولة أكثر.' },
        { p: 'asira',      t: 'أخاف أن أخيب الصورة التي أخذوها عني، فأرفع المعيار أكثر.' },
        { p: 'mutafadiya', t: 'أستخدم الانشغال كسبب مقبول لتأجيل ما يخصني.' },
        { p: 'mubdia',     t: 'أفكر في شيء جديد يثبت أنني لست محصورة في هذا الدور.' }
      ]
    },
    {
      act: 1, scene: 'المهمة الأهم',
      text: 'أمام مهمة تعرفين أنها مهمة فعلًا، أين يذهب تركيزكِ؟',
      options: [
        { p: 'mutafadiya', t: 'إلى الترتيب والتحضير والبحث، بدل فتح الجزء الأصعب.' },
        { p: 'mubdia',     t: 'إلى فكرة جديدة تبدو أذكى وأخف من المهمة الحالية.' },
        { p: 'asira',      t: 'إلى التعديل؛ أحتاج أن أطمئن أكثر قبل أن أُخرجها.' },
        { p: 'kafua',      t: 'إلى طلب آخر من أحد، ثم أقول لنفسي إن اليوم انتهى.' }
      ]
    },
    {
      act: 1, scene: 'اليوم المزدحم',
      text: 'في اليوم المزدحم، ما أول شيء يسقط من حسابكِ؟',
      options: [
        { p: 'kafua',      t: 'راحتي وما يخصني، لأن طلبات الآخرين تدخل قبلهما.' },
        { p: 'mutafadiya', t: 'المهمة التي فيها توتر أو مواجهة، حتى لو كانت الأهم.' },
        { p: 'asira',      t: 'التسليم النهائي؛ يظل العمل قريبًا من النهاية ولا يخرج.' },
        { p: 'mubdia',     t: 'الاستمرار في الشيء القديم، لأن الجديد يعيد لي الطاقة.' }
      ]
    },
    {
      act: 1, scene: 'المرآة',
      text: 'أي مشهد من هذه المشاهد يشبهكِ أكثر؟',
      options: [
        { p: 'mubdia',     t: 'مجلدات وأسماء وأفكار كثيرة، ولا شيء وصل للناس بوضوح.' },
        { p: 'asira',      t: 'ملف مفتوح لأيام لأن النسخة الأخيرة لم تطمئنني.' },
        { p: 'mutafadiya', t: 'رسالة أو قرار أؤجله، وكل يوم يصبح أثقل.' },
        { p: 'kafua',      t: 'أقول «عادي» وأنا أعرف أنني سأدفع الثمن من طاقتي لاحقًا.' }
      ]
    },
    // ---- Act II ----
    {
      act: 2, scene: 'العقد الصامت',
      text: 'أي جملة تشبه العقد غير المعلن بينكِ وبين نفسك؟',
      options: [
        { p: 'asira',      t: 'إذا ظهر النقص في عملي، سيحسبونه نقصًا فيّ.' },
        { p: 'mutafadiya', t: 'إذا اقتربت الآن، سأضطر لمواجهة شعور لا أريده.' },
        { p: 'mubdia',     t: 'إذا اخترت طريقًا واحدًا، سأخسر باقي الاحتمالات.' },
        { p: 'kafua',      t: 'إذا لم أتحمل، سأخذلهم أو تتغير مكانتي عندهم.' }
      ]
    },
    {
      act: 2, scene: 'بعد الحماس',
      text: 'عندما يخف الحماس، كيف تفسرين الأمر؟',
      options: [
        { p: 'mubdia',     t: 'أقول ربما هذه ليست الفكرة الصحيحة، وهناك شيء أوسع ينتظرني.' },
        { p: 'asira',      t: 'أشعر أن العمل ليس بالمستوى الذي يليق بي بعد.' },
        { p: 'mutafadiya', t: 'أقول الوقت غير مناسب، وسأعود عندما تتضح الصورة.' },
        { p: 'kafua',      t: 'أقول لا وقت للحماس الآن؛ هناك أشياء يجب أن أتحملها أولًا.' }
      ]
    },
    {
      act: 2, scene: 'المقارنة',
      text: 'عندما ترين من سبقكِ أو ظهر قبلكِ، ما ردّكِ الداخلي؟',
      options: [
        { p: 'asira',      t: 'أصمت أكثر؛ لأن نسختي لا تبدو جاهزة أمام صورتهم المكتملة.' },
        { p: 'mubdia',     t: 'أبحث عن فكرة مختلفة تجعلني أتجاوز الطريق العادي.' },
        { p: 'mutafadiya', t: 'أؤجل الخطوة حتى لا أواجه شعور التأخر.' },
        { p: 'kafua',      t: 'أقول لنفسي إن وقتي ليس لي أصلًا، فلا داعي للمقارنة الآن.' }
      ]
    },
    {
      act: 2, scene: 'النصيحة',
      text: 'أي نصيحة يكررونها عليكِ وتشعرين أنها لا ترى ما يحدث فعلًا؟',
      options: [
        { p: 'mutafadiya', t: '«نظمي وقتكِ»؛ بينما المشكلة في الشعور الذي يسبق المهمة.' },
        { p: 'asira',      t: '«سلّمي وخلاص»؛ كأن الخوف من الحكم عليكِ أمر بسيط.' },
        { p: 'mubdia',     t: '«ركزي على شيء واحد»؛ كأن الفكرة الجديدة لا تسحبكِ فعلًا.' },
        { p: 'kafua',      t: '«ضعي حدودًا»؛ كأن الذنب بعد الحد لا يأخذ منكِ شيئًا.' }
      ]
    },
    {
      act: 2, scene: 'الحلقة',
      text: 'ما الراحة القصيرة التي تعيدكِ إلى نفس الحلقة؟',
      options: [
        { p: 'asira',      t: 'راحة صغيرة بعد تعديل جديد يجعل القلق يهدأ قليلًا.' },
        { p: 'mutafadiya', t: 'هدوء مؤقت عندما أبتعد عن الشيء الثقيل.' },
        { p: 'mubdia',     t: 'نشوة البداية الجديدة قبل أن يأتي ثقل المنتصف.' },
        { p: 'kafua',      t: 'هدوء العلاقة عندما أقول نعم بسرعة.' }
      ]
    },
    {
      act: 2, scene: 'الخطوة الأصدق',
      text: 'لو احتجتِ خطوة واحدة اليوم، أي خطوة تبدو أصدق؟',
      options: [
        { p: 'mubdia',     t: 'أحمي فكرة واحدة من بريق الأفكار الأخرى حتى تصل.' },
        { p: 'asira',      t: 'أُخرج نسخة يمكن تحسينها بدل أن أبقيها مخفية.' },
        { p: 'mutafadiya', t: 'أقترب دقيقة واحدة من الباب الذي أؤجله.' },
        { p: 'kafua',      t: 'أرى ثمن «نعم» قبل أن أقولها.' }
      ]
    }
  ];

  /* ---------- State ---------- */
  const state = {
    index: 0,
    phase: 'closest',          // 'closest' | 'farthest'
    answers: [],               // [{closest: i, farthest: i}]
    actBreakShown: false,
    lastResult: null
  };

  const panels = ['introPanel', 'quizPanel', 'actbreakPanel', 'calcPanel',
                  'revealPanel', 'emailPanel', 'resultPanel'];

  function showPanel(id) {
    panels.forEach(p => { const el = $(p); if (el) el.classList.toggle('active', p === id); });
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Golden pattern-line progress ---------- */
  function updateProgress() {
    const path = $('progressPath');
    if (path) {
      const total = path.getTotalLength();
      const answered = state.answers.filter(a => a && a.closest != null && a.farthest != null).length;
      const frac = Math.min(answered / questions.length, 1);
      const target = total * (1 - frac);
      path.style.strokeDasharray = total;
      if (!reduced && typeof gsap !== 'undefined') {
        gsap.to(path, { strokeDashoffset: target, duration: 0.9, ease: 'power2.out' });
      } else {
        path.style.strokeDashoffset = target;
      }
    }
    const q = questions[state.index];
    if ($('currentQuestion')) $('currentQuestion').textContent = state.index + 1;
    if ($('actLabel')) $('actLabel').textContent = q.act === 1 ? 'الفصل الأول — مشاهد من يومكِ' : 'الفصل الثاني — الصوت الداخلي';
  }

  /* ---------- Question rendering ---------- */
  function renderQuestion() {
    const q = questions[state.index];
    const saved = state.answers[state.index] || { closest: null, farthest: null };
    state.phase = (saved.closest != null && saved.farthest == null) ? 'farthest' : 'closest';
    if (saved.closest != null && saved.farthest != null) state.phase = 'done';

    $('sceneKicker').textContent = 'المشهد ' + (state.index + 1) + ' · ' + q.scene;
    $('questionText').textContent = q.text;
    setPrompt();

    const wrap = $('options');
    wrap.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      if (saved.closest === i) btn.classList.add('closest');
      if (saved.farthest === i) btn.classList.add('farthest');
      btn.innerHTML = '<span class="mark">' +
        (saved.closest === i ? 'الأقرب إليّ' : saved.farthest === i ? 'الأبعد عني' : '') +
        '</span>' + opt.t;
      btn.addEventListener('click', () => choose(i));
      wrap.appendChild(btn);
    });

    $('prevBtn').style.visibility = state.index === 0 ? 'hidden' : 'visible';
    $('quizMsg').textContent = '';
    updateProgress();
    showPanel('quizPanel');
  }

  function setPrompt() {
    const el = $('choosePrompt');
    if (state.phase === 'farthest') {
      el.textContent = 'والآن — الأبعد عنكِ؟';
      el.classList.add('far');
    } else {
      el.textContent = 'اختاري الأقرب إليكِ';
      el.classList.remove('far');
    }
  }

  function choose(i) {
    const saved = state.answers[state.index] || { closest: null, farthest: null };

    // Re-answering a completed question starts it over with a new closest.
    if (state.phase === 'done') {
      state.answers[state.index] = { closest: i, farthest: null };
      state.phase = 'farthest';
      refreshMarks();
      setPrompt();
      updateProgress();
      return;
    }

    if (state.phase === 'closest') {
      saved.closest = i;
      saved.farthest = null;
      state.answers[state.index] = saved;
      state.phase = 'farthest';
      refreshMarks();
      setPrompt();
      return;
    }

    // phase === 'farthest'
    if (saved.closest === i) {
      $('quizMsg').textContent = 'اختاري إجابة مختلفة عن الأقرب.';
      return;
    }
    saved.farthest = i;
    state.answers[state.index] = saved;
    state.phase = 'done';
    refreshMarks();
    updateProgress();
    setTimeout(advance, reduced ? 120 : 480);
  }

  function refreshMarks() {
    const saved = state.answers[state.index] || {};
    const opts = $('options').children;
    Array.from(opts).forEach((el, i) => {
      el.classList.toggle('closest', saved.closest === i);
      el.classList.toggle('farthest', saved.farthest === i);
      el.querySelector('.mark').textContent =
        saved.closest === i ? 'الأقرب إليّ' : saved.farthest === i ? 'الأبعد عني' : '';
    });
    $('quizMsg').textContent = '';
  }

  function advance() {
    // Act break after the last Act-I scene.
    const lastActOne = questions.map(q => q.act).lastIndexOf(1);
    if (state.index === lastActOne && !state.actBreakShown) {
      state.actBreakShown = true;
      showPanel('actbreakPanel');
      return;
    }
    if (state.index < questions.length - 1) {
      state.index++;
      renderQuestion();
      return;
    }
    beginCalculation();
  }

  function prev() {
    if (state.index === 0) return;
    state.index--;
    renderQuestion();
  }

  /* ---------- Scoring (blueprint-faithful) ---------- */
  function calculateResult() {
    const scores = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    state.answers.forEach((ans, qi) => {
      const q = questions[qi];
      if (!ans) return;
      if (ans.closest != null) scores[q.options[ans.closest].p] += 2;
      if (ans.farthest != null) scores[q.options[ans.farthest].p] -= 1;
    });

    const min = Math.min.apply(null, Object.values(scores));
    const shifted = {};
    Object.keys(scores).forEach(k => (shifted[k] = scores[k] - min + 1));
    const total = Object.values(shifted).reduce((a, b) => a + b, 0);
    const pcts = {};
    Object.keys(shifted).forEach(k => (pcts[k] = Math.round((shifted[k] / total) * 100)));
    const order = Object.keys(pcts).sort((a, b) => pcts[b] - pcts[a]);
    pcts[order[0]] += 100 - Object.values(pcts).reduce((a, b) => a + b, 0);
    return { scores, pcts, order };
  }

  /* ---------- Calculation → staged reveal ---------- */
  function beginCalculation() {
    showPanel('calcPanel');
    state.lastResult = calculateResult();
    setTimeout(renderReveal, reduced ? 200 : 2300);
  }

  function renderReveal() {
    const r = state.lastResult;
    const dom = r.order[0];
    $('revealName').textContent = patterns[dom].name;
    $('revealTruth').textContent = patterns[dom].truth;
    $('mixTeaser').innerHTML =
      'ظهر نمطكِ الغالب بنسبة <b>' + r.pcts[dom] + '٪</b> — ومعه نمط خفي يعمل في الخلفية. ' +
      'قراءتكِ الكاملة تكشفه، مع خريطة مزيجكِ عبر الأنماط الأربعة.';
    showPanel('revealPanel');

    if (!reduced && typeof gsap !== 'undefined') {
      gsap.fromTo('#revealName', { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' });
      gsap.fromTo('#revealTruth', { opacity: 0 },
        { opacity: 1, duration: 1.2, delay: 0.7 });
      gsap.fromTo('#mixTeaser, #toEmailBtn', { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1, delay: 1.2, stagger: 0.15 });
    }
  }

  /* ---------- Email gate ---------- */
  async function submitEmail(e) {
    e.preventDefault();
    const email = $('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('emailMsg').textContent = 'يرجى إدخال بريدٍ إلكتروني صحيح.';
      return;
    }
    if (!state.lastResult) state.lastResult = calculateResult();
    $('emailMsg').textContent = 'نفتح القراءة ونجهّز التقرير الأول...';
    await sendPayload(email, state.lastResult);
    renderResult(email);
  }

  async function sendPayload(email, result) {
    const dominant = result.order[0];
    const payload = {
      email: email,
      fields: {
        dominant_pattern: dominant,
        dominant_pattern_name: patterns[dominant].name,
        secondary_pattern: result.order[1],
        secondary_pattern_name: patterns[result.order[1]].name,
        mubdia_percent: String(result.pcts.mubdia),
        asira_percent: String(result.pcts.asira),
        mutafadiya_percent: String(result.pcts.mutafadiya),
        kafua_percent: String(result.pcts.kafua),
        dominant_percent: String(result.pcts[dominant]),
        result_url: location.origin + location.pathname + '?result=' + dominant
      }
    };

    const ml = CONFIG.mailerLite || {};
    const endpoint = (ml.formEndpoints || {})[dominant] || ml.endpoint || '';
    try {
      if (ml.enabled && endpoint) {
        const fd = new FormData();
        fd.append('fields[email]', payload.email);
        Object.entries(payload.fields).forEach(([k, v]) => fd.append('fields[' + k + ']', v));
        await fetch(endpoint, { method: 'POST', body: fd, mode: 'no-cors' });
      }
    } catch (err) {
      if (ml.backupEndpoint) {
        try {
          await fetch(ml.backupEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (e2) { /* keep the visitor moving */ }
      }
    }
    try {
      localStorage.setItem('nizamok_last_result', JSON.stringify({
        payload: payload, pcts: result.pcts, order: result.order,
        at: new Date().toISOString()
      }));
    } catch (e) { /* private mode */ }
  }

  /* ---------- Full result ---------- */
  function renderResult(email) {
    const r = state.lastResult;
    const dom = r.order[0];
    const sec = r.order[1];
    const P = patterns[dom];

    $('resultName').textContent = P.name;
    $('resultTruth').textContent = P.truth;
    $('hiddenPattern').innerHTML =
      '✦ نمطكِ الخفي: <b>' + patterns[sec].name + '</b> بنسبة ' + r.pcts[sec] +
      '٪ — لذلك قد تشعرين أحيانًا أن النمطين يعملان معًا.';

    const bars = $('bars');
    bars.innerHTML = '';
    r.order.forEach(k => {
      const row = document.createElement('div');
      row.className = 'bar-row' + (k === dom ? ' dominant' : '');
      row.innerHTML =
        '<span>' + patterns[k].name + '</span>' +
        '<span class="bar-bg"><span class="bar-fill" data-w="' + r.pcts[k] + '"></span></span>' +
        '<b>' + r.pcts[k] + '٪</b>';
      bars.appendChild(row);
    });

    $('readingHeadline').textContent = P.headline;
    $('readingWound').textContent = P.wound;
    $('readingStep').textContent = P.step;
    $('sentTo').textContent = email || 'بريدكِ';

    // Personalized product path (per-pattern Dodo links).
    const links = (CONFIG.products || {})[dom] || {};
    const prices = CONFIG.pricing || {};
    $('resultPath').innerHTML =
      '<h3>مساركِ حسب نمطكِ</h3>' +
      '<p>ثلاث مراحل بعمقٍ متدرج — تبدئين بما يناسبكِ اليوم، والباقي ينتظركِ.</p>' +
      '<div class="path-cards">' +
        pathCard('tier-lamhat', 'الخطوة 1 · متاحة الآن', 'لمحات نظامكِ',
          'قراءة مركّزة لما يحدث الآن في يومكِ: أين تتعطلين، وما السلوك الذي يخدعكِ.',
          prices.lamhat, links.lamhat, 'افتحي لمحاتكِ') +
        pathCard('tier-juthur', 'الخطوة 2 · القراءة الأعمق', 'جذور نمطكِ',
          'كتاب في أصل النمط: لماذا بدأ، وما الشعور الذي يحميه، ولماذا يعود.',
          prices.juthur, links.juthur, 'اقرئي الجذور') +
        pathCard('tier-rebuild', 'الخطوة 3 · التحول العملي', 'نظام إعادة البناء',
          'نظام عملي كامل يحوّل الفهم إلى حركة: مراحل، أدوات، وخطوات تناسب نمطكِ.',
          prices.rebuild, links.rebuild, 'ابدئي إعادة البناء') +
      '</div>' +
      '<div class="waitlist-banner">' +
        '<p><b>لوحة نظامك التفاعلية — قريبًا.</b> مساحة يومية تنظّم مهامكِ وطاقتكِ حسب نمطكِ، باشتراك شهري ' +
        (((CONFIG.interdash || {}).monthlyPriceSAR) || 29) + ' ريالًا عند الإطلاق.</p>' +
        '<a class="btn btn-ghost" href="' + ((CONFIG.urls || {}).interdash || '/interdash/') + '">انضمي إلى قائمة الانتظار</a>' +
      '</div>';

    showPanel('resultPanel');

    // Draw the mix bars.
    const fills = bars.querySelectorAll('.bar-fill');
    if (!reduced && typeof gsap !== 'undefined') {
      fills.forEach(f => gsap.to(f, { width: f.dataset.w + '%', duration: 1.4, ease: 'power2.out', delay: 0.4 }));
    } else {
      fills.forEach(f => (f.style.width = f.dataset.w + '%'));
    }
  }

  function pathCard(tier, label, title, desc, price, link, cta) {
    const has = !!link;
    return '<div class="path-card ' + tier + '">' +
      '<span class="step-label">' + label + '</span>' +
      '<h4>' + title + '</h4>' +
      '<p>' + desc + '</p>' +
      '<span class="price-line">' + (price != null ? price + ' ريال' : '') + '</span>' +
      (has ? '<a class="btn btn-gold" href="' + link + '" target="_blank" rel="noopener">' + cta + '</a>'
           : '<button class="btn btn-gold" disabled>قريبًا</button>') +
      '</div>';
  }

  /* ---------- Returning visitor via ?result= ---------- */
  function tryRestoreFromUrl() {
    const m = location.search.match(/[?&]result=(\w+)/);
    if (!m || !patterns[m[1]]) return false;
    try {
      const saved = JSON.parse(localStorage.getItem('nizamok_last_result') || 'null');
      if (saved && saved.order && saved.order[0] === m[1]) {
        state.lastResult = { pcts: saved.pcts, order: saved.order };
        renderResult(saved.payload && saved.payload.email);
        return true;
      }
    } catch (e) { /* fall through */ }
    return false;
  }

  /* ---------- Wire up ---------- */
  function init() {
    if (!$('quizPanel')) return;
    if ($('totalQuestions')) $('totalQuestions').textContent = questions.length;

    $('startBtn').addEventListener('click', () => { state.index = 0; renderQuestion(); });
    $('actContinueBtn').addEventListener('click', () => {
      state.index++;
      renderQuestion();
    });
    $('prevBtn').addEventListener('click', prev);
    $('toEmailBtn').addEventListener('click', () => showPanel('emailPanel'));
    $('emailForm').addEventListener('submit', submitEmail);

    if (!tryRestoreFromUrl()) showPanel('introPanel');
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
