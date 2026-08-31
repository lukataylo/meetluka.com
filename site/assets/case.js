/* ============================================================
   Case-study pages — motion + the NDA gate. No library.
   ============================================================ */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /* ---------- NDA gate --------------------------------------------
     Client-side only, exactly like the gate on the existing site: it
     keeps the page from being read at a glance, not from being read at
     all. Nothing here is a security control. */
  const gate = document.querySelector('[data-gate]');
  const locked = document.querySelector('[data-locked]');
  if (gate && locked) {
    const key = gate.dataset.key;
    const err = gate.querySelector('[data-err]');
    const open = () => {
      gate.hidden = true;
      locked.hidden = false;
      try { sessionStorage.setItem('cs-' + location.pathname, '1'); } catch {}
      locked.querySelectorAll('.reveal,.wordset').forEach((el) => io.observe(el));
    };
    /* the desktop's lock screen unlocks the page through this */
    self.HIW_UNLOCK = open;
    try { if (sessionStorage.getItem('cs-' + location.pathname)) open(); } catch {}
    gate.addEventListener('submit', (e) => {
      e.preventDefault();
      if (gate.elements.key.value.trim() === key) return open();
      err.hidden = false;
      gate.elements.key.select();
    });
  }

  /* ---------- "show how I work" -------------------------------------
     The desktop outweighs the case page it sits on many times over
     (the README carries the real numbers), and most people will never
     open it, so nothing is fetched until the button is pressed. The
     stylesheet and data land in parallel; the runtime waits on them,
     since it needs the data to already be there. */
  const trigger = document.querySelector('[data-hiw]');
  if (trigger) {
    const base = document.currentScript ? document.currentScript.src : location.href;
    const url = (f) => new URL(f, base).href;
    let loading = null;

    const asset = (tag, attrs) => new Promise((resolve, reject) => {
      const node = Object.assign(document.createElement(tag), attrs);
      node.onload = resolve;
      node.onerror = () => reject(new Error(attrs.href || attrs.src));
      document.head.append(node);
    });

    /* Apps are plugins: hiw.js is the shell and window manager, and each
       hiw-app-*.js registers itself into it. Adding an app to a desktop
       means adding a file here and an entry in build/how-i-work.mjs. */
    const PLUGINS = ['hiw-app-outlook.js', 'hiw-app-finder.js', 'hiw-app-settings.js'];

    const load = (slug) => (loading ||= Promise.all([
      asset('link', { rel: 'stylesheet', href: url('hiw.css') }),
      asset('script', { src: url(`hiw-${slug}.js`) }),
    ])
      .then(() => asset('script', { src: url('hiw.js') }))
      /* A plugin that fails to load costs its app, not the desktop —
         the shell and the built-ins still work without it. */
      .then(() => Promise.all(PLUGINS.map((f) =>
        asset('script', { src: url(f) }).catch(() => {})))));

    trigger.addEventListener('click', async () => {
      const slug = trigger.dataset.hiw;
      trigger.disabled = true;
      try {
        await load(slug);
        self.HowIWork.open(slug, trigger);
      } catch (e) {
        /* the page is still a perfectly good case study without it, but a
           swallowed failure here is indistinguishable from a dead button */
        console.error('how-i-work failed to open:', e);
        loading = null;
      } finally {
        trigger.disabled = false;
      }
    });

    /* Warm the cache on intent rather than on load, so the click feels
       instant without costing anyone who never hovers it. */
    for (const ev of ['pointerenter', 'focus']) {
      trigger.addEventListener(ev, () => load(trigger.dataset.hiw).catch(() => { loading = null; }), { once: true });
    }
  }

  /* ---------- reveal on enter --------------------------------------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  if (reduced) {
    document.querySelectorAll('.reveal,.wordset').forEach((el) => el.classList.add('in'));
    return;
  }
  document.querySelectorAll('.reveal,.wordset').forEach((el) => io.observe(el));

  /* ---------- scroll: hero recede + read progress -------------------
     Both are transform/opacity on one element each, off a single
     rAF-throttled listener. */
  const hero = document.querySelector('.cs-hero-in');
  const heroBox = document.querySelector('.cs-hero');
  const bar = document.querySelector('[data-progress]');
  const root = document.documentElement;

  let heroH = 0, span = 0, queued = false, settle;

  function measure() {
    heroH = heroBox ? heroBox.offsetHeight : 0;
    span = Math.max(1, document.body.scrollHeight - innerHeight);
  }

  function paint() {
    const y = scrollY;
    if (hero && y < heroH) {
      const p = clamp(y / heroH);
      hero.style.transform = `translateY(${(-p * 5).toFixed(2)}%)`;
      hero.style.opacity = (1 - p * .7).toFixed(3);
    }
    if (bar) bar.style.transform = `scaleX(${(y / span).toFixed(4)})`;
  }

  function onScroll() {
    // hold the ambient loops while the page moves — see style.css
    if (!('still' in root.dataset)) root.dataset.still = '';
    clearTimeout(settle);
    settle = setTimeout(() => delete root.dataset.still, 170);

    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; paint(); });
  }

  measure();
  paint();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); paint(); }, { passive: true });
})();
