/* Builds the whole site from build/content.mjs.
   Run: node build/build.mjs   (no dependencies)

   - writes work/<slug>.html
   - writes sitemap.xml and robots.txt
   - rewrites the marked blocks inside index.html

   Every absolute URL and every piece of case-study copy resolves from here,
   so nothing is stated in two places. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CASES } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'work'), { recursive: true });

/* The only place the origin is written down. */
const SITE = 'https://meetluka.com';

const OWNER = 'Luka Dadiani';
const EMAIL = 'luka.dadiani@me.com';
const LINKEDIN = 'https://www.linkedin.com/in/lukadadiani/';
const TAGLINE = 'Ten years making regulated, legacy-bound software feel obvious.';

/* ---------- critical CSS -------------------------------------------
   `style.css` is one authored file annotated with `/* @c <bucket> *​/`
   switches. Rules needed to paint above the fold are inlined into the
   document so first render costs no extra round trip; the rest ships as
   a cached, non-blocking `rest.css`.

   Spans are emitted in FILE order, filtered by bucket — never grouped by
   bucket. Grouping would hoist the reduced-motion block (authored last,
   bucket `base`) above the rules it is there to override. */
function splitCss() {
  const src = readFileSync(join(ROOT, 'assets', 'style.css'), 'utf8');
  const spans = [];
  let bucket = 'base', from = 0;
  const re = /\/\* @c (base|home|case|rest) \*\/\n/g;
  let m;
  while ((m = re.exec(src))) {
    spans.push([bucket, src.slice(from, m.index)]);
    bucket = m[1];
    from = m.index + m[0].length;
  }
  spans.push([bucket, src.slice(from)]);

  const pick = (...keep) =>
    spans.filter(([b]) => keep.includes(b)).map(([, css]) => css).join('').trim();

  return { home: pick('base', 'home'), case: pick('base', 'case'), rest: pick('rest') };
}
const CSS = splitCss();

/* Belt and braces: the whole point of this is the first-flight budget, so
   the build refuses to ship a page that has quietly outgrown it. */
const INITCWND = 14600;
function assertBudget(label, firstPaintBytes) {
  const size = gzipSync(Buffer.from(firstPaintBytes), { level: 9 }).length;
  const pct = Math.round((size / INITCWND) * 100);
  if (size > INITCWND) {
    throw new Error(`${label}: first-paint window is ${size}B gzipped, over the ${INITCWND}B initial congestion window`);
  }
  console.log(`  ${label.padEnd(22)} first paint ${String(size).padStart(6)}B gz  (${pct}% of budget)`);
}

