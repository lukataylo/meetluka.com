# site — meetluka.com

The live portfolio, served at the root of **meetluka.com**: a prism-lit hero, a
sticky "letter" whose prose sharpens word by word as you scroll, and case-study
cards below it.

It ships from the same repository as the OS-style portfolio it replaced. The
Pages workflow builds that app into `dist/os` (see `base` in `vite.config.ts`)
and then copies this folder over the artifact root, so:

| URL | served from |
| --- | --- |
| `meetluka.com/` | `site/` |
| `meetluka.com/work/*.html` | `site/work/` |
| `meetluka.com/os/` | the retired app, built by Vite |

Two things exist purely for that migration and should not be deleted casually:

- **`site/sw.js`** is a kill switch. The retired app registered a Workbox
  service worker at `/sw.js` with scope `/`, and every returning visitor still
  has it — without this replacing it at the same URL, they would keep being
  served the old cached shell instead of this site.
- **the inline redirect at the top of `index.html`** forwards legacy
  `meetluka.com/#/case-study/…` deep links to `/os/`. Fragments never reach the
  server, so no redirect rule can do this job.

## Run it

No build step, no dependencies to install. Serve the folder:

```
python3 -m http.server 8899
# then open http://localhost:8899
```

Opening `index.html` directly from the filesystem also works.

## What's where

| File | Contains |
| --- | --- |
| `index.html` | The landing page: hero, letter, case-study cards |
| `work/*.html` | One page per case study — **generated, do not hand-edit** |
| `build/content.mjs` | The case-study copy. Edit here |
| `build/build.mjs` | The build: `node build/build.mjs` |
| `build/og.html` | Source for the social share image |
| `assets/style.css` | The authored stylesheet — annotated with `/* @c … */` markers |
| `assets/rest.css` | **Generated** below-the-fold CSS. Do not edit |
| `assets/app.js` | Landing-page scroll motion (3KB gzipped) |
| `assets/case.js` | Case-page scroll motion, plus the NDA gate (1.3KB gzipped) |

No frameworks and no animation library, and nothing blocks the first paint.
The landing page renders from a single 7.8KB response; a case study from 5.5KB.

## The build

`index.html` is hand-authored except for four generated blocks, marked in the
file:

```html
<!-- build:head -->    title, description, canonical, og/twitter, inline critical CSS
<!-- build:cards -->   the four case-study cards
<!-- build:footer -->  the footer, shared with the case pages
<!-- build:jsonld -->  structured data, parked at the end of the body
```

`node build/build.mjs` rewrites those in place, regenerates `work/*.html`, and
writes `sitemap.xml` and `robots.txt`. It is idempotent — run it as often as you
like.

**The origin, the owner's name, the email and the LinkedIn URL are declared once**,
at the top of `build/build.mjs`. Changing `SITE` and re-running is all that a move
to a different domain requires. Case-study copy lives once, in
`build/content.mjs`. Nothing is stated in two places, so nothing can drift.

## First render in one round trip

After the TCP/TLS handshake a server can send about **14.6KB** (ten packets)
before it has to wait for an acknowledgement. Everything needed to paint fits
inside that first flight, so the page renders in one round trip with no
second request in the way:

| | first-paint bytes, gzipped |
| --- | --- |
| `index.html` | 7.8KB — 54% of the window |
| a case study | 5.5KB — 38% |

Two things make that work. **The CSS is inlined**, so there is no
render-blocking request; and **byte order is deliberate** — the head and the
hero come first, while the JSON-LD, the case-study cards and the decorative
polygon SVG all sit after the fold-filling markup in the response.

### The `/* @c … */` markers

`style.css` is one authored file cut into four buckets by marker comments:

| bucket | goes where |
| --- | --- |
| `base` | inlined on every page — tokens, ribbon, island nav, shared atoms, reduced-motion |
| `home` | inlined on the landing page — shell, canvas, hero, letter, entrance |
| `case` | inlined on case studies — progress bar, `.cs-hero`, first `.cs-block`, the NDA gate |
| *(unmarked)* | `rest.css`, fetched at preload priority and applied on load |

Two rules matter if you touch this:

1. **Spans are emitted in file order, filtered by bucket — never grouped by
   bucket.** Grouping would hoist the reduced-motion block (authored last,
   bucket `base`) above the rules it exists to override.
