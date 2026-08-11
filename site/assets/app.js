/* ============================================================
   Luka Dadiani — landing page motion

   No animation library. Everything here is either an
   IntersectionObserver toggling a CSS class, or one rAF-throttled
   scroll handler. GSAP was 115KB to do exactly that.
   ============================================================ */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  const flow = document.querySelector('[data-flow]');
  const shell = document.querySelector('[data-shell]');
  const canvas = document.querySelector('[data-canvas]');
  const heroLayer = document.querySelector('[data-hero-layer]');
  const view = document.querySelector('[data-letter-view]');
  const prism = document.querySelector('[data-prism]');
  const island = document.querySelector('.island');

  /* ---------- reveal on enter ---------------------------------------
     The transition itself lives in CSS; this only flips the class. */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal,.wordset').forEach((el) => io.observe(el));

  /* ---------- the letter's words ------------------------------------
     Split here rather than in the markup: 170 hand-authored spans would
     be unmaintainable prose and 4KB of HTML on every visit. */
  const letterWords = [];
  if (flow) {
    for (const p of flow.querySelectorAll('p')) {
      const frag = document.createDocumentFragment();
      for (const part of p.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = part;
        letterWords.push(span);
        frag.appendChild(span);
      }
      p.textContent = '';
      p.appendChild(frag);
    }
  }

  if (reduced || !shell || !letterWords.length) {
    letterWords.forEach((w) => { w.style.opacity = 1; w.style.filter = 'none'; });
    view && (view.style.opacity = 1);
    island?.classList.add('on');
    document.querySelectorAll('.reveal,.wordset').forEach((el) => el.classList.add('in'));
    return;
  }

  /* ================================================================
     the shell — one scrubbed pass drives two phases:

       phase 1 (morph)  the full-bleed hero canvas contracts into the
                        rounded letter card while the hero content
                        recedes and the prose fades up behind it
       phase 2 (letter) the prose scrolls through the card, each word
                        sharpening as it crosses the reading line

     Both run off one handler so the gradient, the ribbon and the card
     are literally the same element throughout — there is no seam where
     one section ends and the next begins.
     ================================================================ */
  const RADIUS = 28;
  const tops = [];
  const last = [];
  let shellTop, ih, padY, padX, cardH, startY, endY, line, run, morphD, D, exitFrom, exitTo;
  let lastMp = -1;

  // Geometry is resolved once per layout. The scroll handler then only
  // writes styles — it never reads the DOM back.
  function measure() {
    ih = innerHeight;
    shellTop = shell.offsetTop;
    // The card is a panel, not a full-bleed pane: roughly 78% of the viewport
    // wide (capped so it stays a card on very wide screens) and inset top and
    // bottom. Narrow screens keep tight margins — there is no width to give away.
    const narrow = innerWidth < 760;
    padY = Math.round(ih * (narrow ? .05 : .13));
    padX = narrow ? 14 : Math.round((innerWidth - Math.min(innerWidth * .78, 1560)) / 2);
    cardH = ih - padY * 2;

    const flowH = flow.offsetHeight;
    for (let i = 0; i < letterWords.length; i++) {
      tops[i] = letterWords[i].offsetTop + letterWords[i].offsetHeight * .55;
      last[i] = -1;
    }

    startY = cardH * .72;
    endY = cardH * .58 - flowH;
    line = cardH * .44;
    run = cardH * .30;

    // the canvas stays full-bleed, so the letter needs its own inset to sit
    // inside the visual card — one write per layout, never per frame
    view.style.top = view.style.bottom = padY + 'px';

    morphD = Math.round(ih * .85);
    D = Math.round(morphD + (startY - endY) * 1.12);

    // sizing the shell to the card's own footprint lands the last word
    // just before the sticky card releases
    const shellH = D + ih;
    shell.style.height = shellH + 'px';
    exitFrom = shellTop + shellH - ih;
    exitTo = shellTop + shellH - ih * .52;

    lastMp = -1;
  }

  function paint() {
    const y0 = scrollY;
    const mp = clamp((y0 - shellTop) / morphD);
    const lp = clamp((y0 - shellTop - morphD) / (D - morphD));

    // The morph writes top/left/right/bottom, which is a layout of the
    // whole canvas subtree. mp sits pinned at 1 for the entire letter, so
    // repeating those writes every frame was pure waste.
    if (Math.abs(mp - lastMp) > .0005) {
      lastMp = mp;

      // smoothstep so the card settles into place rather than arriving flat.
      // One clip-path write, not five box offsets: no layout, and the layers
      // underneath keep the raster they already had.
      const e = mp * mp * (3 - 2 * mp);
      const ty = (e * padY).toFixed(1);
      const tx = (e * padX).toFixed(1);
      canvas.style.clipPath = `inset(${ty}px ${tx}px round ${(e * RADIUS).toFixed(1)}px)`;

      // hero is gone by the halfway point, so the exchange with the prose
      // reads as a handoff rather than two layers competing
      const ho = clamp(1 - mp / .5);
      heroLayer.style.opacity = ho.toFixed(3);
      heroLayer.style.transform =
        `translateX(-50%) translateY(${(-mp * 46).toFixed(1)}px) scale(${(1 - mp * .04).toFixed(4)})`;
      // an opacity:0 layer is still a layer, and this one is a full
      // viewport in size — take it out of the paint path entirely
      heroLayer.style.visibility = ho === 0 ? 'hidden' : 'visible';
      heroLayer.style.pointerEvents = ho < .05 ? 'none' : '';

      const li = clamp((mp - .44) / .48).toFixed(3);
      view.style.opacity = li;
      prism.style.opacity = li;

      island.classList.toggle('on', mp > .6);
    }

    const y = startY + (endY - startY) * lp;
    flow.style.transform = `translate(-50%, ${y.toFixed(1)}px)`;

    // The fade is handled by the mask on .letter-view. All that is left here is
    // the softening, and only for words actually crossing the reading line —
    // roughly twenty at a time rather than all hundred and seventy. Blurring
    // text that the mask has already faded to nothing costs a repaint and buys
    // nothing.
    for (let i = 0; i < letterWords.length; i++) {
      const d = clamp((tops[i] + y - line) / run);
      const blur = d > .04 && d < .72 ? (d - .04) * 3.4 : 0;
      if (Math.abs(blur - last[i]) < .04) continue;
      last[i] = blur;
      letterWords[i].style.filter = blur ? `blur(${blur.toFixed(2)}px)` : '';
    }

    // once the letter has landed, the card recedes rather than trundling
    // a screenful of empty paper up the page
    const ex = clamp((y0 - exitFrom) / (exitTo - exitFrom));
    canvas.style.opacity = ex ? (1 - ex).toFixed(3) : '';
    canvas.style.transform = ex ? `scale(${(1 - ex * .045).toFixed(4)})` : '';
  }

  /* ---------- one rAF-throttled listener for the whole page ---------- */
  let queued = false;
  let settle;
  const root = document.documentElement;

  function onScroll() {
    // hold the ambient loops while the page moves — see style.css. Only on
    // the edges: writing the attribute every frame invalidates the whole
    // document's styles and costs more than it saves.
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

  /* "About" should land on the letter, not replay the morph */
  document.querySelectorAll('a[href="#letter"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo({ top: shellTop + morphD + (D - morphD) * .06, behavior: 'smooth' });
    });
  });
})();