const esc = (s) => s.replace(/&(?![a-z#]+;)/g, '&amp;').replace(/</g, '&lt;');
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…');

/* Pre-split so headlines animate from CSS alone: they are the LCP element and
   must not wait on a script. */
const splitWords = (html, cls = 'w') => {
  let i = 0;
  return html
    .split(/(<br\s*\/?>)/i)
    .map((chunk) => (/^<br/i.test(chunk)
      ? '<br>'
      : chunk.trim().split(/\s+/).filter(Boolean)
          .map((w) => `<span class="${cls}" style="--i:${i++}">${esc(w)}</span>`).join(' ')))
    .join('');
};

const EMBLEM =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M8.6 2.2H15.4L21.8 8.6V15.4L15.4 21.8H8.6L2.2 15.4V8.6Z"/></svg>';
const MAIL_ICON =
  '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.25" y="3.25" width="13.5" height="11.5" rx="2"/><path d="m2.75 5.5 6.25 4 6.25-4"/></svg>';
const ARROW =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="3.5" y1="10" x2="16" y2="10"/><polyline points="11.5,5.5 16,10 11.5,14.5"/></svg>';

/* Inner markup for each CSS-drawn preview tile. The shapes are pure CSS; these
   are just the boxes it styles. */
const MOCKS = {
  'mock-panes': '<span></span><span></span><span></span><span></span><span></span><div class="pane"></div>',
  'mock-code': '<span></span>'.repeat(7),
  'mock-form': '<b></b><i></i><i></i><u></u>',
  'mock-parcels': '<span></span>'.repeat(3),
  'mock-phone': '<div><b></b><i></i><i></i></div>',
  'mock-perms': '<span></span>'.repeat(3),
  'mock-bars': '<span></span>'.repeat(6),
  'mock-table': '<span></span>'.repeat(5),
};

const shot = ([mock, a, b, caption, pale]) => `
          <figure class="shot${pale ? ' pale' : ''}" style="--a:${a};--b:${b}">
            <div class="${mock}" aria-hidden="true">${MOCKS[mock]}</div>
            <figcaption>${esc(caption)}</figcaption>
          </figure>`;

/* ---------- the card on the landing page ---------------------------- */
const card = (c, i) => `
    <article class="case reveal" style="--d:${i % 2}">
      <a class="case-link" href="work/${c.slug}.html" aria-label="${esc(c.name)} case study">
        <header>
          <span class="badge" style="--brand:${c.brand}">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg>
          </span>
          <h3>${esc(c.name)}</h3>
          <span class="meta">${esc(c.tag)}</span>
          <span class="arrow" aria-hidden="true">${ARROW}</span>
        </header>
        <p>${esc(c.card)}</p>
        <ul class="stats">
          ${c.cardStats.map(([v, l]) => `<li><b>${esc(v)}</b>${esc(l)}</li>`).join('\n          ')}
        </ul>
        <div class="shots">${c.shots.map(shot).join('')}
        </div>
      </a>
    </article>`;

/* ---------- shared <head> metadata ---------------------------------- */
const meta = ({ url, title, desc, type }) => `<link rel="canonical" href="${url}">

<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${OWNER}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/assets/og.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/assets/og.jpg">`;

/* ---------- case-study page ----------------------------------------- */
const section = (s) => `
      <section class="cs-block reveal">
        ${s.n ? `<span class="cs-num">${s.n}</span>` : ''}
        <h2>${esc(s.h)}</h2>
        ${s.p.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
      </section>`;

function casePage(c, prev, next) {
  const url = `${SITE}/work/${c.slug}.html`;
  const title = `${c.name} case study — ${strip(c.title)} | ${OWNER}`;
  const desc = clip(strip(c.tagline), 155);

  const body = `
    <div class="cs-body">
      ${c.sections.map(section).join('\n')}

      <section class="cs-block cs-outcomes reveal">
        <h2>Outcomes</h2>
        <dl>
          ${c.outcomes.map(([v, l]) => `<div><dt>${esc(v)}</dt><dd>${esc(l)}</dd></div>`).join('\n          ')}
        </dl>
      </section>

      <section class="cs-block cs-learned reveal">
        <h2>What I learned</h2>
        <ul>
          ${c.learned.map(([t, b]) => `<li><b>${esc(t)}</b><span>${esc(b)}</span></li>`).join('\n          ')}
        </ul>
      </section>
    </div>`;

  const gated = c.locked
    ? `
    <form class="cs-gate" data-gate data-key="${c.locked}">
      <span class="cs-gate-icon" aria-hidden="true">
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.75" y="7.75" width="12.5" height="8.5" rx="2"/><path d="M5.75 7.75V5.5a3.25 3.25 0 0 1 6.5 0v2.25"/></svg>
      </span>
      <h2>This one is under NDA</h2>
      <p>The detail below is shared with permission, not published. If you need the passphrase, <a href="mailto:${EMAIL}?subject=${encodeURIComponent(c.name)}%20case%20study">ask me for it</a> — I answer quickly.</p>
      <div class="cs-gate-row">
        <input type="password" name="key" autocomplete="off" aria-label="Passphrase" placeholder="Passphrase">
        <button type="submit">Unlock</button>
      </div>
      <p class="cs-gate-err" data-err hidden>That is not it. Try again, or email me.</p>
    </form>
    <div data-locked hidden>${body}
    </div>`
    : body;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#e9e9ec">
${meta({ url, title, desc, type: 'article' })}

<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<style>${CSS.case}</style>
<link rel="preload" as="style" href="../assets/rest.css" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="../assets/rest.css"></noscript>
<script defer src="../assets/case.js"></script>
</head>
<body class="is-case">

<div class="progress" aria-hidden="true"><i data-progress></i></div>

<nav class="island" aria-label="Site">
  <div>
    <a class="name" href="../index.html">${EMBLEM}${OWNER}</a>
    <a class="lnk" href="../index.html#letter">About</a>
    <a class="lnk" href="../index.html#work">Work</a>
    <a class="cta" href="mailto:${EMAIL}">Get in touch</a>
  </div>
</nav>

<header class="cs-hero">
  <div class="ribbon" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="cs-hero-in">
    <a class="cs-back" href="../index.html#work"><b>&lsaquo;</b> Selected work</a>

    <div class="cs-id">
      <span class="badge" style="--brand:${c.brand}">
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg>
      </span>
      <span class="cs-name">${esc(c.name)}</span>
      <span class="meta">${esc(c.tag)}</span>
    </div>

    <h1>${splitWords(c.title)}</h1>
    <p class="cs-tagline">${esc(c.tagline)}</p>

    <dl class="cs-meta">
      ${c.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n      ')}
    </dl>
  </div>
</header>

<main class="cs">${gated}
</main>

<nav class="cs-next" aria-label="More work">
  <a href="${prev.slug}.html" class="reveal"><span>Previous</span><b>${esc(prev.name)}</b></a>
  <a href="${next.slug}.html" class="reveal" style="--d:1"><span>Next</span><b>${esc(next.name)}</b></a>
</nav>

${footer('..')}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": ${JSON.stringify(strip(c.title))},
      "description": ${JSON.stringify(desc)},
      "url": "${url}",
      "inLanguage": "en-GB",
      "image": "${SITE}/assets/og.jpg",
      "author": { "@type": "Person", "name": "${OWNER}", "url": "${SITE}/" },
      "publisher": { "@type": "Person", "name": "${OWNER}", "url": "${SITE}/" },
      "about": ${JSON.stringify(c.name)},
      "isPartOf": { "@type": "WebSite", "url": "${SITE}/", "name": "${OWNER}" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "${OWNER}", "item": "${SITE}/" },
        { "@type": "ListItem", "position": 2, "name": "Selected work", "item": "${SITE}/#work" },
        { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(c.name)}, "item": "${url}" }
      ]
    }
  ]
}
</script>
</body>
</html>
`;
}

/* ---------- shared footer ------------------------------------------- */
function footer(base) {
  return `<footer>
  <div class="foot-top">
    <svg class="emblem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true">
      <path d="M8.6 2.2H15.4L21.8 8.6V15.4L15.4 21.8H8.6L2.2 15.4V8.6Z"/>
    </svg>
    <p class="wordset">${splitWords('Good products come<br>from good questions')}</p>
  </div>

  <div class="foot-mid">
    <div class="rule-dots" aria-hidden="true"></div>
    <p class="reveal">In London, and open to product and design work in domains that look too complicated from the outside. Email is quickest.</p>
    <a class="btn light reveal" style="--d:1" href="mailto:${EMAIL}">${MAIL_ICON}${EMAIL}</a>
  </div>

  <div class="wordmark" aria-hidden="true">${OWNER}</div>

  <div class="foot-links">
    <a href="${LINKEDIN}" target="_blank" rel="noopener">linkedin</a>
    <a href="${base}/index.html">home</a>
    <!-- absolute: the retired portfolio is a sibling of the domain root, not
         of whichever page is linking to it -->
    <a href="/os/">os</a>
    <a href="mailto:${EMAIL}">email</a>
    <span>&copy; ${OWNER.toLowerCase()} · 2026</span>
  </div>
