/* ============================================================
   "Show how I work" — a mock macOS desktop.

   Loaded on demand by case.js, never on first paint. Vanilla, no
   framework: the whole desktop is one detached DOM tree that is
   built once, appended, and thrown away on close.

   The performance rules from style.css apply here too. In particular
   the two translucent surfaces — the menu bar and the dock — are
   `backdrop-filter`, which is expensive to re-rasterise, so nothing
   is ever animated behind them and the dock's magnification is a
   transform on the icons alone.
   ============================================================ */
(() => {
  'use strict';

  const MOBILE = '(max-width: 900px)';
  const MIN_W = 360;
  const MIN_H = 260;

  /* The URL this script was loaded from. Captured now, while
     document.currentScript is still set — it is null by the time a
     visitor presses the button — so the wallpaper resolves the same
     way from the site root and from work/. */
  const BASE = (document.currentScript && document.currentScript.src) || location.href;

  const isMobile = () => matchMedia(MOBILE).matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  /* ---------- tiny DOM builder --------------------------------------
     el('div.foo', {attrs}, ...children). Children may be nodes,
     strings, or nullish (skipped), which keeps the render functions
     below readable without a template language. */
  function el(spec, props, ...kids) {
    const [tag, ...cls] = String(spec).split('.');
    const node = document.createElement(tag || 'div');
    if (cls.length) node.className = cls.join(' ');
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style') Object.assign(node.style, v);
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    add(node, kids);
    return node;
  }
  function add(node, kids) {
    for (const k of kids) {
      if (k == null || k === false) continue;
      if (Array.isArray(k)) add(node, k);
      else node.append(k.nodeType ? k : document.createTextNode(k));
    }
  }
  /* ---------- arrow keys in a list ----------------------------------
     Every macOS list walks with the arrow keys and brings the reading
     pane with it, so a row that is already a focusable control gets the
     same treatment: move focus, then click it. Bound on the container,
     so rebuilding the rows does not need re-binding. */
  function listKeys(box, sel, axis) {
    const prev = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const next = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
    box.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== prev && e.key !== next && e.key !== 'Home' && e.key !== 'End') return;
      const rows = [...box.querySelectorAll(sel)];
      const at = rows.indexOf(e.target.closest(sel));
      if (at < 0) return;
      e.preventDefault();
      const to = e.key === 'Home' ? 0
        : e.key === 'End' ? rows.length - 1
        : clamp(at + (e.key === next ? 1 : -1), 0, rows.length - 1);
      if (to === at) return;
      rows[to].focus();
      rows[to].click();
    });
  }

  const svg = (viewBox, body, attrs = '') =>
    `<svg viewBox="${viewBox}" fill="none" aria-hidden="true" ${attrs}>${body}</svg>`;

  /* `[[text]]` marks a run: a highlight in a document, bold in a note. */
  function inline(node, text, tag) {
    for (const part of String(text).split(/(\[\[.*?\]\])/g)) {
      if (!part) continue;
      if (part.startsWith('[[')) node.append(el(tag, { text: part.slice(2, -2) }));
      else node.append(document.createTextNode(part));
    }
    return node;
  }

  /* ---------- icons -------------------------------------------------- */
  const ICONS = {
    apple: svg('0 0 16 19',
      '<path fill="currentColor" d="M13.1 10.1c0-2 1.6-3 1.7-3-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2C1.6 9.9 2.6 13.6 4 15.6c.7 1 1.5 2.1 2.6 2 1 0 1.4-.6 2.7-.6s1.6.6 2.7.6 1.8-1 2.5-2c.8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.2zM11.2 4.2c.5-.7.9-1.6.8-2.6-.8 0-1.8.6-2.4 1.3-.5.6-1 1.6-.8 2.5.9.1 1.8-.5 2.4-1.2z"/>', 'width="14" height="17"'),
    wifi: svg('0 0 17 12',
      '<path fill="currentColor" d="M8.5 11 6 8.4a3.6 3.6 0 0 1 5 0zM3.6 6.1a7 7 0 0 1 9.8 0l-1.3 1.4a5.2 5.2 0 0 0-7.2 0zM1.1 3.6a10.5 10.5 0 0 1 14.8 0l-1.3 1.3a8.7 8.7 0 0 0-12.2 0z"/>', 'width="17" height="12"'),
    search: svg('0 0 15 15',
      '<circle cx="6.6" cy="6.6" r="4.6" stroke="currentColor" stroke-width="1.5"/><path d="m10.2 10.2 2.9 2.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'width="14" height="14"'),
    control: svg('0 0 16 13',
      '<path d="M1 3h14M1 10h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="5.5" cy="3" r="2" fill="currentColor"/><circle cx="10.5" cy="10" r="2" fill="currentColor"/>', 'width="16" height="13"'),
    battery: svg('0 0 27 13',
      '<rect x=".75" y="1.25" width="21.5" height="10.5" rx="3.1" stroke="currentColor" stroke-opacity=".5" stroke-width="1"/><rect x="2.5" y="3" width="15" height="7" rx="1.8" fill="currentColor"/><path d="M24 4.6v3.8a2.7 2.7 0 0 0 0-3.8z" fill="currentColor" fill-opacity=".5"/>', 'width="25" height="12"'),
    lock: svg('0 0 10 12',
      '<rect x="1" y="5" width="8" height="6" rx="1.5" stroke="currentColor"/><path d="M3 5V3.3a2 2 0 0 1 4 0V5" stroke="currentColor"/>', 'width="9" height="11"'),
    frame: svg('0 0 12 12', '<rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor"/>', 'class="ic"'),
    close: svg('0 0 8 8', '<path d="M1.2 1.2 6.8 6.8M6.8 1.2 1.2 6.8" stroke="#4d0f0b" stroke-width="1.5" stroke-linecap="round"/>'),
    min: svg('0 0 8 8', '<path d="M1.2 4h5.6" stroke="#66490b" stroke-width="1.5" stroke-linecap="round"/>'),
    zoom: svg('0 0 8 8',
      '<path d="M3.5 1H1v2.5M1 1l2.3 2.3M4.5 7H7V4.5M7 7 4.7 4.7" stroke="#0b4715" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>'),
    bell: svg('0 0 18 18', '<path d="M9 2.2a4.4 4.4 0 0 1 4.4 4.4c0 3.4 1.1 4.3 1.1 4.3H3.5s1.1-.9 1.1-4.3A4.4 4.4 0 0 1 9 2.2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.4 13.4a1.7 1.7 0 0 0 3.2 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'width="18" height="18"'),
    bubble: svg('0 0 18 18', '<path d="M2.4 4.2A1.8 1.8 0 0 1 4.2 2.4h9.6a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8H7l-3.5 3v-3h-.3a.8.8 0 0 1-.8-.8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>', 'width="18" height="18"'),
    people: svg('0 0 18 18', '<circle cx="6.9" cy="6" r="2.6" stroke="currentColor" stroke-width="1.5"/><path d="M2.2 14.4a4.7 4.7 0 0 1 9.4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12.3 4.1a2.4 2.4 0 0 1 0 4.6M13.2 10.6a4 4 0 0 1 2.6 3.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'width="18" height="18"'),
    cal: svg('0 0 18 18', '<rect x="2.4" y="3.6" width="13.2" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2.4 7.2h13.2M6 2.2v2.6M12 2.2v2.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'width="18" height="18"'),
    files: svg('0 0 18 18', '<path d="M4 2.6h5.4l4.6 4.5v8.3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.6a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9.3 2.8v4.3h4.4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>', 'width="18" height="18"'),
    x: svg('0 0 10 10', '<path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>', 'width="10" height="10"'),
    plus: svg('0 0 12 12', '<path d="M6 1.6v8.8M1.6 6h8.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>', 'width="12" height="12"'),
    back: svg('0 0 16 16', '<path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'width="16" height="16"'),
    fwd: svg('0 0 16 16', '<path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'width="16" height="16"'),
    reload: svg('0 0 16 16', '<path d="M13 8a5 5 0 1 1-1.6-3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13.2 2v3.1h-3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'width="16" height="16"'),
    star: svg('0 0 14 14', '<path d="m7 2 1.5 3.4 3.5.4-2.6 2.4.7 3.5L7 9.9l-3.1 1.8.7-3.5L2 5.8l3.5-.4z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>', 'width="14" height="14"'),
    puzzle: svg('0 0 16 16', '<path d="M6.4 2.6a1.4 1.4 0 0 1 2.8 0V3.6h2.6a.8.8 0 0 1 .8.8v2.2h.8a1.4 1.4 0 0 1 0 2.8h-.8v2.2a.8.8 0 0 1-.8.8H9.2v-1a1.4 1.4 0 0 0-2.8 0v1H3.8a.8.8 0 0 1-.8-.8V9.4h1a1.4 1.4 0 0 0 0-2.8H3V4.4a.8.8 0 0 1 .8-.8h2.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>', 'width="16" height="16"'),
    warn: svg('0 0 13 13',
      '<path d="M6.5 1.4 12.2 11H.8z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6.5 5.2v2.6M6.5 9.4v.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>', 'width="12" height="12"'),
    flag: svg('0 0 12 14',
      '<path d="M2.2 1.2v11.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2.2 2.1h7.3l-1.6 2.7 1.6 2.7H2.2z" fill="currentColor"/>', 'width="11" height="13"'),
    folder: svg('0 0 16 14',
      '<path d="M1 3.4a1.6 1.6 0 0 1 1.6-1.6h3l1.5 1.7h5.3A1.6 1.6 0 0 1 14 5.1v6.3a1.6 1.6 0 0 1-1.6 1.6H2.6A1.6 1.6 0 0 1 1 11.4z" fill="currentColor"/>', 'width="15" height="14"'),
    tick: svg('0 0 10 10', '<path d="M2 5.2 4 7.2 8 2.8" stroke="#241d06" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>', 'width="10" height="10"'),
  };

  /* Dock glyphs. Each is [background, inner svg]. */
  const DOCK = {
    /* Brand marks from Simple Icons (CC0) on brand-coloured tiles — a
       consistent set, not an imitation of each vendor's icon art. The
       finder/trash/outlook tiles come from their plugins' register(). */
    figma: ["linear-gradient(160deg,#2c2c2e,#1a1a1c)",
      svg('0 0 24 24', '<path fill="#fff" d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"/>', 'width="27" height="27"')],
    code: ["linear-gradient(160deg,#2b312e,#14181a)",
      svg('0 0 24 24', '<path fill="#D97757" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>', 'width="27" height="27"')],
    chrome: ["linear-gradient(160deg,#fdfdfe,#e7ebf1)",
      svg('0 0 24 24', '<path fill="#4285F4" d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z"/>', 'width="27" height="27"')],
    notes: ['linear-gradient(#fff,#fdfdfd)', ''],
    teams: ["linear-gradient(160deg,#7b7fd4,#5457a6)",
      svg('0 0 24 24', '<path fill="#fff" d="M20.625 8.127q-.55 0-1.025-.205-.475-.205-.832-.563-.358-.357-.563-.832Q18 6.053 18 5.502q0-.54.205-1.02t.563-.837q.357-.358.832-.563.474-.205 1.025-.205.54 0 1.02.205t.837.563q.358.357.563.837.205.48.205 1.02 0 .55-.205 1.025-.205.475-.563.832-.357.358-.837.563-.48.205-1.02.205zm0-3.75q-.469 0-.797.328-.328.328-.328.797 0 .469.328.797.328.328.797.328.469 0 .797-.328.328-.328.328-.797 0-.469-.328-.797-.328-.328-.797-.328zM24 10.002v5.578q0 .774-.293 1.46-.293.685-.803 1.194-.51.51-1.195.803-.686.293-1.459.293-.445 0-.908-.105-.463-.106-.85-.329-.293.95-.855 1.729-.563.78-1.319 1.336-.756.557-1.67.861-.914.305-1.898.305-1.148 0-2.162-.398-1.014-.399-1.805-1.102-.79-.703-1.312-1.664t-.674-2.086h-5.8q-.411 0-.704-.293T0 16.881V6.873q0-.41.293-.703t.703-.293h8.59q-.34-.715-.34-1.5 0-.727.275-1.365.276-.639.75-1.114.475-.474 1.114-.75.638-.275 1.365-.275t1.365.275q.639.276 1.114.75.474.475.75 1.114.275.638.275 1.365t-.275 1.365q-.276.639-.75 1.113-.475.475-1.114.75-.638.276-1.365.276-.188 0-.375-.024-.188-.023-.375-.058v1.078h10.875q.469 0 .797.328.328.328.328.797zM12.75 2.373q-.41 0-.78.158-.368.158-.638.434-.27.275-.428.639-.158.363-.158.773 0 .41.158.78.159.368.428.638.27.27.639.428.369.158.779.158.41 0 .773-.158.364-.159.64-.428.274-.27.433-.639.158-.369.158-.779 0-.41-.158-.773-.159-.364-.434-.64-.275-.275-.639-.433-.363-.158-.773-.158zM6.937 9.814h2.25V7.94H2.814v1.875h2.25v6h1.875zm10.313 7.313v-6.75H12v6.504q0 .41-.293.703t-.703.293H8.309q.152.809.556 1.5.405.691.985 1.19.58.497 1.318.779.738.281 1.582.281.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752zm5.25-1.547v-5.203h-3.75v6.855q.305.305.691.452.387.146.809.146.469 0 .879-.176.41-.175.715-.48.304-.305.48-.715t.176-.879Z"/>', 'width="27" height="27"')],
    back: ['linear-gradient(160deg,#3b4a42,#1b2a22)',
      svg('0 0 24 24', '<path d="M14.6 5.4 8 12l6.6 6.6" stroke="#b9ce7c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>', 'width="25" height="25"')],
  };
  /* Notes is a paper texture rather than a glyph. */
  const NOTES_PAPER =
    'linear-gradient(#ffd35c,#ffc93c) top/100% 13px no-repeat,repeating-linear-gradient(#fff,#fff 7px,#ececef 7px,#ececef 8px)';

  /* ============================================================
     app surfaces
     ============================================================ */

  /* ---------- Figma ----------------------------------------------
     A real canvas: pan by dragging the background, zoom with the
     toolbar or ⌘-wheel, and click a frame — or its row in the layers
     panel — to select it. Selection drives the outline, the handles
     and the properties panel, which reads its dimensions off the
     frame that is actually selected. */
  function figmaApp(d, win) {
    const stage = el('div.hiw-fg-stage', {
      style: { width: d.stage.w + 'px', height: d.stage.h + 'px' },
    });
    const canvas = el('div.hiw-fg-canvas', null, el('div.hiw-fg-grid'), stage);
    const propsHost = el('div.hiw-fg-panel.right.hiw-pane');
    const frames = new Map();
    const layerRows = new Map();
    let selected = d.selectedFrameId;

    /* --- properties, derived from whichever frame is selected --- */
    function paintProps() {
      const f = d.frames.find((x) => x.id === selected);
      const groups = d.properties;
      const rows = groups.map((g) => (g.title === 'Frame' && f
        ? { title: 'Frame', rows: [
            { label: 'W', value: String(f.w) },
            { label: 'H', value: String(f.h) },
            ...g.rows.filter((r) => r.label !== 'W' && r.label !== 'H')] }
        : g));
      propsHost.replaceChildren(
        el('div.hiw-fg-head', { style: { justifyContent: 'flex-end' } },
          el('div.hiw-avatars', null, d.collaborators.map((c) =>
            el('span.hiw-av', { style: { background: c.color }, text: c.initials })))),
        ...rows.map((g) => el('div.hiw-fg-prop', null,
          el('div.hiw-eyebrow', { style: { marginBottom: '8px' }, text: g.title }),
          g.rows.map((r) => {
            const left = el('span');
            if (r.swatch) left.append(el('span.hiw-sw', { style: { background: r.swatch } }));
            left.append(r.label);
            return el('div.hiw-fg-prop-row', null, left, el('b', { text: r.value }));
          }))));
    }

    function select(id) {
      selected = id;
      for (const [fid, node] of frames) node.classList.toggle('sel', fid === id);
      for (const [fid, row] of layerRows) row.classList.toggle('sel', fid === id);
      paintProps();
    }

    /* --- layers --- */
    const layers = el('div.hiw-fg-layers.hiw-scroll', null,
      el('div.hiw-eyebrow', { text: 'Pages' }),
      d.pages.map((p) => el('div.hiw-fg-layer' + (p.active ? '.sel' : ''), { text: p.name })),
      el('div.hiw-eyebrow', { text: 'Layers' }),
      d.layers.map((l) => {
        const row = el('div.hiw-fg-layer');
        row.insertAdjacentHTML('beforeend', ICONS.frame);
        row.append(l.name);
        if (l.frame) {
          layerRows.set(l.frame, row);
          row.addEventListener('click', () => { select(l.frame); reveal(l.frame); });
        }
        return row;
      }));

    /* --- frames --- */
    for (const f of d.frames) {
      const node = el('div.hiw-frame', {
        style: { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px' },
      }, el('div.hiw-frame-name', { text: f.name }));

      /* every artboard is a real screenshot of the site, captured by
         Playwright — see the README. The canvas scrolls, so they can
         arrive as they are reached. */
      const box = el('div.hiw-frame-box', null, el('img', {
        src: new URL('shots/' + f.image, BASE).href,
        width: f.w, height: Math.round(f.w * f.ratio),
        loading: 'lazy', decoding: 'async', alt: f.name,
      }));
      node.append(box);

      for (const pos of [{ left: '-4px', top: '17px' }, { right: '-4px', top: '17px' },
        { left: '-4px', bottom: '-4px' }, { right: '-4px', bottom: '-4px' }]) {
        node.append(el('span.hiw-handle', { style: pos }));
      }

      if (d.comment && d.comment.frameId === f.id) {
        const note = el('div.hiw-pin-note', { style: { left: '-230px', top: '6px' }, hidden: true },
          el('b', { text: `${d.comment.author} · ${d.comment.ago}` }), d.comment.text);
        const pin = el('button.hiw-pin', {
          type: 'button', style: { right: '-12px', top: '6px' },
          'aria-label': `Comment from ${d.comment.author}`, 'aria-expanded': 'false',
          onclick: (e) => {
            e.stopPropagation();
            note.hidden = !note.hidden;
            pin.setAttribute('aria-expanded', String(!note.hidden));
          },
        }, d.comment.initials);
        pin.addEventListener('pointerdown', (e) => e.stopPropagation());
        node.append(pin, note);
      }

      node.addEventListener('pointerdown', (e) => { e.stopPropagation(); select(f.id); });
      frames.set(f.id, node);
      stage.append(node);
    }

    /* --- pan and zoom ------------------------------------------
       One transform on the stage. Panning never touches layout, so
       a drag across ten artboards is a compositor move. */
    let z = 1, px = 0, py = 0, raf = 0;  /* raf is read by win.onClose below */
    const zoomLabel = el('span.hiw-fg-zoom');
    const apply = () => {
      raf = 0;
      stage.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${z.toFixed(3)})`;
      zoomLabel.textContent = Math.round(z * 100) + '%';
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };

    /* The auto-fit below is deferred until the canvas has a real size,
       which can be after the visitor has already moved the canvas. Any
       gesture settles it, so the fit never lands on top of them. */
    function settle() {
      if (fitted) return;
      fitted = true;
      if (ro) ro.disconnect();
    }

    function zoomTo(next, cx, cy) {
      settle();
      const nz = clamp(next, 0.15, 3);
      const rect = canvas.getBoundingClientRect();
      const ax = (cx == null ? rect.width / 2 : cx - rect.left);
      const ay = (cy == null ? rect.height / 2 : cy - rect.top);
      /* keep the point under the cursor fixed while the scale changes */
      px = ax - ((ax - px) / z) * nz;
      py = ay - ((ay - py) / z) * nz;
      z = nz;
      queue();
    }

    /* Fit `box` — by default the product artboards rather than the whole
       stage, so the work is readable the moment the window opens; the
       Fit button reframes on the whole stage. */
    function fit(box) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return false;
      const b = box || d.fit || { x: 0, y: 0, w: d.stage.w, h: d.stage.h };
      z = clamp(Math.min((rect.width - 56) / b.w, (rect.height - 56) / b.h), 0.15, 1.4);
      px = rect.width / 2 - (b.x + b.w / 2) * z;
      py = rect.height / 2 - (b.y + b.h / 2) * z;
      queue();
      return true;
    }

    /* The canvas has no size until the window is on screen, and during
       the opening animation the box it reports is the scaled one. An
       observer just waits until it is real. */
    let fitted = false;
    let ro = null;
    if (self.ResizeObserver) {
      ro = new ResizeObserver(() => {
        if (fitted) return;
        if (fit()) { fitted = true; ro.disconnect(); }
      });
      ro.observe(canvas);
    } else {
      win.onFirstShow = () => win.timers.push(setTimeout(() => fit(), 320));
    }
    /* the pan/zoom frame is the one thing here that outlives the DOM */
    win.onClose = () => { if (ro) ro.disconnect(); if (raf) cancelAnimationFrame(raf); };

    /* bring a frame into view, used by the layers panel */
    function reveal(id) {
      settle();
      const f = d.frames.find((x) => x.id === id);
      if (!f) return;
      const rect = canvas.getBoundingClientRect();
      px = rect.width / 2 - (f.x + f.w / 2) * z;
      py = rect.height / 2 - (f.y + f.h / 2) * z;
      queue();
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      settle();
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      canvas.classList.add('panning');
      const sx = e.clientX, sy = e.clientY, ox = px, oy = py;
      const move = (ev) => { px = ox + ev.clientX - sx; py = oy + ev.clientY - sy; queue(); };
      const up = () => {
        canvas.classList.remove('panning');
        canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerup', up);
        canvas.removeEventListener('pointercancel', up);
      };
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      settle();
      if (e.ctrlKey || e.metaKey) zoomTo(z * (1 - e.deltaY / 400), e.clientX, e.clientY);
      else { px -= e.deltaX; py -= e.deltaY; queue(); }
    }, { passive: false });

    const tools = el('div.hiw-fg-tools', null,
      el('button', { type: 'button', 'aria-label': 'Zoom out', text: '\u2212', onclick: () => zoomTo(z - 0.15) }),
      zoomLabel,
      el('button', { type: 'button', 'aria-label': 'Zoom in', text: '+', onclick: () => zoomTo(z + 0.15) }),
      el('button', { type: 'button', text: 'Fit',
        onclick: () => { settle(); fit({ x: 0, y: 0, w: d.stage.w, h: d.stage.h }); } }));
    tools.addEventListener('pointerdown', (e) => e.stopPropagation());
    canvas.append(tools);

    select(selected);

    return el('div.hiw-body.hiw-fg', null,
      el('div.hiw-fg-panel.hiw-pane', null,
        el('div.hiw-fg-head', null,
          el('span.hiw-fg-mark', { html: DOCK.figma[1] }),
          el('span.hiw-fg-file', { text: d.file })),
        layers),
      canvas, propsHost);
  }

  /* ---------- Claude Code ---------- */
  function terminalApp(d, win) {
    const out = el('div.hiw-term.hiw-scroll');
    const status = el('div.hiw-term-status', null, d.status.map((s) => el('span', { text: s })));
    const body = el('div.hiw-body', null, el('div.hiw-term-wrap', null, out, status));

    const line = (l) => {
      const row = el('div.hiw-line' + (l.kind === 'out' ? '.hiw-box' : ''));
      if (l.kind === 'blank') { row.innerHTML = '&nbsp;'; return row; }
      if (l.kind === 'meta') return el('div.hiw-line', null,
        el('span.d', { text: l.text }), ' ', el('span.y', { text: l.branch }));
      if (l.kind === 'shell') return el('div.hiw-line', null,
        el('span.p', { text: '❯' }), ' ', el('span.u', { text: l.text }));
      if (l.kind === 'banner') return el('div.hiw-line', null,
        el('span.g', { text: '✻' }), ' ', el('span.d', { text: l.text }));
      if (l.kind === 'you') return el('div.hiw-line', null,
        el('span.g', { text: l.cont ? ' ' : '>' }), ' ', l.text);
      if (l.kind === 'tool') return el('div.hiw-line', null,
        el('span.t', { text: '●' }), ' ', el('span.u', { text: l.name }), `(${l.arg})`);
      if (l.kind === 'say') {
        const r = el('div.hiw-line');
        if (l.cont) r.append('  ');
        else r.append(el('span.t', { text: '●' }), ' ');
        r.append(l.text);
        return r;
      }
      if (l.kind === 'out') {
        l.lines.forEach((x, i) => {
          const sub = el('div', null, i === 0 ? '⎿  ' : '   ');
          if (x.pass) sub.append(el('span.g', { text: 'PASS' }), ' ');
          sub.append(x.text);
          row.append(sub);
        });
        return row;
      }
      if (l.kind === 'caret') return el('div.hiw-line', null,
        el('span.p', { text: '❯' }), ' ', el('span.hiw-caret'));
      return row;
    };

    /* Replay, once, the first time the window is shown. Reduced motion
       gets the finished transcript with no animation at all. */
    let started = false;
    win.onFirstShow = () => {
      if (started) return;
      started = true;
      if (reduced()) { d.lines.forEach((l) => out.append(line(l))); return; }
      let i = 0;
      const step = () => {
        if (i >= d.lines.length) return;
        const l = d.lines[i++];
        out.append(line(l));
        out.scrollTop = out.scrollHeight;
        const slow = l.kind === 'out' || (l.text || '').length > 40;
        win.timers.push(setTimeout(step, slow ? 150 : 80));
      };
      win.timers.push(setTimeout(step, 140));
    };
    return body;
  }

  /* ---------- Google Chrome ---------- */
  function chromeApp(d, win) {
    const page = el('div.hiw-cr-page.hiw-scroll');
    const urlText = el('span.hiw-cr-urltext');
    const strip = el('div.hiw-cr-tabs', { role: 'tablist' });
    const buttons = new Map();

    const show = (tab) => {
      for (const [id, b] of buttons) {
        const on = id === tab.id;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
      }
      urlText.textContent = tab.url;
      page.scrollTop = 0;
      page.replaceChildren(
        tab.type === 'board' ? board(tab) :
        tab.type === 'item' ? workItem(tab.item) :
        doc(tab.blocks));
      win.setTitle(tab.title);
    };

    for (const tab of d.tabs) {
      const b = el('div.hiw-cr-tab', { role: 'tab', tabindex: '0' },
        el('span.hiw-cr-fav', { style: { background: tab.favicon } }),
        el('span.hiw-cr-title', { text: tab.title }),
        el('span.hiw-cr-x', { html: ICONS.x }));
      b.addEventListener('click', () => show(tab));
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(tab); } });
      buttons.set(tab.id, b);
      strip.append(b);
    }
    strip.append(el('span.hiw-cr-new', { html: ICONS.plus }));
    listKeys(strip, '.hiw-cr-tab', 'x');
    /* the strip lives in the drag handle, so a tab click must not start a drag */
    strip.addEventListener('pointerdown', (e) => e.stopPropagation());
    if (win.tabHost) win.tabHost.append(strip);

    const toolbar = el('div.hiw-cr-bar', null,
      el('span.hiw-cr-nav', { html: ICONS.back }),
      el('span.hiw-cr-nav.dim', { html: ICONS.fwd }),
      el('span.hiw-cr-nav', { html: ICONS.reload }),
      el('div.hiw-cr-omni', null,
        el('span', { html: ICONS.lock }), urlText,
        el('span.hiw-cr-star', { html: ICONS.star })),
      el('span.hiw-cr-nav', { html: ICONS.puzzle }),
      el('span.hiw-cr-profile', { text: d.profile || 'LD' }));

    show(d.tabs[0]);
    return el('div.hiw-body.hiw-cr', null, toolbar, page);
  }

  function doc(blocks = []) {
    const art = el('article.hiw-doc');
    for (const b of blocks) {
      if (b.type === 'kicker') art.append(el('div.kicker', { text: b.text }));
      else if (b.type === 'h1') art.append(el('h1', { text: b.text }));
      else if (b.type === 'h2') art.append(el('h2', { text: b.text }));
      else if (b.type === 'p') art.append(inline(el('p'), b.text, 'mark'));
      else if (b.type === 'aside') art.append(el('p.side', { text: b.text }));
      else if (b.type === 'list') art.append(el('ul', null, b.items.map((i) => el('li', { text: i }))));
      else if (b.type === 'table') {
        art.append(el('table.hiw-tbl', null,
          el('thead', null, el('tr', null, b.head.map((h) => el('th', { text: h })))),
          el('tbody', null, b.rows.map((r) => el('tr', null, r.map((c) => el('td', { text: c })))))));
      }
    }
    return art;
  }

  /* An Azure DevOps sprint board: capacity at the top, cards carrying
     the things you actually triage on — who, points, tag, and whether
     it is blocked and on what. */
  function board(tab) {
    const sp = tab.sprint;
    return el('div.hiw-ado', null,
      sp && el('div.hiw-ado-head', null,
        el('b', { text: sp.name }),
        el('span.hiw-ado-dates', { text: sp.dates }),
        el('div.hiw-ado-stats', null, sp.stats.map(([k, v]) =>
          el('span', null, el('b', { text: v }), k)))),
      el('div.hiw-board', null, tab.columns.map((col) =>
        el('div.hiw-col', null,
          el('h4', null, col.title, el('span.hiw-col-n', { text: String(col.tickets.length) })),
          col.tickets.map((t) => el('div.hiw-tk' + (t.tone ? '.' + t.tone : ''), null,
            el('div.hiw-tk-top', null,
              el('span.id', { text: t.id }),
              t.pts ? el('span.hiw-tk-pts', { text: String(t.pts) }) : null),
            el('div.hiw-tk-title', { text: t.title }),
            el('div.hiw-tk-foot', null,
              t.tag ? el('span.hiw-tk-tag', { text: t.tag }) : null,
              t.who ? el('span.hiw-tk-who', { text: t.who }) : null),
            t.blocked ? el('div.hiw-tk-blocked', null,
              el('span', { html: ICONS.warn }), t.blocked) : null))))));
  }

  /* One work item, opened. The discussion is the part worth reading —
     it is where the prioritisation call actually gets made. */
  function workItem(it) {
    return el('div.hiw-wi', null,
      el('div.hiw-wi-head', null,
        el('span.hiw-wi-kind.' + it.kind.toLowerCase(), { text: it.kind }),
        el('span.hiw-wi-id', { text: it.id }),
        el('span.hiw-wi-state', { text: it.state })),
      el('h1', { text: it.title }),
      el('dl.hiw-wi-fields', null, it.fields.map(([k, v]) =>
        el('div', null, el('dt', { text: k }), el('dd', { text: v })))),
      el('h2', { text: 'Repro steps' }),
      el('ol.hiw-wi-list', null, it.repro.map((r) => el('li', { text: r }))),
      el('h2', { text: 'Acceptance criteria' }),
      el('ul.hiw-wi-list', null, it.criteria.map((c) => el('li', { text: c }))),
      el('h2', { text: 'Discussion' }),
      el('div.hiw-wi-disc', null, it.discussion.map((c) =>
        el('div.hiw-wi-c' + (c.mine ? '.mine' : ''), null,
          el('span.hiw-tm-av', { style: { background: c.color }, text: c.initials }),
          el('div', null,
            el('div.hiw-tm-meta', null, el('b', { text: c.who }), el('span', { text: c.when })),
            el('p', { text: c.text }))))));
  }

  /* ---------- Notes ----------------------------------------------
     macOS Notes: a vibrant sidebar, a list showing title, date and
     snippet, and a body held to a readable measure. Selection is a
     soft inset pill, not a saturated slab. */
  function notesApp(d) {
    const inner = el('div.hiw-nt-inner');
    const body = el('div.hiw-nt-body.hiw-scroll', null, inner);
    const list = el('div.hiw-nt-list.hiw-scroll');
    const buttons = new Map();

    const show = (note) => {
      for (const [id, b] of buttons) b.classList.toggle('on', id === note.id);
      body.scrollTop = 0;
      const kids = [el('h3', { text: note.title }), el('div.hiw-nt-date', { text: note.date })];
      for (const b of note.blocks) {
        if (b.type === 'check') {
          const box = el('i');
          if (b.done) box.innerHTML = ICONS.tick;
          kids.push(el('div.hiw-chk' + (b.done ? '.done' : ''), null, box, el('span', { text: b.text })));
        } else kids.push(inline(el('p'), b.text, 'b'));
      }
      inner.replaceChildren(...kids);
    };

    for (const note of d.notes) {
      /* the list row shows the day, the way Notes does — the full
         timestamp belongs on the note itself */
      const day = String(note.date).split(' at ')[0];
      const b = el('button.hiw-nt-item', { type: 'button', onclick: () => show(note) },
        el('h5', { text: note.title }),
        el('p', null, el('span.when', { text: day }), note.preview));
      buttons.set(note.id, b);
      list.append(b);
    }
    show(d.notes[0]);
    listKeys(list, '.hiw-nt-item');

    return el('div.hiw-body.hiw-nt', null,
      el('div.hiw-nt-side', null, d.folders.map((g) =>
        el('div', null, el('div.grp', { text: g.title }),
          g.items.map((f) => el('div.hiw-nt-f' + (f.active ? '.on' : ''), null,
            el('span', { html: ICONS.folder }), f.name))))),
      list, body);
  }

  /* ---------- Microsoft Teams -------------------------------------
     Where the questions actually get answered: a Belgrade contractor
     team an hour ahead, a design handoff channel, and the 1:1 where
     capacity and contracts get sorted out. */
  function teamsApp(d) {
    const thread = el('div.hiw-tm-thread.hiw-scroll');
    const head = el('div.hiw-tm-head');
    const compose = el('div.hiw-tm-compose', null, el('span', { text: 'Type a message' }));
    const rows = new Map();
    const railRows = new Map();

    /* Channels and chats render a conversation; the rail switches to a
       different kind of pane entirely, the way the real rail does. */
    const showConversation = (id) => {
      const c = d.conversations[id];
      if (!c) return;
      for (const [cid, r] of rows) r.classList.toggle('on', cid === id);
      setRail('teams');
      side.hidden = false;
      compose.hidden = false;
      thread.scrollTop = 0;
      head.replaceChildren(el('b', { text: c.title }), el('span.hiw-tm-sub', { text: c.sub }));
      thread.replaceChildren(...c.messages.map((m) =>
        el('div.hiw-tm-msg' + (m.mine ? '.mine' : ''), null,
          el('span.hiw-tm-av', { style: { background: m.color }, text: m.initials }),
          el('div.hiw-tm-bubble', null,
            el('div.hiw-tm-meta', null, el('b', { text: m.who }), el('span', { text: m.when })),
            m.body.map((t) => el('p', { text: t })),
            m.reactions && el('div.hiw-tm-react', null,
              m.reactions.map((r) => el('span', { text: r })))))));
    };

    const showView = (key) => {
      const v = (d.views || {})[key];
      if (!v) return;
      setRail(key);
      for (const r of rows.values()) r.classList.remove('on');
      side.hidden = true;
      compose.hidden = true;
      thread.scrollTop = 0;
      head.replaceChildren(el('b', { text: v.title }), el('span.hiw-tm-sub', { text: v.sub }));

      if (key === 'calendar') {
        thread.replaceChildren(weekGrid(v));
      } else if (key === 'files') {
        thread.replaceChildren(el('div.hiw-tm-files', null, v.items.map(([name, where, when]) =>
          el('div.hiw-tm-file', null,
            el('span.hiw-tm-fico', { html: ICONS.files }),
            el('div', null, el('b', { text: name }), el('span', { text: where })),
            el('span.hiw-tm-when', { text: when })))));
      } else {
        thread.replaceChildren(el('div.hiw-tm-acts', null,
          v.items.map(([initials, color, who, what, when]) =>
            el('div.hiw-tm-act', null,
              el('span.hiw-tm-av', { style: { background: color }, text: initials }),
              el('div', null, el('b', { text: who }), el('span', { text: what })),
              el('span.hiw-tm-when', { text: when })))));
      }
    };

    /* A week grid rather than a list: the shape is the point — a standup
       three mornings a week, refinement once, and a focus block someone
       actually defended. */
    function weekGrid(v) {
      const hours = [];
      for (let h = v.from; h <= v.to; h++) hours.push(h);
      const rowH = 46;
      const mins = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
      const top = (t) => ((mins(t) - v.from * 60) / 60) * rowH;

      const columns = v.days.map((_, d) => {
        const evs = v.events.filter((e) => e.day === d).map((e) =>
          el('div.hiw-cal-ev.' + (e.tone || 'blue'), {
            style: {
              top: top(e.at) + 'px',
              height: Math.max(20, (e.mins / 60) * rowH - 3) + 'px',
            },
          },
            el('b', { text: e.title }),
            e.mins >= 40 ? el('span', { text: e.at + ' · ' + e.who }) : null));
        return el('div.hiw-cal-col', null, evs);
      });

      const lines = hours.slice(0, -1).map((_, i) =>
        el('span.hiw-cal-line', { style: { top: i * rowH + 'px' } }));

      const grid = el('div.hiw-cal-grid',
        { style: { height: (hours.length - 1) * rowH + 'px' } }, lines, columns);

      return el('div.hiw-cal', null,
        el('div.hiw-cal-head', null,
          el('b', { text: v.week }),
          el('div.hiw-cal-days', null, v.days.map((d) => el('span', { text: d })))),
        el('div.hiw-cal-body', null,
          el('div.hiw-cal-hours', null, hours.map((h) =>
            el('span', { style: { height: rowH + 'px' }, text: String(h).padStart(2, '0') + ':00' }))),
          grid));
    }

    function setRail(key) {
      for (const [k, r] of railRows) r.classList.toggle('on', k === key);
    }

    const side = el('div.hiw-tm-side', null,
      el('div.hiw-tm-org', { text: d.org }),
      d.channels.map((g) => el('div', null,
        el('div.grp', { text: g.group }),
        g.items.map((it) => {
          const row = el('button.hiw-tm-ch', { type: 'button' },
            el('span.hiw-tm-hash', { text: g.group === 'Chat' ? '' : '#' }),
            el('span.hiw-tm-name', { text: it.name }),
            it.unread ? el('span.hiw-tm-badge', { text: String(it.unread) }) : null);
          rows.set(it.id, row);
          row.addEventListener('click', () => showConversation(it.id));
          return row;
        }))));

    const rail = el('div.hiw-tm-rail', null,
      [['activity', 'Activity', ICONS.bell], ['chat', 'Chat', ICONS.bubble],
        ['teams', 'Teams', ICONS.people], ['calendar', 'Calendar', ICONS.cal],
        ['files', 'Files', ICONS.files]].map(([key, label, ic]) => {
        const b = el('button.hiw-tm-rail-i', { type: 'button' },
          el('span.hiw-tm-ico', { html: ic }), el('span', { text: label }));
        railRows.set(key, b);
        b.addEventListener('click', () => {
          if (key === 'teams') showConversation('dev');
          else if (key === 'chat') showConversation('milos');
          else showView(key);
        });
        return b;
      }));

    showConversation('dev');
    listKeys(side, '.hiw-tm-ch');

    return el('div.hiw-body.hiw-tm', null, rail, side,
      el('div.hiw-tm-main', null, head, thread, compose));
  }

  /* ---------- the app registry -------------------------------------
     Everything above is a built-in. Anything else registers itself by
     loading a script that calls HowIWork.register(), which is how the
     toy apps and any future case study's apps get in without this file
     having to know about them. */
  const APPS = { figma: figmaApp, code: terminalApp, notes: notesApp, teams: teamsApp, chrome: chromeApp };

  /* ============================================================
     registry + the UI kit handed to plugins
     ============================================================ */
  const REGISTRY = Object.create(null);
  const STYLES = new Set();

  /* The surface a plugin app is built against. Kept deliberately small:
     a DOM builder, the icon set, the inline-markup helper, and a way to
     add scoped CSS once. */
  const UI = {
    el, svg, inline, clamp, ICONS,
    /* add a plugin's stylesheet once, however many times it registers */
    style(id, css) {
      if (STYLES.has(id)) return;
      STYLES.add(id);
      document.head.append(el('style', { 'data-hiw-style': id, text: css }));
    },
  };

  /* ============================================================
     the desktop
     ============================================================ */
  let live = null;

  function open(config, trigger) {
    if (live) return;

    const mobile = isMobile();
    const root = el('div.hiw', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': config.dialogLabel || 'How I work',
    });
    const wall = el('div.hiw-wall');
    const surface = el('div.hiw-desktop');

    /* --- menu bar --- */
    const mbApp = el('span.hiw-mb-app', { text: 'Finder' });
    const mbMenus = el('div.hiw-mb-menus');
    const mbClock = el('button.hiw-mb-clock.hiw-mb-item', { type: 'button' });
    const appleBtn = el('button.hiw-apple.hiw-mb-item', { type: 'button', 'aria-label': 'Apple menu', html: ICONS.apple });
    const statusBtn = (icon, label, items) => {
      const b = el('button.hiw-mb-item.hiw-mb-status', { type: 'button', 'aria-label': label, html: icon });
      b.addEventListener('click', () => (b.classList.contains('mb-open') ? closeMenu() : showMenu(b, items())));
      return b;
    };
    const menubar = el('div.hiw-menubar', null, appleBtn, mbApp, mbMenus,
      el('div.hiw-mb-right', null,
        statusBtn(ICONS.battery, 'Battery', () => [
          { label: 'Battery: 68%' }, { label: '3:12 remaining' }, { sep: true },
          { label: 'Using Significant Energy' }, { label: '   Google Chrome' }, { label: '   Figma' }]),
        statusBtn(ICONS.wifi, 'Wi-Fi', () => [
          { label: 'Wi-Fi: On' }, { sep: true },
          { label: '✓ HOWDEN-CORP' }, { label: '   HOWDEN-GUEST' }, { label: '   BT-9F2K1C' }]),
        statusBtn(ICONS.search, 'Spotlight', () => [
          { label: 'Spotlight Search' }, { sep: true },
          { label: 'Nothing indexed — it is a mock' }]),
        statusBtn(ICONS.control, 'Control Centre', () => [
          { label: 'Do Not Disturb' }, { label: 'Stage Manager' }, { sep: true },
          { label: 'Appearance: System', run: () => showWin('settings') }]),
        mbClock));
    appleBtn.addEventListener('click', () =>
      (appleBtn.classList.contains('mb-open') ? closeMenu() : showMenu(appleBtn, APPLE_MENU())));
    mbClock.addEventListener('click', () => showMenu(mbClock, [
      { label: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) },
      { sep: true }, { label: 'No events — it is a mock' }]));

    const FINDER_MENUS = ['File', 'Edit', 'View', 'Go', 'Window', 'Help'];

    /* ---------- menu bar menus --------------------------------------
       One dropdown at a time, anchored under whatever opened it.
       Hovering a sibling while one is open switches to it, which is the
       behaviour that makes a menu bar feel like a menu bar. */
    let openMenuEl = null;
    /* Which title the hover-switch just opened. Without this, moving the
       pointer onto a title opens its menu and the click that follows sees
       it already open and closes it again. */
    let hoverOpened = null;
    function closeMenu() {
      if (!openMenuEl) return;
      openMenuEl.remove();
      openMenuEl = null;
      hoverOpened = null;
      for (const n of menubar.querySelectorAll('.mb-open')) n.classList.remove('mb-open');
    }
    function showMenu(anchor, items) {
      closeMenu();
      anchor.classList.add('mb-open');
      const rect = anchor.getBoundingClientRect();
      const menu = el('div.hiw-menu', { style: { left: Math.round(rect.left) + 'px' } },
        items.map((it) => (it.sep
          ? el('span.hiw-menu-sep')
          : el(it.run ? 'button.hiw-menu-i' : 'span.hiw-menu-i.off',
              it.run ? { type: 'button', onclick: () => { closeMenu(); it.run(); } } : null,
              el('span', { text: it.label }),
              it.key ? el('span.hiw-menu-k', { text: it.key }) : null))));
      root.append(menu);
      openMenuEl = menu;
    }
    /* a click anywhere else dismisses, exactly once per open */
    root.addEventListener('pointerdown', (e) => {
      if (openMenuEl && !e.target.closest('.hiw-menu') && !e.target.closest('.hiw-mb-item')) closeMenu();
    }, true);

    /* Menus are mostly inert, as they are in a screenshot of a desktop.
       The ones that do something, do it. */
    const appMenuItems = (label) => {
      const generic = {
        File: [{ label: 'New Window', key: '⌘N' }, { label: 'Open…', key: '⌘O' }, { sep: true },
          { label: 'Close Window', key: '⌘W', run: () => { const id = focusedId(); if (id) hideWin(id); } },
          { label: 'Print…', key: '⌘P' }],
        Edit: [{ label: 'Undo', key: '⌘Z' }, { label: 'Redo', key: '⇧⌘Z' }, { sep: true },
          { label: 'Cut', key: '⌘X' }, { label: 'Copy', key: '⌘C' }, { label: 'Paste', key: '⌘V' }],
        Window: [
          { label: 'Minimise', key: '⌘M', run: () => { const id = focusedId(); if (id) minimise(id); } },
          { label: 'Zoom', run: () => { const id = focusedId(); if (id) toggleZoom(id); } },
          { sep: true },
          { label: 'Bring All to Front', run: () => { for (const a of config.apps) showWin(a.id); } }],
        Help: [{ label: 'This is a mock' }, { sep: true },
          { label: 'Back to the case study', run: () => close() }],
      };
      return generic[label] || [
        { label: `${label} options` }, { sep: true },
        { label: 'Nothing here — it is a mock' },
      ];
    };

    const APPLE_MENU = () => [
      { label: 'About This Mac', run: () => showWin('about') },
      { sep: true },
      { label: 'System Settings…', run: () => showWin('settings') },
      { label: 'App Store…' },
      { sep: true },
      { label: 'Sleep', run: () => nap() },
      { label: 'Restart…', run: () => close() },
      { label: 'Shut Down…', run: () => close() },
      { sep: true },
      { label: 'Log Out Luka…', key: '⇧⌘Q', run: () => close() },
    ];

    /* Sleep is the only Apple-menu item with nowhere sensible to go, so
       it does the one thing a mock can honestly do: goes dark, briefly. */
    let napWake = null;
    function nap() {
      const veil = el('div.hiw-sleep');
      root.append(veil);
      /* the keyboard route goes through onKey rather than a second
         window listener, so there is one thing to release on close */
      napWake = () => { napWake = null; veil.remove(); };
      veil.addEventListener('click', () => napWake && napWake());
      timers.push(setTimeout(() => napWake && napWake(), 4000));
    }

    let menuSig = null;
    const setMenus = (items) => {
      const sig = items.join('\u0000');
      if (sig === menuSig) return;
      menuSig = sig;
      /* the titles are about to be replaced, so anything hanging off one
         of them has to go with them */
      closeMenu();
      mbMenus.replaceChildren(...items.map((m) => {
        const b = el('button.hiw-mb-item', { type: 'button', text: m });
        b.addEventListener('click', () => {
          if (hoverOpened === b) { hoverOpened = null; return; }
          if (b.classList.contains('mb-open')) closeMenu();
          else showMenu(b, appMenuItems(m));
        });
        b.addEventListener('pointerenter', () => {
          if (!openMenuEl || b.classList.contains('mb-open')) return;
          showMenu(b, appMenuItems(m));
          hoverOpened = b;
        });
        return b;
      }));
    };

    const tick = () => {
      const d = new Date();
      const day = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      mbClock.textContent = `${day} ${date}  ${time}`;
    };
    tick();
    const clockTimer = setInterval(tick, 20000);

    /* --- windows --- */
    const wins = new Map();
    const dockItems = new Map();
    const notifStack = el('div.hiw-notifs');
    let stack = [];
    let booting = true;
    const timers = [];

    const focusedId = () => stack[stack.length - 1] || null;

    function restack() {
      stack.forEach((id, i) => { wins.get(id).node.style.zIndex = String(20 + i); });
      const top = focusedId();
      for (const [id, w] of wins) {
        const on = id === top;
        w.node.classList.toggle('focused', on);
        if (mobile) w.node.classList.toggle('mobile-active', on);
      }
      const app = top ? wins.get(top).app : null;
      mbApp.textContent = app ? (app.name || (REGISTRY[app.id] && REGISTRY[app.id].name) || app.id) : 'Finder';
      setMenus(app && app.menus ? app.menus : FINDER_MENUS);
      for (const [id, item] of dockItems) item.classList.toggle('running', stack.includes(id));
    }

    function focus(id) {
      if (focusedId() === id) return;
      stack = stack.filter((x) => x !== id).concat(id);
      restack();
    }

    /* A window caught mid-minimise or mid-close is still on screen and
       still animating. Whatever brings it back has to cancel that first,
       or it reappears at 16% and stays there. */
    function settleWin(w) {
      if (w.minTimer) { clearTimeout(w.minTimer); w.minTimer = 0; }
      if (w.closeTimer) { clearTimeout(w.closeTimer); w.closeTimer = 0; }
      w.node.classList.remove('minimising', 'closing');
    }

    /* Where the window has to fly to. The stylesheet does the flying; it
       cannot read the dock's geometry, so hand it the offset from the
       window's centre to the app's dock icon. */
    function aimAtDock(id, node) {
      const item = dockItems.get(id);
      const icon = item && item.querySelector('.hiw-dock-icon');
      /* an app with no dock item has nowhere to fly to, so it shrinks in
         place rather than towards a stale offset from last time */
      if (!icon) { node.style.setProperty('--min-x', '0px'); return; }
      const ir = icon.getBoundingClientRect();
      const wr = node.getBoundingClientRect();
      node.style.setProperty('--min-x',
        Math.round(ir.left + ir.width / 2 - (wr.left + wr.width / 2)) + 'px');
    }

    function showWin(id) {
      const w = wins.get(id);
      if (!w) return;
      settleWin(w);
      if (!stack.includes(id)) {
        w.node.hidden = false;
        stack.push(id);
        if (!reduced()) {
          w.node.classList.add('opening');
          timers.push(setTimeout(() => w.node.classList.remove('opening'), 280));
        }
        bounce(id);
        if (w.onFirstShow) { w.onFirstShow(); w.onFirstShow = null; }
        /* the push already made it the top of the stack, so focus()
           would early-return and never restack — do it here */
        restack();
        return;
      }
      focus(id);
    }

    function hideWin(id) {
      const w = wins.get(id);
      if (!w) return;
      /* a second ⌘W while it is already on its way out must let the
         animation finish, not cancel the timer and strand it on screen */
      if (!stack.includes(id)) return;
      settleWin(w);
      /* out of the stack first, so the window behind takes the menu bar
         on the click rather than when the animation ends */
      stack = stack.filter((x) => x !== id);
      restack();
      if (reduced()) { w.node.hidden = true; return; }
      w.node.classList.add('closing');
      w.closeTimer = setTimeout(() => {
        w.closeTimer = 0;
        w.node.hidden = true;
        w.node.classList.remove('closing');
      }, 200);
      timers.push(w.closeTimer);
    }

    function minimise(id) {
      const w = wins.get(id);
      if (!w || !stack.includes(id)) return;
      if (reduced()) return hideWin(id);
      if (w.minTimer) return;
      /* Drop it out of the stack now rather than when the animation ends.
         The window behind takes the menu bar the moment you click, which
         is what makes minimising feel instant even though the genie takes
         a third of a second. */
      stack = stack.filter((x) => x !== id);
      restack();
      aimAtDock(id, w.node);
      w.node.classList.add('minimising');
      w.minTimer = setTimeout(() => {
        w.minTimer = 0;
        w.node.hidden = true;
        w.node.classList.remove('minimising');
      }, 300);
      timers.push(w.minTimer);
    }

    /* A zoomed window has no resize edges, the way macOS gives a zoomed
       window none. It also fixes the thing that made zoom a trap: the n
       and nw/ne strips sit on the first five pixels of the title bar, and
       on a zoomed window that strip is flush under the menu bar — exactly
       where you aim to double-click it back down. */
    function setHandles(w, on) {
      for (const h of w.handles) h.hidden = !on;
    }

    function unzoom(w) {
      if (!w.maxed) return;
      Object.assign(w.node.style, w.restore);
      w.maxed = false;
      w.node.classList.remove('maxed');
      setHandles(w, true);
    }

    function toggleZoom(id) {
      if (mobile) return;
      const w = wins.get(id);
      if (!w) return;
      const node = w.node;
      node.classList.add('zooming');
      timers.push(setTimeout(() => node.classList.remove('zooming'), 260));
      if (w.maxed) unzoom(w);
      else {
        w.restore = { left: node.style.left, top: node.style.top, width: node.style.width, height: node.style.height };
        Object.assign(node.style, {
          left: '0px', top: '0px',
          width: surface.clientWidth + 'px',
          height: surface.clientHeight + 'px',
        });
        w.maxed = true;
        node.classList.add('maxed');
        setHandles(w, false);
      }
      focus(id);
    }

    /* --- drag and resize -----------------------------------------
       Both write left/top/width/height straight to the element. There
       is no state to reconcile and no re-render, so a drag is one
       style write per pointer event. */
    function grab(node, e, onMove) {
      if (mobile || e.button !== 0) return;
      const target = e.currentTarget;
      try { target.setPointerCapture(e.pointerId); } catch {}
      /* ten backdrop-filters re-rasterising per frame is the one thing
         here that would actually cost frames. Switch them off for the
         duration of the gesture. */
      root.classList.add('moving');
      /* a gesture that starts while the zoom transition is still running
         would lerp the window away from the pointer */
      node.classList.remove('zooming');
      node.classList.add('dragging');
      const move = (ev) => onMove(ev);
      const up = () => {
        root.classList.remove('moving');
        node.classList.remove('dragging');
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
      target.addEventListener('pointercancel', up);
    }

    function startDrag(w, e) {
      const node = w.node;
      /* Pull a zoomed window and it un-zooms and comes with you, held
         where you grabbed it. Otherwise the title bar of a zoomed window
         is a dead strip across the whole screen with no way off it. */
      if (w.maxed) {
        const r = node.getBoundingClientRect();
        const grip = r.width ? (e.clientX - r.left) / r.width : 0.5;
        const inTitle = e.clientY - r.top;
        unzoom(w);
        const s = surface.getBoundingClientRect();
        node.style.left = Math.round(e.clientX - s.left - node.offsetWidth * grip) + 'px';
        node.style.top = Math.round(e.clientY - s.top - inTitle) + 'px';
      }
      const sx = e.clientX, sy = e.clientY;
      const ox = parseFloat(node.style.left) || 0;
      const oy = parseFloat(node.style.top) || 0;
      const bw = surface.clientWidth, bh = surface.clientHeight;
      const ww = node.offsetWidth;
      grab(node, e, (ev) => {
        /* keep a grabbable strip of title bar on screen, exactly as
           macOS does — you can push a window off to the side but never
           lose it entirely, and never above the menu bar */
        node.style.left = clamp(ox + ev.clientX - sx, -ww + 90, bw - 70) + 'px';
        node.style.top = clamp(oy + ev.clientY - sy, 0, bh - 34) + 'px';
      });
    }

    function startResize(w, e, dir) {
      const node = w.node;
      if (mobile || w.maxed) return;
      const sx = e.clientX, sy = e.clientY;
      const x0 = parseFloat(node.style.left) || 0;
      const y0 = parseFloat(node.style.top) || 0;
      const w0 = node.offsetWidth, h0 = node.offsetHeight;
      const bw = surface.clientWidth, bh = surface.clientHeight;
      grab(node, e, (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        let x = x0, y = y0, ww = w0, hh = h0;
        if (dir.includes('e')) ww = clamp(w0 + dx, MIN_W, bw - x0);
        if (dir.includes('s')) hh = clamp(h0 + dy, MIN_H, bh - y0);
        if (dir.includes('w')) {
          ww = clamp(w0 - dx, MIN_W, x0 + w0);
          x = x0 + w0 - ww;
        }
        if (dir.includes('n')) {
          hh = clamp(h0 - dy, MIN_H, y0 + h0);
          y = y0 + h0 - hh;
        }
        node.style.left = x + 'px';
        node.style.top = y + 'px';
        node.style.width = ww + 'px';
        node.style.height = hh + 'px';
      });
    }

    /* Built-ins read their slice of the config; a registered app is
       handed the whole config plus its own entry, because a toy app
       usually has no data of its own. */
    function renderApp(app, w) {
      /* a registered plugin wins over a built-in, so an app can be
         replaced without editing this file */
      const plug = REGISTRY[app.id];
      if (plug) return plug.render(config[app.id] || {}, w, UI);
      if (APPS[app.id]) return APPS[app.id](config[app.id], w);
      return el('div.hiw-body', null, el('div.hiw-missing', {
        text: `No renderer registered for "${app.id}".`,
      }));
    }

    /* --- build one window --- */
    for (const app of config.apps) {
      const node = el('section.hiw-win', { hidden: true, 'aria-label': app.title });
      const title = el('div.hiw-title', { text: app.title });
      const w = { node, app, maxed: false, restore: null, timers, setTitle: null,
        onFirstShow: null, onClose: null, tabHost: null,
        handles: [], minTimer: 0, closeTimer: 0 };
      w.setTitle = (t) => {
        title.textContent = t;
        node.setAttribute('aria-label', t);
        if (focusedId() === app.id) restack();
      };

      const lights = el('div.hiw-lights', null,
        el('button.hiw-light.hiw-l-close', { type: 'button', 'aria-label': 'Close ' + app.name, html: ICONS.close,
          onclick: (e) => { e.stopPropagation(); hideWin(app.id); } }),
        el('button.hiw-light.hiw-l-min', { type: 'button', 'aria-label': 'Minimise ' + app.name, html: ICONS.min,
          onclick: (e) => { e.stopPropagation(); minimise(app.id); } }),
        el('button.hiw-light.hiw-l-zoom', { type: 'button', 'aria-label': 'Zoom ' + app.name, html: ICONS.zoom,
          onclick: (e) => { e.stopPropagation(); toggleZoom(app.id); } }));
      /* the lights sit inside the drag handle; without this the handle
         captures the pointer and swallows their click */
      lights.addEventListener('pointerdown', (e) => e.stopPropagation());

      /* Chrome draws its tabs in the title bar. Any app can claim the
         slot; if it does, the centred window title steps aside. */
      const tabHost = el('div.hiw-tb-slot');
      w.tabHost = tabHost;
      const tb = el('header.hiw-tb', null, lights, tabHost, title);
      if (app.chromeTabs) tb.classList.add('has-tabs');
      tb.addEventListener('pointerdown', (e) => startDrag(w, e));
      /* the tab strip and the traffic lights live inside the drag handle;
         a double click on either is aimed at them, not at the window */
      tb.addEventListener('dblclick', (e) => {
        if (e.target.closest('.hiw-tb-slot,.hiw-lights')) return;
        toggleZoom(app.id);
      });

      node.append(tb, renderApp(app, w));
      for (const dir of ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']) {
        const h = el('span.hiw-rz.hiw-rz-' + dir);
        h.addEventListener('pointerdown', (e) => { e.stopPropagation(); startResize(w, e, dir); });
        w.handles.push(h);
        node.append(h);
      }
      /* Capture, because half the surfaces inside a window stop pointerdown
         from bubbling so their own click survives — a Chrome tab, a Figma
         frame, the traffic lights. Clicking any of them on a window that is
         behind has to raise it first, the way every click on a macOS window
         does. */
      node.addEventListener('pointerdown', (e) => {
        /* except the traffic lights, which act on a background window
           without bringing it forward — as they do in macOS */
        if (e.target.closest('.hiw-lights')) return;
        focus(app.id);
      }, true);

      wins.set(app.id, w);
      surface.append(node);
    }

    /* --- dock --- */
    const dock = el('nav.hiw-dock', { 'aria-label': 'Dock' });
    const icons = [];
    /* the item is the icon's untransformed slot — magnification moves the
       icon, never the slot, so this is what the geometry is read from */
    const slots = [];

    function dockIcon(key, name, onClick, opts = {}) {
      /* A missing DOCK entry must cost a grey tile, not the desktop — a
         plugin that fails to load never registered its glyph. */
      const [bg, glyph] = DOCK[key] || ['#3a3a3f', ''];
      const icon = el('span.hiw-dock-icon', {
        style: { background: key === 'notes' ? NOTES_PAPER : bg },
        html: glyph,
      });
      const kids = [el('span.hiw-tip', { text: opts.tip || name }), icon,
        el('span.hiw-dock-label', { text: opts.short || name }), el('span.hiw-dot')];
      const item = el('button.hiw-dock-item', { type: 'button', onclick: onClick, 'aria-label': opts.tip || name }, kids);
      icons.push(icon);
      slots.push(item);
      dock.append(item);
      return item;
    }

    /* macOS bounces the dock icon when an app is asked for. The keyframes
       live in the stylesheet; this only says when, and takes the class off
       again so a second launch bounces too. */
    function bounce(id) {
      if (reduced() || booting) return;
      const item = dockItems.get(id);
      const icon = item && item.querySelector('.hiw-dock-icon');
      if (!icon) return;
      const done = () => {
        icon.classList.remove('bounce');
        icon.removeEventListener('animationend', done);
      };
      void icon.offsetWidth;   /* restart the animation rather than ignore it */
      icon.classList.add('bounce');
      icon.addEventListener('animationend', done);
      /* belt and braces: if the keyframes are missing, animationend never
         comes and the class would sit there forever */
      timers.push(setTimeout(done, 700));
    }

    for (const app of config.apps) {
      /* `dock: false` builds the window but no dock item. System Settings
         and About This Mac are reached from the Apple menu, which is where
         macOS keeps them too — everything keyed on dockItems is a Map get
         or a Map walk, so an app that is not in it is simply skipped. */
      if (app.dock === false) continue;
      dockItems.set(app.id, dockIcon(app.id, app.name, () => {
        if (!mobile && focusedId() === app.id && stack.includes(app.id)) minimise(app.id);
        else showWin(app.id);
      }, { short: app.short }));
    }
    dock.append(el('span.hiw-dock-sep'));
    dockIcon('back', 'Back', () => close(), { tip: 'Back to the case study' });

    /* ---------- dock magnification ---------------------------------
       Still one rAF loop writing one transform per icon — no layout per
       frame, no paint, compositor only — but three things the old linear
       ramp got wrong.

       It died out inside one icon width, so the icon under the pointer
       popped on its own instead of a swell spreading either side of it.

       It scaled every icon in place, so the big one grew straight over
       its neighbours. Here they give way.

       And it assigned its values, so the dock snapped to the pointer like
       a readout. Here each icon closes a fraction of the gap to its
       target per frame, which reads as weight; the loop runs on only
       while something is still moving, including after the pointer has
       left, so the dock relaxes out rather than dropping. */
    const MAG_R = 200;      /* how far the pointer reaches, in px */
    const MAG_LIFT = 0.34;  /* how much bigger the icon under it gets */
    const MAG_PUSH = 12;    /* how far its neighbours give way, at the widest */
    const EASE = 0.3;       /* fraction of the remaining gap closed per frame */
    let dockRaf = 0, dockX = -1;
    let centres = null, edgeL = 0, edgeR = 0, half0 = 27;
    const curS = icons.map(() => 0);
    const curX = icons.map(() => 0);

    /* Read off the slots, which never transform, so this stays correct
       whenever it is called — including mid-relaxation. */
    const measure = () => {
      centres = slots.map((n) => { const r = n.getBoundingClientRect(); return r.left + r.width / 2; });
      const d = dock.getBoundingClientRect();
      half0 = (slots[0] ? slots[0].offsetWidth : 54) / 2;
      /* the pill's padding box is the wall the icons cannot cross, read
         off the stylesheet rather than assumed */
      const cs = getComputedStyle(dock);
      edgeL = d.left + (parseFloat(cs.paddingLeft) || 0);
      edgeR = d.right - (parseFloat(cs.paddingRight) || 0);
    };

    /* The swell is a cos² bell so it spreads over three icons a side and
       meets the untouched ones with no seam.

       The push is a flattened sine: it rises fast, holds while the
       neighbours are at their biggest, and comes back to nothing at the
       edge of the pointer's reach. It has to come back, because unlike a
       real dock this one is a fixed-width pill — whatever goes out at one
       end has to be found again before the edge, or the icons pile up
       against the wall instead of spreading.

       That fixed box is also what sets MAG_LIFT. There are 7px between
       54px icons, so every 0.01 of scale costs 0.27px of gap on each
       side of every magnified icon, and past about 1.35 there is nowhere
       left for the neighbours to go. macOS magnifies twice that because
       its dock grows wider as you hover it; ours cannot. */
    const bellAt = (u) => Math.cos(u * Math.PI / 2) ** 2;
    const pushAt = (u) => Math.sin(Math.PI * u) ** 0.6;

    const wantS = icons.map(() => 0);
    const wantX = icons.map(() => 0);

    const magnify = () => {
      dockRaf = 0;
      if (!centres) measure();
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < icons.length; i++) {
        /* out of reach when the pointer has left, which zeroes the bell
           and lets everything relax back along the same path */
        const d = dockX < 0 ? MAG_R : centres[i] - dockX;
        const u = Math.min(1, Math.abs(d) / MAG_R);
        wantS[i] = MAG_LIFT * bellAt(u);
        wantX[i] = (d < 0 ? -1 : 1) * MAG_PUSH * pushAt(u);
        const half = half0 * (1 + wantS[i]);
        lo = Math.min(lo, centres[i] + wantX[i] - half);
        hi = Math.max(hi, centres[i] + wantX[i] + half);
      }
      /* Slide the whole set to fit rather than stopping icons at the wall
         one at a time: an icon pinned on its own gets walked into by the
         one behind it, which is the overlap the push exists to prevent.
         Sliding keeps every gap intact, so at the ends the swell grows
         inwards — which is what macOS does there too. */
      const overL = lo < edgeL ? edgeL - lo : 0;
      const overR = hi > edgeR ? hi - edgeR : 0;
      /* if it will not fit either way — a magnified dock is wider than a
         pill sized for the resting one — share the excess between the two
         ends rather than dumping it on one */
      const fit = overL && overR ? (overL - overR) / 2 : overL - overR;

      let moving = false;
      for (let i = 0; i < icons.length; i++) {
        const tx = wantX[i] + fit;
        const ds = wantS[i] - curS[i], dx = tx - curX[i];
        if (Math.abs(ds) < 0.002 && Math.abs(dx) < 0.05) {
          /* land on the target rather than stopping a sliver short of it:
             on a slow frame the approach would otherwise leave the dock
             permanently a couple of per cent magnified */
          curS[i] = wantS[i];
          curX[i] = tx;
        } else {
          moving = true;
          curS[i] += ds * EASE;
          curX[i] += dx * EASE;
        }
        icons[i].style.transform = (curS[i] > 0.002 || Math.abs(curX[i]) > 0.05)
          ? `translateX(${curX[i].toFixed(1)}px) scale(${(1 + curS[i]).toFixed(3)}) translateY(${(-curS[i] * 11).toFixed(1)}px)`
          : '';
      }
      if (moving) dockRaf = requestAnimationFrame(magnify);
    };
    const kick = () => { if (!dockRaf) dockRaf = requestAnimationFrame(magnify); };

    if (!mobile && !reduced()) {
      dock.addEventListener('pointerenter', () => { measure(); kick(); });
      dock.addEventListener('pointermove', (e) => { dockX = e.clientX; kick(); });
      dock.addEventListener('pointerleave', () => { dockX = -1; kick(); });
    }

    /* --- lay the windows out --- */
    function place(w) {
      if (mobile) return;
      const spec = w.app.window;
      const bw = surface.clientWidth, bh = surface.clientHeight;
      const width = clamp(Math.round(bw * spec.w), MIN_W, bw - 24);
      const height = clamp(Math.round(bh * spec.h), MIN_H, bh - 24);
      Object.assign(w.node.style, {
        width: width + 'px',
        height: height + 'px',
        left: clamp(Math.round(bw * spec.x), 8, Math.max(8, bw - width - 8)) + 'px',
        top: clamp(Math.round(bh * spec.y), 8, Math.max(8, bh - height - 8)) + 'px',
      });
    }

    root.append(wall, menubar, surface,
      el('p.hiw-hint', { text: config.hint }),
      el('div.hiw-dock-wrap', null, dock), notifStack);
    document.body.append(root);

    /* place after the surface has a size, then bring the windows up */
    for (const w of wins.values()) place(w);
    /* `boot: false` puts an app in the dock without opening it — the toy
       apps are there to be found, not to be in the way. */
    const bootApps = config.apps.filter((a) => a.boot !== false);

    if (mobile) {
      /* every booting app is mounted; the last entry in the stack is the
         one on screen, so the first app in the config is what opens */
      for (const app of bootApps) wins.get(app.id).node.hidden = false;
      stack = bootApps.map((a) => a.id).reverse();
      restack();
      const w = wins.get(focusedId());
      if (w && w.onFirstShow) { w.onFirstShow(); w.onFirstShow = null; }
      booting = false;
    } else if (reduced()) {
      for (const app of bootApps) showWin(app.id);
      booting = false;
    } else {
      /* Cascade back to front: the LAST window opened is the focused
         one, and the first app in the config is the one this desktop is
         really about, so it opens last and lands on top. */
      const order = bootApps.map((a) => a.id).reverse();
      /* 170ms a window read as a cascade but put Figma — the app this
         desktop is actually about, and therefore the last one up — on
         screen most of a second after the passphrase. At 80ms the six
         open animations still overlap into a cascade and the desktop is
         ready to use in half the time. */
      order.forEach((id, i) => timers.push(setTimeout(() => showWin(id), i * 80)));
      timers.push(setTimeout(() => { booting = false; }, order.length * 80));
      scheduleNotifications();
    }

    /* fade the wallpaper in once it has actually decoded */
    const img = new Image();
    img.onload = () => wall.classList.add('ready');
    img.src = new URL('wallpaper.jpg', BASE).href;
    if (img.complete) wall.classList.add('ready');

    /* --- notifications ----------------------------------------------
       The desktop is a moment in a working day, and in a working day
       things arrive. Banners are the cheapest way to say that, and
       clicking one takes you to the thing it is about. */
    function notify({ app, title, body, when, run }) {
      const card = el(run ? 'button.hiw-notif' : 'div.hiw-notif',
        run ? { type: 'button', onclick: () => { dismiss(); run(); } } : null,
        el('span.hiw-notif-icon', {
          style: { background: (DOCK[app] || [])[0] || '#3a3a3f' },
          html: (DOCK[app] || [])[1] || '',
        }),
        el('div.hiw-notif-text', null,
          el('div.hiw-notif-top', null,
            el('b', { text: title }),
            el('span', { text: when || 'now' })),
          el('p', { text: body })));
      const dismiss = () => {
        if (!card.isConnected) return;
        card.classList.add('out');
        timers.push(setTimeout(() => card.remove(), 260));
      };
      notifStack.append(card);
      timers.push(setTimeout(dismiss, 7000));
    }

    /* Held back until the cascade has finished, so they arrive into a
       settled desktop rather than competing with it. */
    function scheduleNotifications() {
      if (reduced()) return;
      const queue = [
        [5200, { app: 'teams', title: 'Miloš Petrović', when: 'Teams',
          body: 'Stefan says yes to the renewal. I will send the paperwork.',
          run: () => showWin('teams') }],
        [12000, { app: 'outlook', title: 'Rachel Mercer', when: 'Mail',
          body: 'Third broker just confirmed — all three read it correctly.',
          run: () => showWin('outlook') }],
        [19000, { app: 'chrome', title: 'Azure DevOps', when: 'Chrome',
          body: '48244 moved to Resolved by Priya Desai.',
          run: () => showWin('chrome') }],
      ];
      for (const [delay, n] of queue) timers.push(setTimeout(() => notify(n), delay));
    }

    /* --- the NDA lock screen ---------------------------------------
       A gated case study gates its desktop. Same passphrase, same
       sessionStorage key as the page's own gate, so unlocking either
       unlocks both. Like that gate it is an obscurity control and
       nothing more — the content is in the payload either way. */
    function locked() {
      try { return !sessionStorage.getItem('cs-' + location.pathname); } catch { return true; }
    }

    if (config.locked && locked()) {
      const field = el('input.hiw-lock-input', {
        type: 'password', name: 'key', autocomplete: 'off',
        'aria-label': 'Passphrase', placeholder: 'Passphrase',
      });
      const err = el('p.hiw-lock-err', { hidden: true, text: 'That is not it. Try again, or email me.' });

      const unlock = () => {
        try { sessionStorage.setItem('cs-' + location.pathname, '1'); } catch {}
        /* open the page behind us too, so closing the desktop does not
           drop the visitor back onto the gate they just passed */
        if (typeof self.HIW_UNLOCK === 'function') { try { self.HIW_UNLOCK(); } catch {} }
        screen.remove();
      };

      const form = el('form.hiw-lock-form', {
        onsubmit: (e) => {
          e.preventDefault();
          if (field.value.trim() === config.locked) return unlock();
          err.hidden = false;
          field.select();
        },
      }, field, el('button.hiw-lock-go', { type: 'submit', 'aria-label': 'Unlock', html: ICONS.fwd }));

      const screen = el('div.hiw-lock', null,
        el('div.hiw-lock-card', null,
          el('span.hiw-lock-av', { text: 'LD' }),
          el('b', { text: 'Luka Dadiani' }),
          el('p.hiw-lock-note', { text: 'This case study is under NDA. The desktop behind it is shared with permission, not published.' }),
          form, err,
          el('a.hiw-lock-ask', {
            href: `mailto:luka.dadiani@me.com?subject=${encodeURIComponent('xTrade case study passphrase')}`,
            text: 'Ask me for the passphrase',
          })));
      root.append(screen);
      timers.push(setTimeout(() => field.focus(), 120));
    }

    /* --- keyboard ---
       ⌘` walks the stack: the front window goes to the back and the one
       behind comes forward, so repeated presses cycle every open window
       rather than flipping between the same two. ⇧⌘` goes the other way. */
    function cycleWindows(back) {
      if (stack.length < 2) return;
      if (back) stack.push(stack.shift());
      else stack.unshift(stack.pop());
      restack();
    }

    function onKey(e) {
      const id = focusedId();
      /* asleep, the only thing any key does is wake it */
      if (napWake) { e.preventDefault(); napWake(); return; }
      /* an open menu is the innermost thing on screen, so it takes
         Escape before any window does */
      if (openMenuEl && e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (root.querySelector('.hiw-lock')) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (id) minimise(id);
        else close();
      } else if (e.metaKey || e.ctrlKey) {
        if (e.key === '`' || e.key === '~') { e.preventDefault(); cycleWindows(e.shiftKey); }
        else if (!id) return;
        else if (e.key === 'w') { e.preventDefault(); hideWin(id); }
        else if (e.key === 'm') { e.preventDefault(); minimise(id); }
      }
    }
    addEventListener('keydown', onKey);

    /* --- keep windows inside the surface when it changes size --- */
    let rzRaf = 0;
    const onResize = () => {
      rzRaf = 0;
      if (isMobile()) return;
      const bw = surface.clientWidth, bh = surface.clientHeight;
      for (const w of wins.values()) {
        const node = w.node;
        if (w.maxed) { node.style.width = bw + 'px'; node.style.height = bh + 'px'; continue; }
        node.style.width = Math.min(parseFloat(node.style.width) || MIN_W, bw - 16) + 'px';
        node.style.height = Math.min(parseFloat(node.style.height) || MIN_H, bh - 16) + 'px';
        node.style.left = clamp(parseFloat(node.style.left) || 0, -node.offsetWidth + 90, Math.max(0, bw - 70)) + 'px';
        node.style.top = clamp(parseFloat(node.style.top) || 0, 0, Math.max(0, bh - 34)) + 'px';
      }
    };
    const resizeHandler = () => { if (!rzRaf) rzRaf = requestAnimationFrame(onResize); };
    addEventListener('resize', resizeHandler, { passive: true });

    /* --- close ---------------------------------------------------
       The page behind is still a full-viewport stack of blurred
       gradients on an animation loop. `data-hiw` parks those for as
       long as the desktop is up; see the [data-still] rule it shares
       in style.css. */
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.dataset.hiw = '';

    function close() {
      if (!live) return;
      live = null;
      removeEventListener('keydown', onKey);
      removeEventListener('resize', resizeHandler);
      clearInterval(clockTimer);
      closeMenu();
      if (napWake) napWake();
      timers.forEach(clearTimeout);
      for (const w of wins.values()) if (w.onClose) w.onClose();
      if (dockRaf) cancelAnimationFrame(dockRaf);
      if (rzRaf) cancelAnimationFrame(rzRaf);
      root.remove();
      document.body.style.overflow = prevOverflow;
      delete document.documentElement.dataset.hiw;
      window.scrollTo(0, scrollY);
      if (trigger) trigger.focus();
    }

    live = { close };
    return live;
  }

  self.HowIWork = {
    /* Register an app. `spec` is { name, short, menus, glyph, bg, render }.
       `render(data, win, ui)` returns the window body element. `win` carries
       setTitle, onFirstShow, onClose and timers. */
    register(id, spec) {
      REGISTRY[id] = spec;
      if (spec.glyph || spec.bg) DOCK[id] = [spec.bg || '#3a3a3f', spec.glyph || ''];
    },
    /* so a plugin can be written and tested outside a desktop */
    ui: UI,
    open(slug, trigger) {
      const config = (self.HIW || {})[slug];
      if (!config) return null;
      return open(config, trigger);
    },
    close() { if (live) live.close(); },
  };
})();