2. **Section headings are not bucket boundaries.** `.badge` and `.meta` are
   authored among the card styles but paint in the case-study hero; the island
   nav is authored near the footer but is `position: fixed`. Getting either
   wrong ships a broken fold, so verify rather than reason about it.

`node build/build.mjs` asserts the first-paint budget on every page and fails
the build if one grows past the window.

## The shell: hero → letter

There is no separate letter section. `.shell` holds one sticky `.canvas` that
starts full-bleed as the hero and contracts into the rounded card, so the
gradient, the polygon field and the prism are the same elements throughout —
nothing cuts.

One rAF-throttled scroll listener drives both phases from `paint()` in `app.js`:

- **morph** (`mp`) animates the canvas inset and radius, recedes the hero layer
  and fades the prose in
- **letter** (`lp`) translates `.letter-flow` while each word sharpens as it
  crosses the reading line

Everything else is an IntersectionObserver adding `.in` to a `.reveal` element,
with the transition in CSS. That replaced GSAP, which was 115KB to do exactly
this.

Word offsets are measured once per layout, so the handler only writes styles.

Two copies of the prism ribbon sit in the canvas, at identical geometry. The one
behind the text draws the visible beam. The one in front uses
`mix-blend-mode: lighten`, which leaves the pale card alone but pushes the
near-black glyphs to the beam's colour — that is how words pick up the prism.

Tuning knobs, all in `measure()`:

- `startY` / `endY` — where the prose sits at the start and end of the scroll
- `line` — the height in the card at which a word becomes fully sharp
- `run` — the distance over which it softens below that line
- `morphD` — how much scroll the hero-to-card transformation takes

## Scroll performance

These backgrounds are large `filter: blur()` stacks, which browsers cannot
composite — anything that dirties their region re-rasterises the blur. Six
rules keep it smooth, and breaking any of them costs roughly half the frame
rate:

1. **Nothing animates on top of a blur during scroll.** The ambient loops pause
   via `[data-still]` while the page moves and resume 170ms after it stops.
2. **The polygon field rotates as one promoted container** (`.spin`), not as
   eight separately-animated rings.
3. **No `filter` in scroll reveals.** Transform and opacity only.
4. **`paint()` skips the morph writes when `mp` has not changed** — those set
   `top/left/right/bottom`, which is a layout of the whole canvas subtree.
5. **Entrance animations use `backwards`, never `both`.** A forwards fill keeps
   the element parked on the animation's compositing path long after it has
   finished; `backwards` supplies the pre-delay state and then lets go.
6. **The hero layer goes `visibility: hidden` once faded.** An `opacity: 0`
   layer is still a layer, and this one is a full viewport in size.

**The entrance duration sets LCP.** Chrome records the largest paint when the
headline's last word finishes animating, so the delays in the `entrance` block
of `style.css` are the largest-contentful-paint budget. They currently land it
at ~1.0s. Lengthening them pushes LCP out one-for-one.

## SEO

Every page carries a canonical URL, a unique title and description, Open Graph
and Twitter card tags, and JSON-LD — `Person` + `WebSite` + `ProfilePage` on the
landing page, `Article` + `BreadcrumbList` on each case study. `sitemap.xml` and
`robots.txt` are generated alongside the case pages so a new case study cannot
be added without also being submitted for crawling.

The share image is `assets/og.jpg` (1200×630). To change it, edit
`build/og.html` and screenshot it at exactly that size.

Note that the letter's prose is real text in the markup — the words are dimmed
with opacity, not hidden — so it is fully indexable. The xTrade detail is not:
it sits behind the gate and ships to crawlers as `hidden`, which is the point.

## Case studies

Four sub-pages under `work/`, generated from `build/content.mjs`. To change any
copy, edit that file and re-run:

```
node build/build.mjs
```

Adding a fifth case study means adding one entry to `CASES`. The generator
wires up its page, its card on the landing page, prev/next on its neighbours,
the JSON-LD and the sitemap.

xTrade carries `locked: 'Socrates14'`, which puts the detail behind a passphrase
prompt — the same client-side gate the existing site uses. It keeps the page
from being read at a glance; it is not a security control, and the text is still
in the HTML source. If that matters, cut the sections down instead of gating them.

Preview tiles are drawn in CSS (`.mock-*`) so the site ships with no image
assets; each case declares its two tiles in the `shots` field of
`build/content.mjs`. Swap a `<figure class="shot">` for a real screenshot when
you have one — keep the top-anchored `figcaption`, since the card deliberately
clips the tile.s bottom edge.
