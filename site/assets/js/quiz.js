/* ============================================================
   اختبار نظامك — cinematic two-act quiz engine, v2.
   Mechanic per scene: choose الأقرب ثم الأبعد.
   Scoring: closest +2 (Act I) / +3 (Act II — the inner voice
   outweighs the visible day), farthest −1. Options are shuffled
   per session to kill position bias. Results include tie
   handling, a clarity marker, and computed precision mirrors.
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
      truth: 'أنتِ لا تنقصكِ الأفكار؛ تنقصكِ فكرة واحدة تصل.',
      headline: 'أنتِ لا تهربين من الإنجاز — أنتِ تهربين من منتصف الطريق. البداية تعطيكِ نسخة جديدة منكِ، لكنها تسحبكِ من الشيء الذي كان على وشك الوصول.',
      wound: 'الذي يتكرر ليس نقص قدرة، بل صعوبة البقاء مع الفكرة عندما يبهت بريقها وتطلب صبرًا بدل حماس.',
      step: 'اختاري مشروعًا واحدًا تركتِه وهو يستاهل، واحميه من أي فكرة جديدة سبعة أيام فقط. لا تلغي الأفكار — أوقفيها في الموقف.'
    },
    asira: {
      name: 'أسيرة الكمال',
      truth: 'نقص العمل لا يعني نقصًا فيكِ.',
      headline: 'أنتِ لا تخافين من العمل — تخافين من لحظة ظهوره أمام عين أخرى. لذلك صار التعديل بيتًا آمنًا تسكنين فيه بدل التسليم.',
      wound: 'الذي يتكرر أن جودة الشغل التصقت بقيمتكِ أنتِ؛ فصارت كل ملاحظة محتملة على العمل تهديدًا لكِ شخصيًا.',
      step: 'أرسلي نسخة «جيدة» من شغلكِ لشخص واحد تثقين به — قبل أن تصير مثالية. راقبي: العالم لن ينهار.'
    },
    mutafadiya: {
      name: 'المتفادية الذكية',
      truth: 'أنتِ لا تتجنبين المهمة، بل الشعور الذي خلفها.',
      headline: 'أنتِ لستِ كسولة — يومكِ مليء بالإنجاز الصغير. لكن الباب الواحد المهم يكبر في الخيال كل يوم تأجيل، حتى صار أكبر من حجمه.',
      wound: 'الذي يتكرر أن الشعور خلف المهمة — توتر، حكم، مواجهة — يصل قبلها، فتشترين هدنة يومية بثمن أسبوع.',
      step: 'افتحي الباب عشر دقائق فقط: الرسالة، الملف، المكالمة. المطلوب ليس الإنهاء — المطلوب أن يعود الواقع إلى حجمه.'
    },
    kafua: {
      name: 'الكفؤة المنهَكة',
      truth: 'أن تكوني قادرة لا يعني أن تكوني متاحة دائمًا.',
      headline: 'الجميع يظن أنكِ بخير لأنكِ دائمًا تتصرفين. لكن قدرتكِ صارت تصريح دخول مفتوحًا للجميع — إلا أنتِ.',
      wound: 'الذي يتكرر أن كل «نعم» سريعة تشتري راحة العلاقة لحظة، وتدفع ثمنها من طاقتكِ ومشروعكِ وما يخصكِ.',
      step: 'قبل الموافقة القادمة، اسألي بصمت: ما ثمن هذه النعم؟ واحجزي ساعة أسبوعية لكِ وحدكِ — موعدًا لا يُلغى.'
    }
  };

  /* ---------- Twelve scenes, two acts ---------- */
  const questions = [
    // ---- الفصل الأول: مشاهد من يومكِ ----
    {
      act: 1, scene: 'بعد ما يهدأ البيت',
      text: 'هدأ البيت أخيرًا، وصارت عندكِ ساعة كاملة لكِ وحدكِ. بصراحة… كيف تنتهي هذه الساعة غالبًا؟',
      options: [
        { p: 'mubdia',     t: 'أفتحها بحماس على مشروعي، ثم أخرج منها بفكرة جديدة أحلى من المشروع نفسه — وأنام وأنا أخطط لها.' },
        { p: 'asira',      t: 'أشتغل فعلًا… لكن أقضيها كلها في تحسين شيء شبه جاهز؛ أرتّب وأجمّل ولا «أنهي».' },
        { p: 'mutafadiya', t: 'أقول أبدأ بالشيء المهم، وأنتهي بإنجاز أشياء صغيرة كثيرة — والمهم ما فتحته.' },
        { p: 'kafua',      t: 'تذوب على رسالة «محتاجينك شوي» أو طلب طارئ؛ تصير ساعة الآخرين، مو ساعتي.' }
      ]
    },
    {
      act: 1, scene: 'مجموعة العائلة',
      text: 'في مجموعة الواتساب، طُلب منكِ ترتيب مناسبة قريبة — والكل واثق أنكِ «ما تقصّرين». ماذا يحدث داخلكِ؟',
      options: [
        { p: 'kafua',      t: 'أكتب «أبشروا» في نفس الدقيقة… وأحس بثقلها بعد ما أرسلها.' },
        { p: 'asira',      t: 'أقبل، وأُتعب نفسي في التفاصيل حتى تطلع مثالية — وأي ملاحظة صغيرة تجرحني أكثر مما تستحق.' },
        { p: 'mutafadiya', t: 'أتأخر في الرد وأنا أعرف أني سأقبل؛ صار التأجيل طريقتي في تأخير الحسم.' },
        { p: 'mubdia',     t: 'أتحمس وأقترح أفكارًا تجعلها مناسبة مختلفة… ثم يخف حماسي قبل التنفيذ ويبقى الحمل عليّ.' }
      ]
    },
    {
      act: 1, scene: 'الدورة المدفوعة',
      text: 'دفعتِ من مالكِ الخاص لدورة أو برنامج، وقلتِ: «هذه المرة جد». أين انتهى بكِ الحال معها؟',
      options: [
        { p: 'mubdia',     t: 'وصلتُ الدرس الثالث… ثم لمعَت دورة أو فكرة ثانية، وانتقل الحماس لها.' },
        { p: 'asira',      t: 'أعدتُ الدرس الواحد أكثر من مرة، وما سمحت لنفسي أتقدم قبل أن «أتقن» الذي فات.' },
        { p: 'mutafadiya', t: 'أجّلت أول واجب فيها؛ وكل ما كبر التأجيل، صار فتح المنصة نفسها أثقل.' },
        { p: 'kafua',      t: 'انحشرت بين التزاماتي؛ وكل أسبوع أقول «من الأسبوع الجاي أرجع لها».' }
      ]
    },
    {
      act: 1, scene: 'الساعة 11 ليلًا',
      text: 'قبل النوم، تفتحين إنستغرام فتجدين امرأة بعمركِ أطلقت مشروعًا يشبه الذي في رأسكِ. ما الجملة الأصدق التي تمر داخلكِ؟',
      options: [
        { p: 'asira',      t: '«شغلي أجمل من هذا… بس مو جاهز، وما راح أنزل شيئًا ناقصًا يتكلمون عليه.»' },
        { p: 'mubdia',     t: '«أنا عندي أفكار أقوى بكثير؛ المشكلة مو الأفكار…» — وأفتح ملاحظاتي المليئة، إثباتًا.' },
        { p: 'mutafadiya', t: 'أطفئ الجوال بسرعة؛ منظرها قرّب مني شعورًا ما أبغى أواجهه الليلة.' },
        { p: 'kafua',      t: '«هي فاضية لنفسها… أنا وقتي موزَّع على الكل إلا نفسي.» — وأكمل التصفح وأنا متعبة.' }
      ]
    },
    {
      act: 1, scene: 'الموسم',
      text: 'يقترب موسم مزدحم — رمضان، أعراس، اختبارات، ضغط دوام. ماذا يحدث لمشروعكِ أنتِ؟',
      options: [
        { p: 'kafua',      t: 'يُلغى تلقائيًا؛ أنا «مسؤولة الموسم» عند الجميع، والكل يعتمد عليّ.' },
        { p: 'mutafadiya', t: 'أقول «بعد الموسم أبدأ بقوة»؛ صارت المواسم مواعيد مؤجلة تلد بعضها.' },
        { p: 'mubdia',     t: 'أدخل الموسم بمشروع… وأخرج منه متحمسة لمشروع ثاني مختلف تمامًا.' },
        { p: 'asira',      t: 'أكمل فيه بصمت لكن لا أُري أحدًا؛ «مو وقته، وما هو جاهز».' }
      ]
    },
    {
      act: 1, scene: 'دفتر بداية السنة',
      text: 'عندكِ دفتر أنيق — أو ملاحظات في الجوال — فيه خطط بدايات السنوات. لو فتحتيه الآن، ماذا سيحكي عنكِ؟',
      options: [
        { p: 'mubdia',     t: 'خمس خطط لخمسة مشاريع مختلفة، كل واحدة بحماس البداية… وأول صفحة فقط.' },
        { p: 'asira',      t: 'خطة واحدة مُعادة بصياغة «أدق» كل مرة؛ صار التخطيط نفسه هو مشروعي.' },
        { p: 'mutafadiya', t: 'خطة واضحة وممتازة… والخطوة الأولى فيها بالذات هي التي ما بدأت.' },
        { p: 'kafua',      t: 'أهدافي مكتوبة في آخر الصفحة — بعد قائمة أهداف البيت والأهل والدوام.' }
      ]
    },
    // ---- الفصل الثاني: الصوت الذي لا يسمعه أحد ----
    {
      act: 2, scene: 'الجملة التي تحكمكِ',
      text: 'لو أنصتِّ للصوت العميق الذي يوقفكِ كل مرة، أي جملة تشبه ما يقوله؟',
      options: [
        { p: 'asira',      t: '«إذا طلع شغلي ناقصًا… أنا التي ستطلع ناقصة في عيونهم.»' },
        { p: 'mutafadiya', t: '«إذا فتحتُ هذا الباب الآن، سيجيئني شعور أثقل مني.»' },
        { p: 'mubdia',     t: '«إذا التزمتُ بشيء واحد، دفنتُ كل النسخ الممكنة مني.»' },
        { p: 'kafua',      t: '«إذا قلتُ لا… تهتز المكانة التي تعبتُ عليها عندهم.»' }
      ]
    },
    {
      act: 2, scene: 'منتصف الطريق',
      text: 'في منتصف أي مشروع تأتي لحظة يبهت فيها البريق. ماذا تفعل هذه اللحظة بكِ؟',
      options: [
        { p: 'mubdia',     t: 'أفسّرها إشارة أن الفكرة «مو هي» — وأصدّق فجأة أن فكرتي القادمة هي الصح.' },
        { p: 'asira',      t: 'أفسّرها دليلًا أني يجب أن أرفع المستوى أكثر… قبل أن يراه أحد.' },
        { p: 'mutafadiya', t: 'أحوّلها إلى انشغال منطقي بأشياء أخف، وأؤجل قلب المشروع نفسه.' },
        { p: 'kafua',      t: 'ألوم نفسي على «الترف»: الحماس رفاهية، والواجبات أولى.' }
      ]
    },
    {
      act: 2, scene: 'الراحة المُرّة',
      text: 'تجلسين أخيرًا لتستريحي بلا هدف — شاي، هدوء، لا أحد يطلب شيئًا. من الداخل… متى تنقطع الراحة؟',
      options: [
        { p: 'kafua',      t: 'بإحساس أن أحدًا قد يحتاجني الآن؛ أرتاح «بأذنٍ واحدة صاحية».' },
        { p: 'asira',      t: 'بتذكُّر الشيء غير المكتمل؛ ما أعرف أرتاح وفي البال شيء «مو تمام».' },
        { p: 'mutafadiya', t: 'براحة يشوبها ذنب خفيف: أعرف أني أستريح من شيء أتهرّب منه أصلًا.' },
        { p: 'mubdia',     t: 'بفكرة جديدة تقفز وسط الهدوء وتشعل رأسي؛ تتحول الراحة إلى جلسة عصف.' }
      ]
    },
    {
      act: 2, scene: 'كلامهم عنكِ',
      text: 'أي عبارة قيلت عنكِ وظلمتكِ — لأن قائلها لم يرَ القصة كاملة؟',
      options: [
        { p: 'mubdia',     t: '«ما تكمّلين شي» — وما شافوا كم أحمل من بدايات صادقة تتجاذبني.' },
        { p: 'asira',      t: '«معقّدة وتدققين» — وما حسّوا أن الذي يهزني هو حكمهم لو ظهر فيه خطأ.' },
        { p: 'mutafadiya', t: '«كسل وتسويف» — وما دروا كم مرة اقتربتُ… وانسحبتُ من ثقل ما خلف الباب.' },
        { p: 'kafua',      t: '«قوية وما ينكسر لها خاطر» — وما انتبهوا أني أنكسر بصمت من كثرة ما أُحمَّل.' }
      ]
    },
    {
      act: 2, scene: 'المكسب الخفي',
      text: 'لكل عادة مكسبٌ خفي يبقيها حية. لو صدقتِ تمامًا: ما الذي تشترينه سرًّا بهذه العادة؟',
      options: [
        { p: 'mubdia',     t: 'لحظة البداية تعطيني نسخة جديدة مني؛ أبقى «واعدة»… بلا امتحان النهاية.' },
        { p: 'asira',      t: 'ما دام العمل في يدي، لم يُقيِّمه أحد؛ التعديل يحميني من ساعة الحكم.' },
        { p: 'mutafadiya', t: 'كل يوم تأجيل يشتري لي هدنة قصيرة من شعورٍ واحدٍ ثقيل.' },
        { p: 'kafua',      t: 'كل «نعم» أقولها تثبّت مكاني عندهم؛ صار التعب نفسه عملة حب.' }
      ]
    },
    {
      act: 2, scene: 'لو صدقتِ مع نفسكِ',
      text: 'بعيدًا عن الخطط الكبيرة: أي خطوة صغيرة، لو فعلتِها هذا الأسبوع، ستشعرين أنكِ كنتِ صادقة مع نفسكِ؟',
      options: [
        { p: 'mubdia',     t: 'أرجع لمشروع واحد تركته وهو يستاهل — وأحميه من أي فكرة جديدة، سبعة أيام فقط.' },
        { p: 'asira',      t: 'أرسل نسخة «جيدة» من شغلي لشخص واحد… قبل أن تصير مثالية.' },
        { p: 'mutafadiya', t: 'أفتح الملف — أو الرسالة — التي أدور حولها من أسابيع. عشر دقائق فقط.' },
        { p: 'kafua',      t: 'أحجز ساعة لي وحدي في الأسبوع، وأُعلمهم أنها موعد «ما ينلغي».' }
      ]
    }
  ];

  /* ---------- Session-stable option shuffle (kills primacy bias) ---------- */
  questions.forEach(q => {
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    q.order = order; // display position -> original option index
  });

  /* ---------- State ---------- */
  const state = {
    index: 0,
    phase: 'closest',
    answers: [],               // per question: {closest, farthest} — ORIGINAL indices
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
    if ($('actLabel')) $('actLabel').textContent = q.act === 1 ? 'الفصل الأول — مشاهد من يومكِ' : 'الفصل الثاني — الصوت الذي لا يسمعه أحد';
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
    q.order.forEach(origIdx => {
      const opt = q.options[origIdx];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      if (saved.closest === origIdx) btn.classList.add('closest');
      if (saved.farthest === origIdx) btn.classList.add('farthest');
      btn.innerHTML = '<span class="mark">' +
        (saved.closest === origIdx ? 'الأقرب إليّ' : saved.farthest === origIdx ? 'الأبعد عني' : '') +
        '</span>' + opt.t;
      btn.addEventListener('click', () => choose(origIdx));
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

    if (state.phase === 'done') {
      state.answers[state.index] = { closest: i, farthest: null };
      state.phase = 'farthest';
      refreshMarks(); setPrompt(); updateProgress();
      return;
    }
    if (state.phase === 'closest') {
      saved.closest = i; saved.farthest = null;
      state.answers[state.index] = saved;
      state.phase = 'farthest';
      refreshMarks(); setPrompt();
      return;
    }
    if (saved.closest === i) {
      $('quizMsg').textContent = 'اختاري إجابة مختلفة عن الأقرب.';
      return;
    }
    saved.farthest = i;
    state.answers[state.index] = saved;
    state.phase = 'done';
    refreshMarks(); updateProgress();
    setTimeout(advance, reduced ? 120 : 480);
  }

  function refreshMarks() {
    const q = questions[state.index];
    const saved = state.answers[state.index] || {};
    Array.from($('options').children).forEach((el, pos) => {
      const origIdx = q.order[pos];
      el.classList.toggle('closest', saved.closest === origIdx);
      el.classList.toggle('farthest', saved.farthest === origIdx);
      el.querySelector('.mark').textContent =
        saved.closest === origIdx ? 'الأقرب إليّ' : saved.farthest === origIdx ? 'الأبعد عني' : '';
    });
    $('quizMsg').textContent = '';
  }

  function advance() {
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

  /* ---------- Scoring & signature analysis ---------- */
  function calculateResult() {
    const scores = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    const closeCount = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    const farCount = { mubdia: 0, asira: 0, mutafadiya: 0, kafua: 0 };
    const closeByAct = { 1: {}, 2: {} };

    state.answers.forEach((ans, qi) => {
      const q = questions[qi];
      if (!ans) return;
      if (ans.closest != null) {
        const p = q.options[ans.closest].p;
        scores[p] += (q.act === 2 ? 3 : 2);       // the inner voice weighs more
        closeCount[p]++;
        closeByAct[q.act][p] = (closeByAct[q.act][p] || 0) + 1;
      }
      if (ans.farthest != null) {
        const p = q.options[ans.farthest].p;
        scores[p] -= 1;
        farCount[p]++;
      }
    });

    const min = Math.min.apply(null, Object.values(scores));
    const shifted = {};
    Object.keys(scores).forEach(k => (shifted[k] = scores[k] - min + 1));
    const total = Object.values(shifted).reduce((a, b) => a + b, 0);
    const pcts = {};
    Object.keys(shifted).forEach(k => (pcts[k] = Math.round((shifted[k] / total) * 100)));
    const order = Object.keys(pcts).sort((a, b) =>
      pcts[b] - pcts[a] || closeCount[b] - closeCount[a] || farCount[a] - farCount[b]);
    pcts[order[0]] += 100 - Object.values(pcts).reduce((a, b) => a + b, 0);

    const dominant = order[0];
    const gap = pcts[order[0]] - pcts[order[1]];
    return {
      scores, pcts, order,
      closeCount, farCount, closeByAct,
      coLead: gap <= 4,                     // two patterns share the lead
      highClarity: pcts[dominant] >= 45,    // unusually decisive profile
      gap
    };
  }

  /* ---------- Precision mirrors — computed, never invented ---------- */
  function buildMirrors(r) {
    const dom = r.order[0];
    const mirrors = [];

    // 1) Tension: a pattern she both touches and pushes away.
    const tension = Object.keys(patterns).find(p =>
      p !== dom && r.closeCount[p] >= 2 && r.farCount[p] >= 3);
    if (tension) {
      mirrors.push('علاقتكِ بنمط «' + patterns[tension].name + '» متوترة: اخترتِه قريبًا ورفضتِه بعيدًا في مشاهد مختلفة — غالبًا هذا نمط قديم بدأتِ تخرجين منه، وما زال يشدّكِ من طرف ثوبكِ.');
    }

    // 2) Inner/outer split for the dominant pattern.
    const inner = (r.closeByAct[2][dom] || 0);
    const outer = (r.closeByAct[1][dom] || 0);
    if (inner - outer >= 2) {
      mirrors.push('يومكِ من الخارج لا يفضحكِ — لكن في «الصوت الداخلي» كانت إجاباتكِ محسومة. نمطكِ يسكن قراراتكِ الصامتة أكثر من سلوككِ الظاهر، ولهذا لا يلاحظه مَن حولكِ.');
    } else if (outer - inner >= 2) {
      mirrors.push('اللافت أن نمطكِ ظاهر في تفاصيل يومكِ أكثر مما تعترف به قناعاتكِ الداخلية — جسدكِ ويومكِ يعرفان قبل أن يقتنع رأسكِ.');
    }

    // 3) The anti-pattern: her most-rejected door (never the tension pattern —
    //    the two mirrors would contradict each other about the same door).
    const anti = Object.keys(patterns).sort((a, b) => r.farCount[b] - r.farCount[a])[0];
    if (anti && r.farCount[anti] >= 4 && anti !== dom && anti !== tension) {
      mirrors.push('أبعد الأنماط عنكِ: «' + patterns[anti].name + '» — هذا الباب ليس معركتكِ أصلًا. لا تصرفي طاقتكِ على نصائح كُتبت لامرأة أخرى.');
    }

    return mirrors.slice(0, 3);
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
    const sec = r.order[1];

    $('revealName').textContent = patterns[dom].name;
    $('revealTruth').textContent = patterns[dom].truth;

    let teaser;
    if (r.coLead) {
      teaser = 'نتيجتكِ نادرة: نمطان يتقاسمان قيادتكِ هذه الفترة — <b>' + patterns[dom].name +
        '</b> و<b>' + patterns[sec].name + '</b> يعملان معًا. قراءتكِ الكاملة تفكك هذا التحالف.';
    } else if (r.highClarity) {
      teaser = 'نمطكِ واضح بدرجة عالية — ظهر بنسبة <b>' + r.pcts[dom] +
        '٪</b>، وهذا وضوح لا يظهر عند الكثيرات. ومعه نمط خفي يعمل في الظل… قراءتكِ الكاملة تكشفه.';
    } else {
      teaser = 'ظهر نمطكِ الغالب بنسبة <b>' + r.pcts[dom] +
        '٪</b> — ومعه نمط خفي يعمل في الخلفية. قراءتكِ الكاملة تكشفه، مع خريطة مزيجكِ ومرايا دقيقة من إجاباتكِ أنتِ.';
    }
    $('mixTeaser').innerHTML = teaser;
    showPanel('revealPanel');

    if (!reduced && typeof gsap !== 'undefined') {
      gsap.fromTo('#revealName', { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' });
      gsap.fromTo('#revealTruth', { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.7 });
      gsap.fromTo('#mixTeaser, #toEmailBtn', { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 1, delay: 1.2, stagger: 0.15 });
    }
  }

  /* ---------- Email gate → MailerLite (per-pattern form) ---------- */
  async function submitEmail(e) {
    e.preventDefault();
    const email = $('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $('emailMsg').textContent = 'يرجى إدخال بريدٍ إلكتروني صحيح.';
      return;
    }
    if (!state.lastResult) state.lastResult = calculateResult();
    $('emailMsg').textContent = 'نفتح القراءة ونجهّز تقريركِ الأول...';
    await sendPayload(email, state.lastResult);
    renderResult(email);
  }

  async function sendPayload(email, result) {
    const dominant = result.order[0];
    const fields = {
      dominant_pattern: dominant,
      dominant_pattern_name: patterns[dominant].name,
      secondary_pattern: result.order[1],
      secondary_pattern_name: patterns[result.order[1]].name,
      mubdia_percent: String(result.pcts.mubdia),
      asira_percent: String(result.pcts.asira),
      mutafadiya_percent: String(result.pcts.mutafadiya),
      kafua_percent: String(result.pcts.kafua),
      dominant_percent: String(result.pcts[dominant]),
      result_clarity: result.coLead ? 'colead' : result.highClarity ? 'high' : 'normal',
      result_url: location.origin + location.pathname + '?result=' + dominant
    };

    const ml = CONFIG.mailerLite || {};
    // Only the form matching HER pattern is ever used — never all four.
    const endpoint = (ml.formEndpoints || {})[dominant] || ml.endpoint || '';
    try {
      if (ml.enabled && endpoint) {
        const fd = new FormData();
        fd.append('fields[email]', email);
        Object.entries(fields).forEach(([k, v]) => fd.append('fields[' + k + ']', v));
        fd.append('ml-submit', '1');
        fd.append('anticsrf', 'true');
        await fetch(endpoint, { method: 'POST', body: fd, mode: 'no-cors' });
      }
    } catch (err) { /* keep the visitor moving; result still renders */ }

    try {
      localStorage.setItem('nizamok_last_result', JSON.stringify({
        payload: { email: email, fields: fields },
        pcts: result.pcts, order: result.order,
        closeCount: result.closeCount, farCount: result.farCount,
        closeByAct: result.closeByAct, coLead: result.coLead,
        highClarity: result.highClarity,
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

    if (r.coLead) {
      $('hiddenPattern').innerHTML =
        '✦ نتيجة نادرة: <b>' + patterns[sec].name + '</b> تقاسمكِ القيادة بنسبة ' + r.pcts[sec] +
        '٪ — النمطان يعملان معًا هذه الفترة.';
    } else {
      $('hiddenPattern').innerHTML =
        '✦ نمطكِ الخفي: <b>' + patterns[sec].name + '</b> بنسبة ' + r.pcts[sec] +
        '٪ — يعمل في الظل عندما يتعب نمطكِ الغالب.';
    }

    const bars = $('bars');
    bars.innerHTML = '';
    r.order.forEach(k => {
      const row = document.createElement('div');
      row.className = 'bar-row' + (k === dom || (r.coLead && k === sec) ? ' dominant' : '');
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

    // Precision mirrors — computed from her actual answer signature.
    const mirrors = buildMirrors(r);
    const mWrap = $('resultMirrors');
    if (mWrap) {
      if (mirrors.length) {
        mWrap.innerHTML = '<h3>مرايا دقيقة — من إجاباتكِ أنتِ</h3>' +
          mirrors.map(m => '<p>' + m + '</p>').join('');
        mWrap.style.display = '';
      } else {
        mWrap.style.display = 'none';
      }
    }

    // Personalized product path.
    const links = (CONFIG.products || {})[dom] || {};
    const prices = CONFIG.pricing || {};
    $('resultPath').innerHTML =
      '<h3>مساركِ حسب نمطكِ</h3>' +
      '<p>ثلاث مراحل بعمقٍ متدرج، من تأليف «السبع» — سبع باحثات بدرجات الدكتوراه في علم النفس والأدب والتدريب؛ تحليلٌ مدعوم بالأبحاث، بمراجع معتمدة وتمارين عملية.</p>' +
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
        state.lastResult = {
          pcts: saved.pcts, order: saved.order,
          closeCount: saved.closeCount || {}, farCount: saved.farCount || {},
          closeByAct: saved.closeByAct || { 1: {}, 2: {} },
          coLead: !!saved.coLead, highClarity: !!saved.highClarity
        };
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
    $('actContinueBtn').addEventListener('click', () => { state.index++; renderQuestion(); });
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