</footer>`;
}

/* ---------- write everything ---------------------------------------- */
for (let i = 0; i < CASES.length; i++) {
  const c = CASES[i];
  writeFileSync(join(ROOT, 'work', `${c.slug}.html`),
    casePage(c, CASES[(i - 1 + CASES.length) % CASES.length], CASES[(i + 1) % CASES.length]));
}

/* index.html stays hand-authored; only the marked blocks are generated, so the
   origin and the case-study copy still live in exactly one place. */
const INDEX_TITLE = `${OWNER} — Product Manager & Senior Designer`;
const INDEX_DESC = `${TAGLINE} Placement platforms, redemption at national scale, telematics, and the dashboards a £3B business ran on.`;

const indexHead = `<title>${esc(INDEX_TITLE)}</title>
<meta name="description" content="${esc(INDEX_DESC)}">
${meta({ url: `${SITE}/`, title: INDEX_TITLE, desc: INDEX_DESC, type: 'profile' })}

<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<style>${CSS.home}</style>
<link rel="preload" as="style" href="assets/rest.css" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="assets/rest.css"></noscript>
<script defer src="assets/app.js"></script>`;

const indexJsonLd = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "${SITE}/#luka",
      "name": "${OWNER}",
      "jobTitle": "Product Manager and Senior Product Designer",
      "email": "mailto:${EMAIL}",
      "url": "${SITE}/",
      "address": { "@type": "PostalAddress", "addressLocality": "London", "addressCountry": "GB" },
      "knowsAbout": ["Product management", "Product design", "Design systems", "Insurance technology", "Telematics", "Data visualisation"],
      "sameAs": ["${LINKEDIN}"]
    },
    {
      "@type": "WebSite",
      "@id": "${SITE}/#site",
      "url": "${SITE}/",
      "name": "${OWNER}",
      "inLanguage": "en-GB",
      "publisher": { "@id": "${SITE}/#luka" }
    },
    {
      "@type": "ProfilePage",
      "url": "${SITE}/",
      "name": ${JSON.stringify(INDEX_TITLE)},
      "isPartOf": { "@id": "${SITE}/#site" },
      "mainEntity": { "@id": "${SITE}/#luka" },
      "hasPart": [
${CASES.map((c) => `        { "@type": "CreativeWork", "name": ${JSON.stringify(c.name)}, "url": "${SITE}/work/${c.slug}.html" }`).join(',\n')}
      ]
    }
  ]
}
</script>`;

