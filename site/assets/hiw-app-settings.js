/* ============================================================
   Two toy apps for the mock desktop: System Settings and About
   This Mac. They register themselves rather than living in
   hiw.js, so the desktop never has to know they exist.

   Everything is drawn with the kit hiw.js hands out — the same
   el() builder, the same CSS variables — so both apps follow the
   desktop into dark mode and inherit its type. The one thing
   they add to the page is a stylesheet, injected once.
   ============================================================ */
(() => {
  'use strict';
  if (!self.HowIWork) return;

  /* The kit render() is handed, taken once at load so the builders
     below can be written as plain functions rather than closures
     over a render call. */
  const UI = self.HowIWork.ui;
  const { el, svg, ICONS } = UI;

  /* The dark palette, copied from hiw.css. It has to be repeated:
     hiw.css follows the system and only ever opts *out* of dark
     (`[data-theme="light"]`), so on a light Mac there is nothing to
     turn on when the Appearance pane asks for dark. Same values,
     one extra selector. */
  const DARK = `
    --ground:#1e1e20;--content:#1c1c1e;
    --chrome:rgba(46,46,50,.7);--sidebar:rgba(38,38,42,.62);--raised:#2a2a2e;
    --fill:rgba(255,255,255,.09);--fill-2:rgba(255,255,255,.15);
    --ink:#f5f5f7;--ink-2:#a1a1a8;--ink-3:#7c7c84;
    --line:rgba(255,255,255,.13);--hair:rgba(255,255,255,.07);
    --sel:rgba(10,132,255,.26);
    --yellow-soft:rgba(255,199,44,.24);
    --edge:inset 0 0 0 .5px rgba(255,255,255,.1);
    --dock:rgba(40,40,44,.42);--dock-line:rgba(255,255,255,.13);
    --shadow:0 32px 74px rgba(0,0,0,.66),0 10px 26px rgba(0,0,0,.5),0 0 0 .5px rgba(0,0,0,.8);
    --shadow-off:0 16px 38px rgba(0,0,0,.5),0 0 0 .5px rgba(0,0,0,.7);
  `;

  const STYLE = `
/* ---------- forced dark ------------------------------------------ */
.hiw[data-theme="dark"]{${DARK}--pill:#5f5f66}
/* the handful of dark rules in hiw.css that are not tokens; without
   them a forced dark desktop keeps two light patches */
.hiw[data-theme="dark"] .hiw-dot{background:rgba(255,255,255,.7)}
.hiw[data-theme="dark"] .hiw-dock-sep{background:rgba(255,255,255,.18)}
.hiw[data-theme="dark"] .hiw-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.24);background-clip:content-box}
.hiw[data-theme="dark"] .hiw-fg-canvas{background:#181819}
.hiw[data-theme="dark"] .hiw-tm-rail{background:#252528}
.hiw[data-theme="dark"] .hiw-doc mark{background:rgba(255,199,44,.26);color:inherit}

/* the selected half of a segmented control has to sit *above* its
   track in both themes, which no existing token does */
.hiw{--pill:#fff}
@media (prefers-color-scheme:dark){.hiw:not([data-theme="light"]){--pill:#5f5f66}}

/* ---------- controls --------------------------------------------- */
.hiw-tg{
  width:38px;height:23px;border-radius:12px;flex:none;position:relative;
  background:var(--fill-2);box-shadow:inset 0 0 0 .5px var(--hair);
  transition:background .16s ease;
}
.hiw-tg::after{
  content:"";position:absolute;top:1.5px;left:1.5px;width:20px;height:20px;
  border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);
  transition:transform .16s ease;
}
.hiw-tg[aria-checked="true"]{background:var(--blue)}
.hiw-tg[aria-checked="true"]::after{transform:translateX(15px)}

.hiw-seg{display:inline-flex;gap:2px;padding:2px;border-radius:7px;background:var(--fill);flex:none}
.hiw-seg button{padding:3px 11px;border-radius:5.5px;font-size:12px;white-space:nowrap}
.hiw-seg button.on{
  background:var(--pill);font-weight:500;
  box-shadow:0 1px 2px rgba(0,0,0,.16),inset 0 0 0 .5px var(--line);
}

.hiw-sl{
  -webkit-appearance:none;appearance:none;flex:none;
  width:132px;height:4px;border-radius:2px;background:var(--fill-2);
}
.hiw-sl::-webkit-slider-thumb{
  -webkit-appearance:none;width:17px;height:17px;border-radius:50%;background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.32),0 0 0 .5px rgba(0,0,0,.14);cursor:pointer;
}
.hiw-sl::-moz-range-thumb{
  width:17px;height:17px;border:0;border-radius:50%;background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.32),0 0 0 .5px rgba(0,0,0,.14);cursor:pointer;
}
.hiw-mtr{width:104px;height:5px;border-radius:3px;background:var(--fill-2);flex:none;overflow:hidden}
.hiw-mtr i{display:block;height:100%;border-radius:3px;background:var(--blue)}
.hiw-tile{width:21px;height:21px;border-radius:5.5px;flex:none;display:grid;place-items:center;color:#fff}
.hiw-tile svg{width:13px;height:13px;display:block}

/* ---------- System Settings -------------------------------------- */
.hiw-st{flex:1;display:flex;min-width:0}
.hiw-st-side{
  width:226px;flex:none;padding:10px 0 18px;
  background:var(--sidebar);
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:.5px 0 0 var(--hair);
}
.hiw-st-find{position:relative;margin:2px 12px 10px}
.hiw-st-find svg{position:absolute;left:8px;top:50%;margin-top:-7px;width:13px;height:13px;color:var(--ink-3)}
.hiw-st-q{
  width:100%;height:26px;padding:0 8px 0 26px;
  border:0;border-radius:7px;background:var(--fill);color:var(--ink);
  font:inherit;font-size:12.5px;
}
.hiw-st-q::placeholder{color:var(--ink-3)}
.hiw-st-grp{padding:7px 0}
.hiw-st-grp + .hiw-st-grp{box-shadow:0 -.5px 0 var(--hair)}
.hiw-st-item{
  display:flex;align-items:center;gap:10px;text-align:left;
  width:calc(100% - 16px);height:30px;padding:0 8px;margin:1px 8px;
  border-radius:7px;font-size:13px;color:var(--ink);
}
.hiw-st-item:hover{background:var(--fill)}
.hiw-st-item.on{background:var(--sel);font-weight:500}
.hiw-st-none{padding:10px 20px;font-size:12px;color:var(--ink-3)}

.hiw-st-detail{flex:1;min-width:0;background:var(--content);padding:22px 28px 34px}
.hiw-st-h{
  display:flex;align-items:center;gap:9px;
  margin:0 0 18px;font-size:17px;font-weight:600;letter-spacing:-.01em;
}
.hiw-st-card{margin:0 0 20px;max-width:560px}
.hiw-st-card h3{margin:0 0 7px;padding:0 4px;font-size:12px;font-weight:600;color:var(--ink-2)}
.hiw-st-box{
  background:var(--raised);border-radius:10px;overflow:hidden;
  box-shadow:inset 0 0 0 .5px var(--line);
}
.hiw-st-r{
  display:flex;align-items:center;gap:12px;
  min-height:40px;padding:9px 14px;font-size:13px;
  box-shadow:inset 0 .5px 0 var(--hair);
}
.hiw-st-r:first-child{box-shadow:none}
.hiw-st-r .lab{flex:1;min-width:0;line-height:1.35}
.hiw-st-r .sub{display:block;margin-top:2px;font-size:11.5px;line-height:1.45;color:var(--ink-3)}
.hiw-st-r .val{color:var(--ink-2);text-align:right;flex:none}
.hiw-st-r .chev{display:flex;flex:none;color:var(--ink-3)}
.hiw-st-r .cap{font-size:11px;color:var(--ink-3);flex:none}
.hiw-st-sl{display:flex;align-items:center;gap:8px;flex:none}
.hiw-st-app{
  width:26px;height:26px;border-radius:6px;flex:none;
  display:grid;place-items:center;color:#fff;font-size:12px;font-weight:700;
}
.hiw-st-sw{
  width:19px;height:19px;border-radius:50%;flex:none;
  box-shadow:inset 0 0 0 .5px rgba(0,0,0,.2);
}
.hiw-st-sw.on{box-shadow:inset 0 0 0 .5px rgba(0,0,0,.2),0 0 0 2px var(--content),0 0 0 3.5px var(--ink-3)}
.hiw-st-swatches{display:flex;gap:9px;flex:none}

.hiw-st-chart{display:flex;align-items:flex-end;gap:3px;height:76px;padding:14px 14px 0}
.hiw-st-chart span{flex:1;min-width:0;border-radius:2px 2px 0 0;background:var(--blue);opacity:.8}
.hiw-st-chart span:last-child{opacity:1}
.hiw-st-axis{
  display:flex;justify-content:space-between;
  padding:6px 14px 12px;font-size:10.5px;color:var(--ink-3);
}

/* ---------- About This Mac --------------------------------------- */
.hiw-ab{flex:1;display:flex;min-width:0;background:var(--content);overflow:auto}
.hiw-ab-in{margin:auto;padding:26px 30px 30px;width:100%;max-width:420px;text-align:center}
.hiw-ab-art{display:block;margin:0 auto 14px;width:min(232px,72%);height:auto}
.hiw-ab-name{margin:0;font-size:19px;font-weight:600;letter-spacing:-.012em}
.hiw-ab-model{margin:3px 0 20px;font-size:12.5px;color:var(--ink-3)}
.hiw-ab-rows{text-align:left;font-size:12.5px}
.hiw-ab-r{display:flex;gap:14px;padding:5px 0;line-height:1.45}
.hiw-ab-r dt{flex:none;width:104px;text-align:right;color:var(--ink-2)}
.hiw-ab-r dd{margin:0;flex:1;min-width:0}
.hiw-ab-btns{display:flex;gap:10px;justify-content:center;margin-top:24px}
.hiw-ab-btn{
  padding:5px 15px;border-radius:7px;font-size:12.5px;
  background:var(--raised);
  box-shadow:0 1px 2px rgba(0,0,0,.12),inset 0 0 0 .5px var(--line);
}
.hiw-ab-btn:hover{background:var(--fill)}
.hiw-ab-btn.primary{background:var(--blue);color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.hiw-ab-note{margin:18px auto 0;max-width:34ch;font-size:11.5px;line-height:1.55;color:var(--ink-3)}
.hiw-ab-spin{
  width:22px;height:22px;margin:0 auto 12px;border-radius:50%;
  border:2.5px solid var(--fill-2);border-top-color:var(--ink-3);
  animation:hiw-ab-turn .8s linear infinite;
}
@keyframes hiw-ab-turn{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.hiw-ab-spin{animation:none}}
.hiw-ab-badge{
  width:52px;height:52px;margin:0 auto 14px;border-radius:50%;
  display:grid;place-items:center;background:var(--fill);color:var(--ink-2);
}
.hiw-ab-badge svg{width:25px;height:25px;display:block}

/* a narrow window keeps its sidebar — it is the only way through the
   app — but gives up the padding it can spare */
@container (max-width:640px){
  .hiw-st-side{width:180px}
  .hiw-st-detail{padding:18px 16px 28px}
}
@media (max-width:900px){
  .hiw-st-side{width:164px}
  .hiw-st-detail{padding:16px 14px 26px}
}
`;

  /* ---------- glyphs ------------------------------------------------
     Sidebar tiles, at 13px. Drawn rather than borrowed because the
     kit's icons are sized for a menu bar, not for a rounded tile. */
  const G = {
    gear: svg('0 0 16 16', '<circle cx="8" cy="8" r="2.7" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.4v2.2M8 12.4v2.2M1.4 8h2.2M12.4 8h2.2M3.3 3.3l1.6 1.6M11.1 11.1l1.6 1.6M12.7 3.3l-1.6 1.6M4.9 11.1l-1.6 1.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'),
    half: svg('0 0 16 16', '<circle cx="8" cy="8" r="5.7" stroke="currentColor" stroke-width="1.5"/><path d="M8 2.3a5.7 5.7 0 0 1 0 11.4z" fill="currentColor"/>'),
    dock: svg('0 0 16 16', '<rect x="3" y="1.9" width="10" height="6" rx="1.4" stroke="currentColor" stroke-width="1.4"/><rect x="1.4" y="10" width="13.2" height="4.2" rx="1.6" stroke="currentColor" stroke-width="1.4"/>'),
    speaker: svg('0 0 16 16', '<path d="M8.4 2.4 4.7 5.7H2.1v4.6h2.6l3.7 3.3z" fill="currentColor"/><path d="M10.9 5.5a3.6 3.6 0 0 1 0 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'),
    moon: svg('0 0 16 16', '<path d="M12.8 9.6A5.6 5.6 0 0 1 6.4 3.2a5.8 5.8 0 1 0 6.4 6.4z" fill="currentColor"/>'),
    glass: svg('0 0 16 16', '<path d="M4.4 2h7.2M4.4 14h7.2M5.3 2v2.3L8 7l2.7-2.7V2M5.3 14v-2.3L8 9l2.7 2.7V14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    shield: svg('0 0 16 16', '<path d="M8 1.7 13.3 4v4.3c0 3-2.1 5-5.3 6-3.2-1-5.3-3-5.3-6V4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'),
    cell: svg('0 0 16 16', '<rect x="1.3" y="4.6" width="11.5" height="6.8" rx="2.2" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="6.3" width="5.6" height="3.4" rx=".9" fill="currentColor"/><path d="M14.3 6.7v2.6a1.5 1.5 0 0 0 0-2.6z" fill="currentColor"/>'),
    bell: svg('0 0 16 16', '<path d="M8 2.2a3.9 3.9 0 0 1 3.9 3.9c0 3 1 3.8 1 3.8H3.1s1-.8 1-3.8A3.9 3.9 0 0 1 8 2.2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.6 12.1a1.5 1.5 0 0 0 2.8 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'),
  };
  const BADGE = {
    laptop: svg('0 0 32 32', '<rect x="5.5" y="6" width="21" height="14" rx="2.2" stroke="currentColor" stroke-width="2"/><path d="M2.5 23h27l-1.4 2.4a1.8 1.8 0 0 1-1.5.9H5.4a1.8 1.8 0 0 1-1.5-.9z" fill="currentColor"/>'),
    tick: svg('0 0 32 32', '<circle cx="16" cy="16" r="12.4" stroke="currentColor" stroke-width="2"/><path d="m10.6 16.2 3.8 3.8 7-7.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  };
  const CHEV = svg('0 0 12 12', '<path d="M4.4 2.4 8 6l-3.6 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'width="11" height="11"');

  /* ---------- control builders --------------------------------------
     Each one owns its own state. Nothing here reports anywhere, which
     is the honest version of a settings pane in a portfolio: the
     switch moves, and that is the whole contract. */
  const tile = (glyph, tint) => el('span.hiw-tile', { style: { background: tint }, html: glyph });

  function toggle(on, label) {
    const b = el('button.hiw-tg', {
      type: 'button', role: 'switch',
      'aria-checked': on ? 'true' : 'false',
      'aria-label': label,
    });
    b.addEventListener('click', () => {
      b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true' ? 'true' : 'false');
    });
    return b;
  }

  function segment(options, initial, onChange) {
    const wrap = el('div.hiw-seg', { role: 'group' });
    const buttons = options.map((opt) => {
      const b = el('button' + (opt === initial ? '.on' : ''), {
        type: 'button', text: opt, 'aria-pressed': opt === initial ? 'true' : 'false',
      });
      b.addEventListener('click', () => {
        for (const other of buttons) {
          const on = other === b;
          other.classList.toggle('on', on);
          other.setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        if (onChange) onChange(opt);
      });
      return b;
    });
    wrap.append(...buttons);
    return wrap;
  }

  /* Drawn as a real range input so the thumb moves under the pointer.
     A slider that does not move is a picture of a slider. */
  const slider = (value, label) => el('input.hiw-sl', {
    type: 'range', min: '0', max: '100', value: String(value), 'aria-label': label,
  });

  /* a slider reads as a slider only with its two end labels either side */
  const sliders = (lo, input, hi) => el('span.hiw-st-sl', null,
    lo ? el('span.cap', { text: lo }) : null, input, hi ? el('span.cap', { text: hi }) : null);

  const meter = (pct) => el('span.hiw-mtr', null,
    el('i', { style: { width: Math.max(2, Math.min(100, pct)) + '%' } }));

  function row(label, o) {
    o = o || {};
    return el('div.hiw-st-r', null,
      o.lead || null,
      el('div.lab', null, el('span', { text: label }),
        o.sub ? el('span.sub', { text: o.sub }) : null),
      o.value ? el('span.val', { text: o.value }) : null,
      o.control || null,
      o.chevron ? el('span.chev', { html: CHEV }) : null);
  }

  const card = (title, ...rows) => el('section.hiw-st-card', null,
    title ? el('h3', { text: title }) : null,
    el('div.hiw-st-box', null, rows));

  const switchRow = (label, sub, on) => row(label, { sub, control: toggle(on, label) });

  const appRow = (name, tint, sub, on) => row(name, {
    sub,
    lead: el('span.hiw-st-app', { style: { background: tint }, text: name[0] }),
    control: toggle(on, name),
  });

  /* The machine both apps describe. Overridable from the desktop's
     config so a future case study can be running something else. */
  const MACHINE = {
    name: "Luka's MacBook Pro",
    model: 'MacBook Pro (14-inch, 2023)',
    chip: 'Apple M2 Pro',
    memory: '16 GB',
    os: 'macOS Sonoma 14.5',
    serial: 'F16MA0PEN2AM',
  };
  const machine = (data) => Object.assign({}, MACHINE, (data && data.machine) || null);

  /* ============================================================
     System Settings
     ============================================================ */

  const ACCENTS = [
    ['Blue', '#0a84ff'], ['Purple', '#af52de'], ['Pink', '#f74f9e'], ['Red', '#ff3b30'],
    ['Orange', '#ff9500'], ['Yellow', '#ffcc00'], ['Green', '#34c759'], ['Graphite', '#8e8e93'],
  ];

  /* --blue is the desktop's accent everywhere — selections, links, the
     toggles above — so setting it on the root is the whole feature.
     --sel is derived because it is the same colour at low alpha. */
  function setAccent(root, hex) {
    if (!root) return;
    const n = parseInt(hex.slice(1), 16);
    root.style.setProperty('--blue', hex);
    root.style.setProperty('--blue-ink', hex);
    root.style.setProperty('--sel', `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},.2)`);
  }

  const PANES = {
    general: (ctx) => [
      card(null,
        row('Name', { value: ctx.M.name }),
        row('Chip', { value: ctx.M.chip }),
        row('Memory', { value: ctx.M.memory }),
        row('macOS', { value: ctx.M.os.replace('macOS ', '') }),
        row('Serial number', { value: ctx.M.serial })),
      card('Right now',
        row('Unsaved Figma files', { value: '3' }),
        row('Open browser tabs', { value: '41', sub: 'Across four windows, two of them minimised since Tuesday.' }),
        row('Days since last restart', { value: '62' }),
        row('Items on the Desktop', { value: '214', sub: 'Filed into a folder called "desktop old". Twice.' })),
      card(null,
        row('Software Update', { value: '1 update available', sub: 'Deferred since May.', chevron: true }),
        row('Storage', { value: '12 GB of 512 GB free', chevron: true }),
        row('Login Items', { value: '7', sub: 'Four of which nobody chose.', chevron: true }),
        row('AirDrop & Handoff', { chevron: true })),
    ],

    appearance: (ctx) => {
      /* The root is only reachable once the window is in the document,
         which is after render — so it is looked up on click, not now. */
      const root = () => ctx.node.closest('.hiw');
      const swatches = el('span.hiw-st-swatches');
      const dots = ACCENTS.map(([name, hex]) => {
        const dot = el('button.hiw-st-sw' + (hex === '#0a84ff' ? '.on' : ''), {
          type: 'button', 'aria-label': name, title: name,
          style: { background: hex },
        });
        dot.addEventListener('click', () => {
          for (const other of dots) other.classList.toggle('on', other === dot);
          setAccent(root(), hex);
        });
        return dot;
      });
      swatches.append(...dots);

      const theme = segment(['Light', 'Dark', 'Auto'], 'Auto', (choice) => {
        const r = root();
        if (!r) return;
        if (choice === 'Auto') delete r.dataset.theme;
        else r.dataset.theme = choice.toLowerCase();
      });

      return [
        card(null,
          row('Appearance', { control: theme, sub: 'Auto switches at sunset. You will be working through it either way.' }),
          row('Accent colour', { control: swatches, sub: 'Changed nine times this month. Always back to blue.' }),
          row('Highlight colour', { value: 'Accent colour', chevron: true })),
        card(null,
          row('Sidebar icon size', { control: segment(['Small', 'Medium', 'Large'], 'Medium') }),
          row('Show scroll bars', { control: segment(['Automatic', 'Always'], 'Automatic') }),
          switchRow('Allow wallpaper tinting in windows', null, true)),
      ];
    },

    dock: () => [
      card(null,
        row('Size', { control: sliders('Small', slider(46, 'Dock size'), 'Large') }),
        row('Magnification', { control: sliders('Off', slider(72, 'Dock magnification'), 'Max') }),
        row('Position on screen', { control: segment(['Left', 'Bottom', 'Right'], 'Bottom') }),
        row('Minimise windows using', { control: segment(['Genie', 'Scale'], 'Genie') })),
      card(null,
        switchRow('Automatically hide and show the Dock', 'Tried for one week in 2019.', false),
        switchRow('Show indicators for open applications', null, true),
        switchRow('Show recent applications in Dock', 'They are all recent.', false),
        switchRow('Stage Manager', 'On for eleven minutes.', false)),
      card('Desktop',
        row('Hot Corners', {
          sub: 'Bottom left starts the screen saver. Triggered 400 times, none of them on purpose.',
          chevron: true,
        }),
        switchRow('Click wallpaper to reveal desktop', 'Reveals 214 items. Do not.', false)),
    ],

    notifications: () => [
      card(null,
        switchRow('Allow notifications when the screen is locked', null, true),
        switchRow('Allow notifications when mirroring or sharing the display', 'The one time it matters.', false),
        switchRow('Show previews', 'Always', true)),
      card('Application notifications',
        appRow('Slack', '#4a154b', '47 unread. Do Not Disturb since March.', false),
        appRow('Figma', '#a259ff', 'Someone commented on your frame. It was you.', true),
        appRow('Outlook', '#0f6cbd', 'Banners, sounds and badges. All three.', true),
        appRow('Calendar', '#ff3b30', 'Reminds you five minutes before, which is five minutes too late.', true),
        appRow('Terminal', '#3a3a3f', 'Has never sent one.', true),
        appRow('Software Update', '#8e8e93', 'Every third day, indefinitely.', false)),
    ],

    sound: () => [
      card(null,
        row('Alert sound', { value: 'Funk', chevron: true }),
        row('Alert volume', { control: slider(24, 'Alert volume') }),
        switchRow('Play sound on startup', null, true),
        switchRow('Play user interface sound effects', null, true),
        switchRow('Play feedback when volume is changed', 'Turned off during a workshop, never turned back on.', false)),
      card('Output and input',
        row('Output', { value: 'MacBook Pro Speakers', sub: 'The good headphones are in the other bag.', chevron: true }),
        row('Input', { value: 'MacBook Pro Microphone', sub: 'Muted. Has been for the whole call.', chevron: true })),
    ],

    focus: () => [
      card(null,
        row('Do Not Disturb', { sub: 'On since 14 March.', control: toggle(true, 'Do Not Disturb') }),
        row('Deep work', { sub: 'Last used: 2021.', control: toggle(false, 'Deep work') }),
        row('Sleep', { sub: 'Scheduled for 23:00. Observed at 01:40.', control: toggle(false, 'Sleep') }),
        row('Personal', { sub: 'Never configured.', control: toggle(false, 'Personal') })),
      card(null,
        switchRow('Share across devices', 'So the phone can be quiet too, while you check it.', true),
        row('Focus status', {
          sub: 'Tells people you have notifications silenced. They message you anyway.',
          value: 'On', chevron: true,
        })),
    ],

    screentime: () => {
      const usage = [
        ['Figma', 4.03, '4 h 02 min'],
        ['Google Chrome', 3.3, '3 h 18 min'],
        ['Terminal', 1.1, '1 h 06 min'],
        ['Outlook', 0.53, '32 min'],
        ['System Settings', 0.23, '14 min'],
      ];
      const top = usage[0][1];
      return [
        card('Today',
          row('Screen time', { value: '9 h 12 min', sub: '18% above last week, which was above the week before it.' }),
          row('Pickups', { value: '112', sub: 'Peak between 22:00 and 23:00.' })),
        card('Most used',
          usage.map(([name, hours, label]) => row(name, {
            control: meter((hours / top) * 100), value: label,
          }))),
        card(null,
          row('App Limits', { value: 'Off', sub: 'Set once. Removed the same afternoon.', chevron: true }),
          row('Downtime', { value: 'Off', sub: 'Scheduled 22:00 to 07:00. Overridden nightly with "Ignore Limit".', chevron: true }),
          switchRow('Include website data', null, true)),
      ];
    },

    privacy: () => [
      card(null,
        row('Location Services', { value: 'On', chevron: true }),
        row('Camera', { value: '3 apps', chevron: true }),
        row('Microphone', { value: '5 apps', sub: 'Two of them a surprise.', chevron: true }),
        row('Screen Recording', { value: '4 apps', sub: 'It is that kind of job.', chevron: true }),
        row('Full Disk Access', { value: 'Terminal', sub: 'Obviously.', chevron: true })),
      card('Security',
        row('FileVault', { value: 'On', sub: 'Recovery key written down. Location of the paper unknown.' }),
        row('Allow applications from', { control: segment(['App Store', 'Identified developers'], 'Identified developers') }),
        switchRow('Lockdown Mode', 'For a threat model you do not have.', false),
        switchRow('Share Mac Analytics', 'Declined in 2015 and every year since.', false)),
    ],

    battery: () => {
      /* The last 24 hours as a percentage per hour, with the bump where
         it was plugged in. Fixed rather than random so the chart looks
         the same every time the window opens. */
      const hours = [100, 96, 92, 88, 84, 79, 74, 70, 66, 61, 57, 52, 48, 44, 40, 36, 33, 52, 74, 92, 88, 80, 71, 62];
      return [
        card('Last 24 hours',
          el('div.hiw-st-chart', null,
            hours.map((h) => el('span', { style: { height: Math.max(6, h) + '%' } }))),
          el('div.hiw-st-axis', null,
            el('span', { text: '24 h ago' }), el('span', { text: '12 h' }), el('span', { text: 'Now' })),
          row('Battery level', { value: '62%' }),
          row('Last charged to 100%', { value: 'Yesterday, 08:14' })),
        card(null,
          row('Low Power Mode', {
            control: segment(['Never', 'On Battery', 'Always'], 'On Battery'),
            sub: 'Changes nothing you can measure, but it feels responsible.',
          }),
          switchRow('Optimised Battery Charging', 'Learns your daily routine. It has not found one.', true)),
        card('Using significant energy',
          row('Google Chrome', { control: meter(96), value: 'High', sub: '41 tabs, 6 of them the same Figma file.' }),
          row('Figma', { control: meter(74), value: 'High', sub: 'Three files open, none of them saved.' }),
          row('Terminal', { control: meter(18), value: 'Low' }),
          row('System Settings', { control: meter(9), value: 'Low', sub: 'Whatever this window is costing you.' })),
      ];
    },
  };

  const CATS = [
    [
      { id: 'general', name: 'General', tint: '#8e8e93', icon: G.gear },
      { id: 'appearance', name: 'Appearance', tint: '#55555b', icon: G.half },
      { id: 'dock', name: 'Desktop & Dock', tint: '#1f7ae0', icon: G.dock },
    ],
    [
      { id: 'notifications', name: 'Notifications', tint: '#ff3b30', icon: G.bell },
      { id: 'sound', name: 'Sound', tint: '#f0359b', icon: G.speaker },
      { id: 'focus', name: 'Focus', tint: '#5e5ce6', icon: G.moon },
      { id: 'screentime', name: 'Screen Time', tint: '#6f5cd6', icon: G.glass },
    ],
    [
      { id: 'privacy', name: 'Privacy & Security', tint: '#1f7ae0', icon: G.shield },
      { id: 'battery', name: 'Battery', tint: '#34c759', icon: G.cell },
    ],
  ];

  function settingsApp(data, win) {
    UI.style('hiw-toys', STYLE);
    const ctx = { M: machine(data), node: null };
    const detail = el('div.hiw-st-detail.hiw-scroll');
    const side = el('div.hiw-st-side.hiw-scroll');
    const body = el('div.hiw-body.hiw-st', null, side, detail);
    ctx.node = body;

    const rows = new Map();
    const show = (cat) => {
      for (const [id, b] of rows) b.classList.toggle('on', id === cat.id);
      detail.scrollTop = 0;
      detail.replaceChildren(
        el('h2.hiw-st-h', null, tile(cat.icon, cat.tint), el('span', { text: cat.name })),
        ...PANES[cat.id](ctx));
      /* macOS titles the window with the pane you are in, which is the
         only reason this app has a changing title at all */
      win.setTitle(cat.name);
    };

    const groups = CATS.map((group) => el('div.hiw-st-grp', null,
      group.map((cat) => {
        const b = el('button.hiw-st-item', { type: 'button', onclick: () => show(cat) },
          tile(cat.icon, cat.tint), el('span', { text: cat.name }));
        rows.set(cat.id, b);
        return b;
      })));

    /* The search field is the fastest way through nine categories, so
       it filters rather than pretending to. */
    const empty = el('div.hiw-st-none', { text: 'No results', hidden: true });
    const query = el('input.hiw-st-q', {
      type: 'search', placeholder: 'Search', 'aria-label': 'Search settings',
      spellcheck: 'false',
    });
    query.addEventListener('input', () => {
      const q = query.value.trim().toLowerCase();
      let hits = 0;
      CATS.forEach((group, i) => {
        let shown = 0;
        for (const cat of group) {
          const match = !q || cat.name.toLowerCase().includes(q);
          rows.get(cat.id).hidden = !match;
          if (match) shown++;
        }
        groups[i].hidden = shown === 0;
        hits += shown;
      });
      empty.hidden = hits > 0;
    });

    side.append(
      el('div.hiw-st-find', null, el('span', { html: ICONS.search }), query),
      ...groups, empty);
    show(CATS[0][0]);
    return body;
  }

  /* ============================================================
     About This Mac
     ============================================================ */

  /* Drawn rather than loaded: a photograph of a laptop is 40 KB that
     nobody asked for, and this reads at 200px. The screen fills with
     var() so the machine follows the desktop into dark mode. */
  const MACBOOK = svg('0 0 232 152', `
    <defs>
      <linearGradient id="hiwAbSky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3d2fd8"/>
        <stop offset=".55" stop-color="#8b46d6"/>
        <stop offset="1" stop-color="#e0578b"/>
      </linearGradient>
    </defs>
    <rect x="30" y="6" width="172" height="114" rx="9" fill="var(--raised)" stroke="var(--line)"/>
    <rect x="37" y="13" width="158" height="94" rx="4" fill="url(#hiwAbSky)"/>
    <rect x="103" y="13" width="26" height="6" rx="3" fill="var(--raised)"/>
    <rect x="64" y="36" width="104" height="54" rx="5" fill="#fff" fill-opacity=".92"/>
    <circle cx="71.5" cy="43" r="2.1" fill="#ff5f57"/>
    <circle cx="78.5" cy="43" r="2.1" fill="#febc2e"/>
    <circle cx="85.5" cy="43" r="2.1" fill="#28c840"/>
    <rect x="71" y="53" width="62" height="3.6" rx="1.8" fill="#000" fill-opacity=".16"/>
    <rect x="71" y="62" width="86" height="3.6" rx="1.8" fill="#000" fill-opacity=".16"/>
    <rect x="71" y="71" width="44" height="3.6" rx="1.8" fill="#000" fill-opacity=".16"/>
    <path d="M16 120h200l7 15.4a3.6 3.6 0 0 1-3.3 5.1H12.3a3.6 3.6 0 0 1-3.3-5.1z" fill="var(--fill-2)" stroke="var(--line)" stroke-width=".8"/>
    <path d="M99 124h34a4.4 4.4 0 0 1-4.3 3.4h-25.4A4.4 4.4 0 0 1 99 124z" fill="var(--line)"/>
  `, 'class="hiw-ab-art"');

  const abRow = (label, value) => el('div.hiw-ab-r', null,
    el('dt', { text: label }), el('dd', { text: value }));

  function aboutApp(data, win) {
    UI.style('hiw-toys', STYLE);
    const M = machine(data);
    const host = el('div.hiw-ab-in');
    const body = el('div.hiw-body.hiw-ab', null, host);
    /* Guards the update timer: if the pane changed while it was
       pending, the callback has nothing left to write into. */
    let pane = '';

    const button = (label, onclick, primary) =>
      el('button.hiw-ab-btn' + (primary ? '.primary' : ''), { type: 'button', text: label, onclick });

    function main() {
      pane = 'main';
      win.setTitle('About This Mac');
      host.replaceChildren(
        el('div', { html: MACBOOK }).firstElementChild,
        el('h2.hiw-ab-name', { text: M.name }),
        el('p.hiw-ab-model', { text: M.model }),
        el('dl.hiw-ab-rows', null,
          abRow('Chip', M.chip),
          abRow('Memory', '16 GB — 15.6 GB of it Chrome'),
          abRow('Graphics', '19-core GPU, or whatever Figma has not claimed'),
          abRow('Startup disk', 'Macintosh HD — 12 GB available, mostly screenshots'),
          abRow('Serial number', M.serial),
          abRow('macOS', M.os)),
        el('div.hiw-ab-btns', null,
          button('More Info…', more),
          button('Software Update…', update)));
    }

    function more() {
      pane = 'more';
      win.setTitle('More Info');
      host.replaceChildren(
        el('div.hiw-ab-badge', { html: BADGE.laptop }),
        el('h2.hiw-ab-name', { text: 'Hardware overview' }),
        el('p.hiw-ab-model', { text: 'The parts of it nobody puts on a spec sheet' }),
        el('dl.hiw-ab-rows', null,
          abRow('Model', M.model),
          abRow('Uptime', '62 days, 4 hours — never knowingly restarted'),
          abRow('Displays', 'Built-in Liquid Retina XDR, plus a borrowed 27-inch'),
          abRow('Documents named "final"', '14'),
          abRow('Documents named "final-v2"', '9'),
          abRow('Keyboard', 'Backlit. The B key needs conviction.'),
          abRow('Coverage', 'AppleCare+ ended the week before the keyboard did')),
        el('div.hiw-ab-btns', null, button('Back', main)));
    }

    function update() {
      pane = 'checking';
      win.setTitle('Software Update');
      host.replaceChildren(
        el('div.hiw-ab-spin'),
        el('h2.hiw-ab-name', { text: 'Checking for updates…' }),
        el('p.hiw-ab-model', { text: 'Contacting a server that has already made up its mind' }));
      win.timers.push(setTimeout(() => {
        if (pane !== 'checking') return;
        pane = 'update';
        host.replaceChildren(
          el('div.hiw-ab-badge', { html: BADGE.tick }),
          el('h2.hiw-ab-name', { text: 'Your Mac is up to date' }),
          el('p.hiw-ab-model', { text: M.os + ' — last checked just now' }),
          el('p.hiw-ab-note', {
            text: 'Every application currently open does have an update available. '
              + 'Installing them would close 41 tabs, so nothing has been installed.',
          }),
          el('div.hiw-ab-btns', null, button('Done', main, true)));
      }, 1400));
    }

    main();
    return body;
  }

  /* ============================================================
     registration
     ============================================================ */
  self.HowIWork.register('settings', {
    name: 'System Settings',
    short: 'Settings',
    menus: ['File', 'Edit', 'View', 'Window', 'Help'],
    bg: 'linear-gradient(180deg,#f4f4f6,#c5c5cc)',
    glyph: svg('0 0 40 40',
      '<circle cx="20" cy="20" r="5.4" stroke="#5b5b63" stroke-width="3"/>'
      + '<path d="M20 4.4v4.4M20 31.2v4.4M4.4 20h4.4M31.2 20h4.4M9 9l3.1 3.1M27.9 27.9l3.1 3.1M31 9l-3.1 3.1M12.1 27.9 9 31" stroke="#5b5b63" stroke-width="3" stroke-linecap="round"/>',
      'width="40" height="40"'),
    render: settingsApp,
  });

  self.HowIWork.register('about', {
    name: 'About This Mac',
    short: 'About',
    menus: ['File', 'Edit', 'Window', 'Help'],
    bg: 'linear-gradient(160deg,#53535c,#232328)',
    glyph: svg('0 0 40 40',
      '<rect x="8.5" y="9" width="23" height="15.5" rx="2.4" stroke="#fff" stroke-width="2.2"/>'
      + '<path d="M4.5 28.5h31l-1.5 2.6a2 2 0 0 1-1.7 1H7.7a2 2 0 0 1-1.7-1z" fill="#fff"/>',
      'width="40" height="40"'),
    render: aboutApp,
  });
})();
