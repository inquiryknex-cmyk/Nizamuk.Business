/* NizamOk shared behavior: navigation, GSAP motion, waitlist form. */
(function () {
  'use strict';

  const CONFIG = window.NIZAMOK || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('reduced-motion');

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open')));
  }

  /* ---------- GSAP motion (slow, quiet, intentional) ---------- */
  function initMotion() {
    if (reduced || typeof gsap === 'undefined') {
      document.querySelectorAll('.reveal').forEach(el => (el.style.opacity = 1));
      return;
    }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-reveal-group]').forEach(group => {
      const items = group.querySelectorAll('.reveal');
      if (!items.length) return;
      gsap.fromTo(items,
        { opacity: 0, y: 26 },
        {
          opacity: 1, y: 0,
          duration: 1.1, ease: 'power2.out', stagger: 0.14,
          scrollTrigger: window.ScrollTrigger
            ? { trigger: group, start: 'top 82%' }
            : undefined
        });
    });

    document.querySelectorAll('.reveal:not([data-reveal-group] .reveal)').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 26 },
        {
          opacity: 1, y: 0, duration: 1.1, ease: 'power2.out',
          scrollTrigger: window.ScrollTrigger
            ? { trigger: el, start: 'top 85%' }
            : undefined
        });
    });

    // Hero pattern line draws itself once on load.
    const line = document.querySelector('.pattern-line-svg path');
    if (line) {
      const len = line.getTotalLength();
      gsap.fromTo(line,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut', delay: 0.3 });
    }

    // The hero phone floats, slowly.
    const phone = document.querySelector('.hero-phone img');
    if (phone) {
      gsap.to(phone, { y: -12, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }

    // The real signature fades in, then glows once — quiet, expensive.
    const wm = document.querySelector('.hero-wordmark');
    if (wm) {
      const tl = gsap.timeline({ delay: 0.4 });
      tl.from(wm, { opacity: 0, y: 10, duration: 1.4, ease: 'power2.out' })
        .fromTo(wm,
          { filter: 'drop-shadow(0 0 14px rgba(201,167,94,0.25)) brightness(1)' },
          { filter: 'drop-shadow(0 0 22px rgba(201,167,94,0.5)) brightness(1.18)',
            duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, '-=0.3');
    }

    // Gold swoosh in the logo draws itself.
    document.querySelectorAll('.logo-swoosh').forEach(sw => {
      const len = sw.getTotalLength ? sw.getTotalLength() : 0;
      if (!len) return;
      gsap.fromTo(sw,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', delay: 0.6 });
    });
  }

  /* ---------- Interdash video ---------- */
  function initVideo() {
    const shell = document.querySelector('[data-video-shell]');
    if (!shell) return;
    const v = (CONFIG.interdash && CONFIG.interdash.video) || {};
    if (v.aspect === '4:5') shell.classList.add('portrait');
    if (v.src && v.type === 'mp4') {
      shell.innerHTML =
        '<video controls playsinline preload="metadata"' +
        (v.poster ? ' poster="' + v.poster + '"' : '') +
        ' src="' + v.src + '"></video>';
      const vid = shell.querySelector('video');
      if (vid) {
        let played = false;
        vid.addEventListener('play', function () {
          if (played) return; played = true; // once per page session
          if (window.trackEvent) window.trackEvent('video_play', {
            video_id: 'interdash',
            page_path: location.pathname,
            source_section: shell.closest('#interdash') ? 'home_interdash' : 'interdash_page'
          });
        });
      }
    } else if (v.src && v.type === 'youtube') {
      shell.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + v.src +
        '?rel=0&modestbranding=1" title="لوحة نمطكِ التفاعلية" allowfullscreen ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>';
    }
    // else: keep the premium "coming soon" poster already in the markup.
  }

  /* ---------- Ambient sound (opt-in, atmospheric) ----------
     Only runs on pages that opt in with <body data-ambient> (home + Interdash).
     Excluded routes (quiz, legal, 404) omit the attribute, so nothing renders
     or plays there. One lazily-created Audio instance; never autoplays. */
  function initAmbientSound() {
    if (!document.body || !document.body.hasAttribute('data-ambient')) return;

    var AUDIO_SRC = '/assets/audio/nizamok-ambient.mp3';
    var STORE_KEY = 'nizamok_ambient';   // { enabled, volume, position }
    var DEFAULT_VOL = 0.12;              // gentle atmospheric level (0.10–0.15)
    var FADE_MS = 1500;

    // Storage may be blocked (private mode) — degrade to a session-only feature.
    function readState() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
      catch (e) { return {}; }
    }
    function writeState(patch) {
      try {
        var s = readState();
        for (var k in patch) s[k] = patch[k];
        localStorage.setItem(STORE_KEY, JSON.stringify(s));
      } catch (e) { /* storage blocked — ignore */ }
    }

    var saved = readState();
    var TARGET_VOL = (typeof saved.volume === 'number' && saved.volume > 0 && saved.volume <= 1)
      ? saved.volume : DEFAULT_VOL;

    var nizamokAmbientAudio = null;   // single Audio instance, created on first use
    var ambientSoundEnabled = false;  // is the ambient meant to be playing right now
    var hasActivated = saved.activated === true; // has it ever played (persisted)
    var pendingResume = false;        // enabled last visit; resume on next gesture
    var assetUnavailable = false;     // set once if the file is missing / fails
    var duckedByMedia = false;        // paused because other media is playing
    var fadeTimer = null, posTimer = null, resumeHandler = null;

    /* ---- the control: an RTL pill (speaker icon + Arabic label), injected once.
       Three visible states, each label matching what a press will do:
         initial → «ابدئي الرحلة الصوتية»  (start)
         playing → «إيقاف الصوت»            (pause)
         paused  → «استئناف الصوت»          (resume) */
    var LABELS = { initial: 'ابدئي الرحلة الصوتية', playing: 'إيقاف الصوت', paused: 'استئناف الصوت' };
    var ambientSoundControl = document.createElement('button');
    ambientSoundControl.type = 'button';
    ambientSoundControl.className = 'ambient-control';
    ambientSoundControl.setAttribute('aria-pressed', 'false');
    ambientSoundControl.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path class="spk" d="M4 9.2v5.6h3.2L12 18.8V5.2L7.2 9.2H4z"/>' +
        '<path class="wave w1" d="M15.4 9.1a4 4 0 0 1 0 5.8"/>' +
        '<path class="wave w2" d="M17.9 6.6a7.4 7.4 0 0 1 0 10.8"/>' +
      '</svg><span class="ambient-label"></span>';
    var ambientLabelEl = ambientSoundControl.querySelector('.ambient-label');

    function isPlaying() {
      return !!(nizamokAmbientAudio && !nizamokAmbientAudio.paused && !nizamokAmbientAudio.ended);
    }
    // The visible label IS the accessible name (no aria-label needed). aria-pressed
    // carries the toggle state. State is intent-driven so the label never lies.
    function reflectUI() {
      var state = ambientSoundEnabled ? 'playing' : (hasActivated ? 'paused' : 'initial');
      ambientSoundControl.setAttribute('data-state', state);
      ambientSoundControl.classList.toggle('is-on', state === 'playing');
      ambientSoundControl.setAttribute('aria-pressed', state === 'playing' ? 'true' : 'false');
      ambientLabelEl.textContent = LABELS[state];
    }
    function clearFade() { if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; } }
    function fadeTo(target, ms, done) {
      if (!nizamokAmbientAudio) { if (done) done(); return; }
      clearFade();
      var start = nizamokAmbientAudio.volume;
      var steps = Math.max(1, Math.round(ms / 50)), i = 0;
      fadeTimer = setInterval(function () {
        i++;
        var v = start + (target - start) * (i / steps);
        try { nizamokAmbientAudio.volume = Math.min(1, Math.max(0, v)); } catch (e) {}
        if (i >= steps) { clearFade(); if (done) done(); }
      }, 50);
    }
    function savePosition() {
      if (nizamokAmbientAudio) writeState({ position: Math.floor(nizamokAmbientAudio.currentTime) || 0 });
    }
    function startSavingPosition() {
      if (posTimer) return;
      posTimer = setInterval(function () { if (isPlaying()) savePosition(); }, 4000);
    }
    function stopSavingPosition() { if (posTimer) { clearInterval(posTimer); posTimer = null; } }

    function handleFailure() {
      // Missing asset or playback error → reset cleanly, no error loop, no broken UI.
      assetUnavailable = true;
      ambientSoundEnabled = false;
      pendingResume = false;
      writeState({ enabled: false });
      clearFade(); stopSavingPosition(); disarmResume();
      try { if (nizamokAmbientAudio) nizamokAmbientAudio.pause(); } catch (e) {}
      reflectUI();
    }

    function ensureAudio() {
      if (nizamokAmbientAudio) return nizamokAmbientAudio;
      var a = new Audio();
      a.preload = 'none';   // no network request until intentional activation
      a.loop = true;
      a.volume = 0;         // always fade up from silence
      a.src = AUDIO_SRC;
      var pos = readState().position;
      if (typeof pos === 'number' && pos > 0) {
        a.addEventListener('loadedmetadata', function () {
          try { if (pos < (a.duration || Infinity)) a.currentTime = pos; } catch (e) {}
        }, { once: true });
      }
      a.addEventListener('error', handleFailure);
      nizamokAmbientAudio = a;
      return a;
    }

    // userInitiated=true means a fresh gesture (play must succeed or it's a failure);
    // false means a restore/resume that browser autoplay policy may legitimately block.
    function startAmbient(userInitiated) {
      if (assetUnavailable) return;
      var a = ensureAudio();
      duckedByMedia = false;
      var p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(function () {
          hasActivated = true; writeState({ activated: true });
          reflectUI(); fadeTo(TARGET_VOL, FADE_MS); startSavingPosition();
        }).catch(function () {
          if (userInitiated) handleFailure();
          else {                                   // autoplay blocked → wait for a gesture
            ambientSoundEnabled = false; writeState({ enabled: false });
            pendingResume = true; reflectUI(); armResume();
          }
        });
      } else {
        hasActivated = true; writeState({ activated: true });
        reflectUI(); fadeTo(TARGET_VOL, FADE_MS); startSavingPosition();
      }
    }
    function stopAmbient() {
      fadeTo(0, FADE_MS, function () {
        try { if (nizamokAmbientAudio) nizamokAmbientAudio.pause(); } catch (e) {}
        savePosition(); stopSavingPosition();
      });
    }

    // Restore playback at the next genuine interaction (never circumvent autoplay).
    function armResume() {
      if (resumeHandler) return;
      resumeHandler = function (e) {
        if (e.target && e.target.closest && e.target.closest('.ambient-control')) return;
        disarmResume();
        if (pendingResume && !isPlaying() && !assetUnavailable) {
          pendingResume = false;
          ambientSoundEnabled = true; writeState({ enabled: true });
          reflectUI(); startAmbient(false);
        }
      };
      document.addEventListener('pointerdown', resumeHandler, true);
      document.addEventListener('keydown', resumeHandler, true);
    }
    function disarmResume() {
      if (!resumeHandler) return;
      document.removeEventListener('pointerdown', resumeHandler, true);
      document.removeEventListener('keydown', resumeHandler, true);
      resumeHandler = null;
    }

    function toggle() {
      disarmResume(); pendingResume = false;
      if (assetUnavailable) { reflectUI(); return; }
      if (ambientSoundEnabled) {
        ambientSoundEnabled = false;
        writeState({ enabled: false });
        reflectUI();          // → «استئناف الصوت»
        stopAmbient();
      } else {
        ambientSoundEnabled = true;
        writeState({ enabled: true });
        reflectUI();          // → «إيقاف الصوت» (optimistic; reset on failure)
        startAmbient(true);   // click is a user gesture → playback is allowed
      }
    }
    ambientSoundControl.addEventListener('click', toggle);

    /* ---- media coordination: never two sources at once ----
       Media events don't bubble, so listen in the capture phase. This also
       catches the Interdash <video>, which main.js injects dynamically. */
    function anyOtherMediaPlaying() {
      var m = document.querySelectorAll('video, audio'), i;
      for (i = 0; i < m.length; i++) {
        if (m[i] !== nizamokAmbientAudio && !m[i].paused && !m[i].ended) return true;
      }
      return false;
    }
    document.addEventListener('play', function (e) {
      var t = e.target;
      if (!t || t === nizamokAmbientAudio) return;
      if ((t.tagName === 'VIDEO' || t.tagName === 'AUDIO') && isPlaying()) {
        duckedByMedia = true;
        fadeTo(0, 600, function () { try { nizamokAmbientAudio.pause(); } catch (e2) {} });
      }
    }, true);
    function onOtherMediaStop(e) {
      var t = e.target;
      if (!t || t === nizamokAmbientAudio) return;
      if ((t.tagName === 'VIDEO' || t.tagName === 'AUDIO') && duckedByMedia
          && ambientSoundEnabled && !anyOtherMediaPlaying()) {
        duckedByMedia = false;
        startAmbient(false);   // resume only if she still has it enabled
      }
    }
    document.addEventListener('pause', onOtherMediaStop, true);
    document.addEventListener('ended', onOtherMediaStop, true);

    // Persist the position when leaving, so navigation doesn't restart from zero.
    window.addEventListener('pagehide', savePosition);

    document.body.appendChild(ambientSoundControl);

    // Reflect the persisted choice. Never autoplay: if it was on last visit, show
    // the «استئناف الصوت» (paused) state and resume on the next interaction.
    if (saved.enabled === true) {
      hasActivated = true;
      pendingResume = true;
      armResume();
    }
    reflectUI();   // initial paint (initial / paused, per persisted state)
  }

  /* ---------- Waiting list form ---------- */
  async function submitWaitlist(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = form.querySelector('.form-msg');
    const name = (form.querySelector('[name="first_name"]') || {}).value || '';
    const email = (form.querySelector('[name="email"]') || {}).value || '';
    const pattern = (form.querySelector('[name="pattern"]') || {}).value || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      msg.textContent = 'يرجى إدخال بريدٍ إلكتروني صحيح.';
      msg.classList.remove('ok');
      return;
    }

    const payload = {
      email: email.trim(),
      // MailerLite's default "name" field = first name → usable as {$name} in emails.
      fields: { name: name.trim(), pattern: pattern, source: 'interdash_waitlist' }
    };

    const ml = CONFIG.mailerLite || {};
    const endpoint = ml.waitlistEndpoint || ml.endpoint || '';
    msg.textContent = 'نسجّل انضمامكِ...';
    msg.classList.remove('ok');

    try {
      if (ml.enabled && endpoint) {
        const fd = new FormData();
        fd.append('fields[email]', payload.email);
        Object.entries(payload.fields).forEach(([k, v]) => fd.append('fields[' + k + ']', v));
        fd.append('ml-submit', '1');
        fd.append('anticsrf', 'true');
        await fetch(endpoint, { method: 'POST', body: fd, mode: 'no-cors' });
      } else {
        // MailerLite not wired yet — keep the signup safe locally.
        const stash = JSON.parse(localStorage.getItem('nizamok_waitlist') || '[]');
        stash.push(Object.assign({ at: new Date().toISOString() }, payload));
        localStorage.setItem('nizamok_waitlist', JSON.stringify(stash));
      }
      msg.textContent = 'انضممتِ إلى القائمة. سنراسلكِ عند فتح التجربة المبكرة.';
      msg.classList.add('ok');
      form.reset();
      // Funnel event — status only, never the email or name.
      if (window.trackEvent) window.trackEvent('waitlist_submit', { submission_status: 'success', page_path: location.pathname });
    } catch (err) {
      msg.textContent = 'تعذّر الإرسال الآن. حاولي مرة أخرى بعد قليل.';
      msg.classList.remove('ok');
      if (window.trackEvent) window.trackEvent('waitlist_submit', { submission_status: 'error', page_path: location.pathname });
    }
  }

  document.querySelectorAll('form[data-waitlist]').forEach(f =>
    f.addEventListener('submit', submitWaitlist));

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(el =>
    (el.textContent = String(new Date().getFullYear())));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initMotion(); initVideo(); initAmbientSound(); });
  } else {
    initMotion(); initVideo(); initAmbientSound();
  }
})();
