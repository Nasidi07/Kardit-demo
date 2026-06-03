/* Kardit site interactions
 * - Cursor-reactive flowing swoosh
 * - Sticky-header scroll behavior
 * - IntersectionObserver scroll reveals
 * - Subtle parallax on hero card
 * - Animated counter on stats band
 * - Mobile menu toggle
 *
 * Honors prefers-reduced-motion: animations fall back to a single static render.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===================================================================
   * 1. STICKY HEADER — adds .is-scrolled after 8px of scroll
   * =================================================================== */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===================================================================
   * 3. SCROLL REVEALS
   * =================================================================== */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ===================================================================
   * 4. THE LIVING SWOOSH — cursor-reactive flowing wave
   *
   * The brand swoosh has two strokes (thick #C8242C arc, thin #E63946 echo).
   * We keep that DNA but render each as an SVG path whose `d` is regenerated
   * every animation frame from a sine-wave sampled along an arched baseline,
   * so the form still reads as a swoosh — never a flat horizontal stripe.
   *
   * Cursor X biases horizontal phase offset.
   * Cursor Y nudges amplitude.
   * Speeds: outer 18s loop, inner 12s loop. Stacked = depth-of-field.
   * =================================================================== */
  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  function initSwoosh(host) {
    const svg = host.querySelector('svg.swoosh');
    if (!svg) return;
    const pathA = svg.querySelector('path[data-stroke="thick"]');
    const pathB = svg.querySelector('path[data-stroke="thin"]');
    if (!pathA || !pathB) return;

    const VBW = 1200;   // viewBox width
    const VBH = 600;    // viewBox height
    const SEGS = 56;

    // baseline arches up-and-to-the-right (mirrors the original swoosh)
    function archY(x, baseStart, baseEnd, dip) {
      const t = x / VBW;
      // sweep from baseStart down through a dip then up to baseEnd
      const arc = baseStart + (baseEnd - baseStart) * t - dip * (1 - Math.pow(2 * t - 1, 2));
      return arc;
    }

    // mouse state in viewBox coords (-1..1 across each axis)
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMouse(e) {
      const r = host.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      mouse.tx = Math.max(-1, Math.min(1, (px - 0.5) * 2));
      mouse.ty = Math.max(-1, Math.min(1, (py - 0.5) * 2));
    }
    function onLeave() { mouse.tx = 0; mouse.ty = 0; }

    if (!reduceMotion) {
      host.addEventListener('mousemove', onMouse);
      host.addEventListener('mouseleave', onLeave);
      window.addEventListener('touchmove', (e) => {
        if (e.touches[0]) onMouse(e.touches[0]);
      }, { passive: true });
    }

    function frame(tThick, tThin) {
      // base arc params: thick stroke sweeps low-left to mid-right (true to swoosh)
      const dipMix = 1 + mouse.y * 0.15;
      const ampThick = 22 + mouse.y * -8;     // cursor-Y nudges amplitude
      const ampThin  = 14 + mouse.y * -6;
      const phaseShift = mouse.x * 0.18;       // cursor-X biases phase

      const ptsA = [];
      const ptsB = [];
      for (let i = 0; i <= SEGS; i++) {
        const t = i / SEGS;
        const x = t * VBW;

        // thick stroke (the iconic red arc)
        const baseA = archY(x, 470, 250, 240 * dipMix);
        const yA = baseA + Math.sin(2 * Math.PI * (x / 320 + tThick + phaseShift)) * ampThick
                         + Math.sin(2 * Math.PI * (x / 740 + tThick * 0.6)) * (ampThick * 0.35);
        ptsA.push([x, yA]);

        // thin stroke (the echo) — slightly above and faster
        const baseB = archY(x, 510, 305, 220 * dipMix);
        const yB = baseB + Math.sin(2 * Math.PI * (x / 260 + tThin + phaseShift * 1.4)) * ampThin
                         + Math.sin(2 * Math.PI * (x / 600 + tThin * 0.8)) * (ampThin * 0.4);
        ptsB.push([x, yB]);
      }
      pathA.setAttribute('d', smoothPath(ptsA));
      pathB.setAttribute('d', smoothPath(ptsB));
    }

    let last = performance.now();
    let phaseThick = 0, phaseThin = 0;

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // ease cursor toward target for buttery feel
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      // 18s outer loop, 12s inner
      phaseThick = (phaseThick + dt / 18) % 1;
      phaseThin  = (phaseThin  + dt / 12) % 1;
      frame(phaseThick, phaseThin);
      if (!reduceMotion) requestAnimationFrame(tick);
    }
    if (reduceMotion) {
      // single static render — still arched, no animation
      frame(0, 0);
    } else {
      requestAnimationFrame(tick);
    }
  }

  document.querySelectorAll('[data-swoosh]').forEach(initSwoosh);

  /* ===================================================================
   * 5. PARALLAX ON HERO DATA CARD — single decisive flourish
   * =================================================================== */
  const parallaxCard = document.querySelector('[data-parallax="hero-card"]');
  if (parallaxCard && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = 200;
      const offset = Math.max(-12, Math.min(12, y / 24)) * (y > max ? 0 : 1);
      parallaxCard.style.transform = `translateY(${offset.toFixed(1)}px)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  /* ===================================================================
   * 6. ANIMATED COUNTERS on .stat__num[data-count]
   *    e.g. data-count="200000" data-suffix="+" data-prefix=""
   * =================================================================== */
  function formatNumber(n, opts) {
    if (opts.format === 'compact') {
      if (n >= 1000) {
        const k = n / 1000;
        return (k >= 100 ? k.toFixed(0) : k.toFixed(k >= 10 ? 0 : 1)) + 'K';
      }
    }
    return Math.round(n).toLocaleString('en-US');
  }
  function animateCount(el) {
    const target = parseFloat(el.dataset.count || '0');
    const dur = parseInt(el.dataset.duration || '1400', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const format = el.dataset.format || '';
    if (reduceMotion) {
      el.textContent = prefix + formatNumber(target, { format }) + suffix;
      return;
    }
    let start = null;
    const startVal = 0;
    function step(ts) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = startVal + (target - startVal) * eased;
      el.textContent = prefix + formatNumber(val, { format }) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll('.stat__num[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCount(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  }

  /* ===================================================================
   * 7. PARTNER JOURNEY — gated 9-step sequential wizard
   *
   * The iframe loads flows/affiliate_onboarding/index.html?screen=<id>&hold=1.
   * In hold mode the inner FlowApp suppresses internal navigation but still
   * postMessages { type:'flow-advance', from, to, opts } when the user
   * fires a screen's primary action. We listen for that message and only
   * enable the parent's "Continue" button when the message matches the
   * forward action expected for the current step.
   * =================================================================== */
  const stage = document.getElementById('journeyStage');
  if (stage) {
    const STEPS = [
      { id: 'start',     title: 'Welcome to Kardit',      sub: 'Begin your affiliate application — click "Start Onboarding" inside the panel below.', cta: 'Start Onboarding',                                   expect: ['org'] },
      { id: 'org',       title: 'Organization & Contact',      sub: 'Step 1 of 4 in the application — confirm the pre-filled details, then continue.',     cta: 'Next: Documents',                                    expect: ['docs'] },
      { id: 'docs',      title: 'KYB / KYC Documents',         sub: 'Upload (or simulate) the documents required for compliance review.',                  cta: 'Next: Banks',                                        expect: ['banks'] },
      { id: 'banks',     title: 'Issuing Banks',               sub: 'Pick the banks Kardit will route through. Three are pre-selected — add more or continue.', cta: 'Review & Submit',                          expect: ['review'] },
      { id: 'review',    title: 'Review & Submit',             sub: 'Tick the consent box and submit. The flow will catch the missing utility bill and route you to validation.', cta: 'Submit application',          expect: ['errors', 'submitted'], status: 'review', sticky: { confirmed: true } },
      { id: 'errors',    title: 'Validation Errors',           sub: 'A real flow surfaces issues before submission. Click any "Fix Now" button to advance the journey.',           cta: 'Fix any issue',               expect: ['org', 'docs', 'banks'] },
      { id: 'submitted', title: 'Application Submitted',       sub: 'Your case is in the queue. Click "View Status" to track it.',                          cta: 'View Status',                                        expect: ['status'] },
      { id: 'status',    title: 'Status — Awaiting Response',  sub: 'Compliance has flagged the proof-of-address upload. Open the clarification message.',  cta: 'Respond to Clarification',                           expect: ['respond'], status: 'clarification' },
      { id: 'respond',   title: 'Respond to Clarification',    sub: 'Type a short message or attach a re-uploaded file, then submit your response.',        cta: 'Submit response',                                    expect: ['status'], status: 'clarification' },
    ];

    /* Persistence keys — localStorage so progress survives tab close.
       Web-app behavior: returning users land in the state they left. */
    const STORE_KEY    = 'cs-partner-journey-step';
    const STORE_TS     = 'cs-partner-journey-ts';
    const STORE_DONE   = 'cs-partner-journey-completed';
    const STORE_REF    = 'cs-partner-journey-ref';

    const frame    = document.getElementById('flowFrame');
    const frameBox = stage.querySelector('.journey-stage__frame');
    const railLis  = document.querySelectorAll('#journeyRail li');
    const ringFg   = document.getElementById('ringFg');
    const ringStep = document.getElementById('ringStep');
    const ringTitle= document.getElementById('ringTitle');
    const hStep    = document.getElementById('hStep');
    const hTitle   = document.getElementById('hTitle');
    const hSub     = document.getElementById('hSub');
    const hHint    = document.getElementById('hHint');
    const statusText = document.getElementById('statusText');
    const nextBtn  = document.getElementById('nextBtn');
    const nextLabel= document.getElementById('nextLabel');
    const completed= document.getElementById('completedCount');
    const restart  = document.getElementById('restartBtn');
    const restart2 = document.getElementById('restartBtn2');
    const completeCard = document.getElementById('journeyComplete');
    const resumeBanner = document.getElementById('resumeBanner');
    const resumeBtn    = document.getElementById('resumeBtn');
    const resumeStep   = document.getElementById('resumeStep');
    const resumeTime   = document.getElementById('resumeTime');
    const resumeStart  = document.getElementById('resumeStart');
    const savedTag     = document.getElementById('savedTag');
    const refDisplay   = document.getElementById('refNumber');

    const RING_CIRC = 213.6; // 2πr where r=34
    let current = 0;
    let ready   = false;
    let doneCount = 0;

    /* ------- safe scroll: window.scrollTo, not Element.scrollIntoView,
       which can break embedded previews per brand spec ------- */
    function scrollToEl(el) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - 24; // small offset for breathing room
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    /* ------- storage helpers ------- */
    function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
    function lsDel(k) { try { localStorage.removeItem(k); } catch (_) {} }
    function relTime(tsStr) {
      const ts = parseInt(tsStr || '0', 10);
      if (!ts) return '';
      const diff = Date.now() - ts;
      if (diff < 60_000) return 'just now';
      if (diff < 3600_000) {
        const m = Math.floor(diff / 60_000);
        return `${m} minute${m === 1 ? '' : 's'} ago`;
      }
      if (diff < 86400_000) {
        const h = Math.floor(diff / 3600_000);
        return `${h} hour${h === 1 ? '' : 's'} ago`;
      }
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    function genRef() {
      // CS-Affil-YYMMDD-XXXX format — looks like a real case reference
      const d = new Date();
      const yymmdd = String(d.getFullYear()).slice(2) +
                     String(d.getMonth() + 1).padStart(2, '0') +
                     String(d.getDate()).padStart(2, '0');
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      return `CS-AFFIL-${yymmdd}-${rand}`;
    }

    /* ------- detect prior session ------- */
    const isCompleted = lsGet(STORE_DONE) === '1';
    const savedStr = lsGet(STORE_KEY);
    const savedNum = savedStr === null ? -1 : parseInt(savedStr, 10);
    const hasSaved = !isNaN(savedNum) && savedNum > 0 && savedNum < STEPS.length;
    if (hasSaved) current = savedNum;

    function buildSrc(idx) {
      const s = STEPS[idx];
      const params = new URLSearchParams({ screen: s.id, hold: '1' });
      if (s.status) params.set('status', s.status);
      // cache-bust so the iframe resets fresh state on each step
      params.set('_t', String(Date.now()));
      return 'flows/affiliate_onboarding/index.html?' + params.toString();
    }

    function paint() {
      const s = STEPS[current];
      const pct = (current) / STEPS.length;       // pre-action: how many we've passed
      ringFg.setAttribute('stroke-dashoffset', String(RING_CIRC * (1 - pct)));
      ringStep.textContent = String(current + 1);
      ringTitle.textContent = s.title;
      hStep.textContent = String(current + 1);
      hTitle.textContent = s.title;
      hSub.textContent = s.sub;

      railLis.forEach((li, i) => {
        li.classList.toggle('is-current', i === current);
        li.classList.toggle('is-done',    i <  current);
      });

      doneCount = current; // strictly forward — current = # completed
      completed.textContent = `${doneCount} of ${STEPS.length} completed`;

      // saved-state badge in the wizard footer
      if (savedTag) {
        const ts = lsGet(STORE_TS);
        if (current > 0 && ts) {
          savedTag.hidden = false;
          savedTag.textContent = `Auto-saved ${relTime(ts)}`;
        } else {
          savedTag.hidden = true;
        }
      }

      // gate state
      ready = false;
      nextBtn.disabled = true;
      hHint.classList.remove('is-ready');
      statusText.textContent = `Awaiting your "${s.cta}" click…`;
      nextLabel.textContent = (current === STEPS.length - 1)
        ? 'Complete the action above to finish'
        : `Skip ahead to step ${current + 2}`;
    }

    /* ------- transition flash: a brief overlay between iframe loads
       so the screen change feels deliberate, not a yank ------- */
    function flash(text) {
      const ov = document.getElementById('overlay');
      if (!ov) return;
      const t = ov.querySelector('.overlay-text');
      if (t) t.textContent = text;
      ov.classList.add('is-flash');
      setTimeout(() => ov.classList.remove('is-flash'), 700);
    }

    function persistProgress() {
      lsSet(STORE_KEY, String(current));
      lsSet(STORE_TS, String(Date.now()));
    }

    function loadFrame() {
      frameBox.classList.add('is-loading');
      const ov = document.getElementById('overlay');
      const t = ov && ov.querySelector('.overlay-text');
      if (t) t.textContent = 'Loading next screen…';
      frame.src = buildSrc(current);
      frame.addEventListener('load', () => {
        // give the React app a tick to mount before unblurring
        setTimeout(() => frameBox.classList.remove('is-loading'), 220);
      }, { once: true });
    }

    function markReady() {
      if (ready) return;
      ready = true;
      nextBtn.disabled = false;
      hHint.classList.add('is-ready');
      const isLast = current === STEPS.length - 1;
      statusText.textContent = isLast ? 'You\'ve completed the journey.' : 'Got it — moving to the next step…';
      nextLabel.textContent = isLast
        ? 'Finish the journey'
        : `Continue to step ${current + 2}: ${STEPS[current + 1].title}`;
      // Auto-advance: the iframe broadcast IS the user's intent to advance.
      // A brief flash gives them a beat to see the confirmation before the
      // iframe content swaps.
      const delay = reduceMotion ? 0 : 650;
      flash(isLast ? 'Submitting…' : 'Got it — next step');
      setTimeout(() => {
        // Guard: user might have hit Restart in the meantime
        if (ready) advance();
      }, delay);
    }

    function advance() {
      if (!ready) return;
      if (current >= STEPS.length - 1) {
        // journey done — persist completion + reference, show completion card
        let ref = lsGet(STORE_REF);
        if (!ref) { ref = genRef(); lsSet(STORE_REF, ref); }
        lsSet(STORE_DONE, '1');
        lsSet(STORE_TS, String(Date.now()));
        lsDel(STORE_KEY);
        if (refDisplay) refDisplay.textContent = ref;
        stage.style.display = 'none';
        completeCard.hidden = false;
        scrollToEl(completeCard);
        return;
      }
      current += 1;
      persistProgress();
      paint();
      loadFrame();
    }

    function reset() {
      current = 0;
      lsDel(STORE_KEY);
      lsDel(STORE_TS);
      lsDel(STORE_DONE);
      lsDel(STORE_REF);
      if (resumeBanner) resumeBanner.hidden = true;
      stage.style.display = '';
      completeCard.hidden = true;
      paint();
      loadFrame();
    }

    nextBtn.addEventListener('click', advance);
    restart.addEventListener('click', () => {
      if (current > 0 && !confirm('Restart will clear your saved progress. Continue?')) return;
      reset();
    });
    if (restart2) restart2.addEventListener('click', () => { reset(); scrollToEl(stage); });

    // resume banner controls
    if (resumeBtn) resumeBtn.addEventListener('click', () => {
      resumeBanner.hidden = true;
      scrollToEl(stage);
    });
    if (resumeStart) resumeStart.addEventListener('click', () => {
      if (!confirm('Start over? Your saved progress will be cleared.')) return;
      reset();
      scrollToEl(stage);
    });

    // beforeunload guard — only when mid-application (not completed, not at step 0)
    window.addEventListener('beforeunload', (e) => {
      if (current > 0 && !lsGet(STORE_DONE)) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // listen for the iframe's flow-advance broadcast
    window.addEventListener('message', (e) => {
      const data = e && e.data;
      if (!data || data.type !== 'flow-advance') return;
      const s = STEPS[current];
      if (!s) return;
      if (s.expect.includes(data.to)) markReady();
    });

    /* ------- initial render: branch on prior state ------- */
    if (isCompleted) {
      // Returning user who finished — land them on completion card with ref
      const ref = lsGet(STORE_REF) || genRef();
      lsSet(STORE_REF, ref);
      if (refDisplay) refDisplay.textContent = ref;
      stage.style.display = 'none';
      completeCard.hidden = false;
    } else {
      // Show resume banner if there's mid-journey progress
      if (hasSaved && resumeBanner) {
        resumeBanner.hidden = false;
        if (resumeStep) resumeStep.textContent = `Step ${current + 1} of ${STEPS.length} — ${STEPS[current].title}`;
        if (resumeTime) resumeTime.textContent = relTime(lsGet(STORE_TS));
      }
      paint();
      loadFrame();
    }
  }

})();
