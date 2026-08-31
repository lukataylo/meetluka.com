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
| `assets/hiw.css` `assets/hiw.js` | The "show how I work" desktop shell. Fetched on hover at the earliest, never on load |
| `assets/hiw-app-*.js` | Desktop apps, one plugin per file |
| `assets/hiw-*.js` | **Generated** desktop content, one file per case study |
| `build/how-i-work.mjs` | The desktop copy. Edit here |
| `assets/wallpaper.jpg` | Desktop wallpaper (Unsplash License) |
| `assets/shots/` | Product screenshots the Figma canvas shows. Derivatives — the full-resolution masters stay in the private repo |

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
| `index.html` | 11.5KB — 79% of the window |
| a case study | 6.1KB — 42% |

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

## Show how I work

The xTrade case study carries a button in its hero that opens a mock macOS
desktop over the page. It is a working day, not a screenshot:

| | |
| --- | --- |
| **Figma** | The case study's own artboards — real screenshots of the live site. Pan, ⌘-scroll zoom, click a frame or a layer row to select it |
| **Google Chrome** | Tabs in the title bar, where Chrome puts them. Azure DevOps: the Sprint 41 board with capacity and blockers, and work item 48244 open on the thread where the call gets made |
| **Outlook** | Command bar, Focused/Other pivot, four customer and stakeholder threads, each with the reply that was sent. Delete, Archive, Move, Flag and Reply all work |
| **Microsoft Teams** | Every channel and chat is live: developer questions answered, user tests requested, and the 1:1 that runs a Belgrade contractor team. Plus Activity, a week Calendar and Files |
| **Notes** | The broker session the argument came out of, and a decision log |
| **Terminal** | A Claude Code session that replays itself |
| **Finder · Trash · System Settings · About This Mac** | In the dock, not on the desktop. Toy apps, and the only place the thing is allowed to be funny |

The menu bar works — Apple menu, per-app menus, Wi-Fi, battery, Spotlight,
Control Centre and the clock all open. Notifications arrive while you are in
there, and clicking one takes you to what it is about.

The case study says what shipped. This shows the working: a prioritisation call
made in a ticket thread, a handoff defect owned rather than defended, a
contractor's public holiday changing the sprint commitment. That is the part a
write-up cannot carry.

Every word of it is fiction written for this purpose. The hint line says so;
keep it there.

### It is behind the NDA gate

xTrade is gated, so its desktop is too. The desktop opens on a macOS lock screen
on the same passphrase and the same `sessionStorage` key as the page's own gate,
so unlocking either unlocks both. Like that gate it is obscurity, not security —
the content is in the payload either way.

**The passphrase is still the placeholder.** `node build/build.mjs` warns about
it on every run. Change `locked` in `build/content.mjs` before this goes live.

### It costs nothing until it is asked for

The desktop is ~78KB gzipped of code and content plus ~610KB of images. That is
far more than the case study it sits on, so **none of it is fetched until
someone presses the button**:

| | |
| --- | --- |
| in the page | the button, and its rules in the `case` bucket |
| on hover or focus | `hiw.css` and `hiw-xtrade.js` start downloading |
| on click | `hiw.js` runs, then the app plugins, then the desktop opens |
| once open | the wallpaper fades in on decode; artboards are `loading="lazy"` |

First paint is unchanged at 41% of the budget. A plugin that fails to load costs
its app, not the desktop.

### Apps are plugins

`hiw.js` is the shell — window manager, dock, menu bar, notifications. Apps
register themselves:

```js
HowIWork.register('settings', {
  name: 'System Settings', short: 'Settings',
  menus: ['File', 'Edit', 'View', 'Window', 'Help'],
  bg: '…', glyph: '<svg …>',        // its dock icon
  render(data, win, ui) { return ui.el('div.hiw-body', …); },
});
```

`ui` is a deliberately small kit: `el()`, `svg()`, `inline()`, `clamp()`,
`ICONS`, and `ui.style(id, css)` which injects a stylesheet once — so a plugin
is one self-contained file. `win` carries `setTitle`, `onFirstShow`, `onResize`,
`onClose` and a `timers` array that the shell clears on close. A registration
overrides a built-in of the same id, which is how Outlook was replaced without
touching the shell.

Add a plugin to `PLUGINS` in `case.js` and an entry to `apps` in
`build/how-i-work.mjs`. `boot: false` puts an app in the dock without opening it.

One sharp edge: `ui.el()` flattens arrays and skips nullish children, but native
`replaceChildren` does neither. Route repaints through `el()` rather than
passing it a `.map()` result directly.

### The performance rules still apply

The desktop covers the page, but a covered animation is not a stopped one — the
ribbon and the polygon field are blur stacks that re-rasterise every frame
whether or not anyone can see them. Opening the desktop sets `data-hiw` on the
root, which parks them through the same rule scrolling uses.

Inside the desktop:

- **Chrome is translucent, content is opaque.** Menu bar, dock, title bars and
  sidebars are `backdrop-filter`; window bodies are not. Both what macOS does
  and the only affordable version of it.
- **The glass comes off during a drag.** Moving a window is the one moment when
  something moves behind every blurred surface at once, so `--glass` switches to
  `none` for the length of the gesture.
- **Drag, resize and canvas pan write geometry straight to the element.** One
  style write per pointer event, no state to reconcile.
- **Dock magnification is a transform per icon**, off one rAF-throttled
  `pointermove`.
- **Windows are not promoted at rest.** `will-change` is added for the open,
  minimise and drag transitions and removed after, per rule 5 above.
- **Panes collapse rather than crush.** Each window body is a CSS container; a
  narrow window drops its sidebar instead of squeezing the note to one word a
  line.
- **The button reset is `:where()`-wrapped.** `.hiw button` at (0,1,1) beat every
  single-class rule and silently flattened every list row built as a button.
  Zero-specificity resets, or components cannot style themselves.

### The screenshots on the Figma canvas

`assets/shots/*.jpg` are captured from the running site with Playwright, which
is installed outside the repo — the project still has zero dependencies. Serve
the site, drive it at `deviceScaleFactor: 2` with `reducedMotion: 'reduce'`,
screenshot each `.cs-block`, then `sips -Z 720`. Frame dimensions in
`build/how-i-work.mjs` carry each image's aspect ratio, so the canvas reserves
the right box before an image arrives.

### Adding a second desktop

Add an entry to `DESKTOPS` in `build/how-i-work.mjs` keyed by the case-study
slug and re-run the build. `apps` says which windows exist, their menu-bar
titles and where each opens as a fraction of the desktop; the rest is one key
per app. Inside document and note text, `[[wrapped text]]` renders as a
highlight and as bold respectively. `chromeTabs: true` lets an app claim the
window's title bar for its own tab strip.

### Known gaps

- No focus trap. Escape, the dock's Back item and the traffic lights all close
  it and focus returns to the button, but Tab can still reach the page behind.
- Artboards are positioned in absolute pixels, generated from the real image
  dimensions. Recapturing means re-running the layout script.
- The content is fictional, including every name in it.

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

Preview tiles are drawn in CSS (`.mock-*`), so the case-study cards need no
image assets; each case declares its two tiles in the `shots` field of
`build/content.mjs`. Swap a `<figure class="shot">` for a real screenshot when
you have one — keep the top-anchored `figcaption`, since the card deliberately
clips the tile's bottom edge.