const between = (src, name, body) => {
  const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
  if (!re.test(src)) throw new Error(`index.html is missing the build:${name} markers`);
  return src.replace(re, `$1\n${body}\n$2`);
};

let index = readFileSync(join(ROOT, 'index.html'), 'utf8');
index = between(index, 'head', indexHead);
index = between(index, 'cards', CASES.map(card).join('\n'));
index = between(index, 'footer', footer('.'));
index = between(index, 'jsonld', indexJsonLd);
writeFileSync(join(ROOT, 'index.html'), index);

writeFileSync(join(ROOT, 'assets', 'rest.css'),
  `/* GENERATED by build/build.mjs from style.css — do not edit.\n   Everything not needed to paint above the fold. */\n${CSS.rest}\n`);

/* the first-flight budget: everything up to the end of the hero markup */
assertBudget('index.html', index.slice(0, index.indexOf('<!-- --------------------------- letter')));
for (const c of CASES) {
  const page = readFileSync(join(ROOT, 'work', `${c.slug}.html`), 'utf8');
  assertBudget(`work/${c.slug}.html`, page.slice(0, page.indexOf('</header>') + 9));
}

writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[{ loc: `${SITE}/`, p: '1.0' }, ...CASES.map((c) => ({ loc: `${SITE}/work/${c.slug}.html`, p: '0.8' }))]
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${u.p}</priority>\n  </url>`)
    .join('\n')}
</urlset>
`);

writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`built ${CASES.length} case pages, index.html, sitemap.xml, robots.txt`);
