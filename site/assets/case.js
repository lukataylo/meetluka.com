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
    try { if (sessionStorage.getItem('cs-' + location.pathname)) open(); } catch {}
    gate.addEventListener('submit', (e) => {
      e.preventDefault();
      if (gate.elements.key.value.trim() === key) return open();
      err.hidden = false;
      gate.elements.key.select();
    });
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
