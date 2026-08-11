# LukaOS

> **This repository now serves two sites.** `meetluka.com/` is the current
> portfolio, a dependency-free static site in [`site/`](site/). This OS-style
> portfolio has been retired to `meetluka.com/os/` — it still builds and
> deploys from here, but it is `noindex` and is no longer the front door.
> See [`site/README.md`](site/README.md) for how the two are assembled.

[![Live Site](https://img.shields.io/badge/live-meetluka.com-red?style=flat-square)](https://meetluka.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

A portfolio disguised as an operating system. React + TypeScript + Tailwind, with the window-management metaphors of macOS and a minimal, single-accent aesthetic inspired by Nothing.

**Live:** [meetluka.com](https://meetluka.com)

## Why an OS?

Every portfolio looks the same, and doing something different usually means worse UX. The desktop OS is a metaphor visitors already know how to use — windows, a dock, search — so the site can be unconventional without being confusing.

## Features

**Desktop shell**
- Full window manager: drag, 8-direction resize, minimize, maximize, edge-snap tiling with preview, z-order focus
- Dock with running indicators and live hover previews; Spotlight search (`⌘ Space`); app switcher (`⌘ Tab`); notification centre
- Draggable desktop icons with grid snapping and persisted positions
- Hash-based deep links (`#/about`, `#/notes`, `#/case-study/insyt`) with per-route titles and meta descriptions
- Light/dark theme, UI sound effects (Web Audio), and a reduce-motion setting — all persisted

**Mobile**
- iOS-style bottom tab bar (About, Terminal, LinkedIn, Email) instead of the dock
- Bottom-sheet app drawer with the full catalogue

**Apps**
| App | What it does |
|-----|--------------|
| About / Case studies | Slide-based presentation viewer (one case study is NDA-locked) |
| Notes | MDX essays compiled at build time from `src/content/notes/` |
| Terminal | Virtual file system, command history, tab completion, and a rate-limited AI assistant |
| Finder | Icon / list / gallery views over everything on the site |
| Mail | Composer that hands off to the visitor's mail client |
| System Preferences | Theme, sound, reduce motion |

**Engineering**
- Lazy-loaded app chunks; the Gemini SDK only downloads on first use
- PWA with offline caching
- Accessibility: ARIA roles throughout, keyboard navigation, skip link, `prefers-reduced-motion`
- Unit tests (Vitest) and an end-to-end suite (Playwright, desktop + mobile projects) that gates every deploy

## Project structure

```
├── App.tsx                  # Shell: window state, menu bar, desktop, routing glue
├── constants.tsx            # All content: desktop items, dock items, case studies
├── types.ts                 # Shared types (DesktopItem, WindowState, FileType, …)
├── components/
│   ├── window/WindowFrame.tsx   # Window chrome: drag, resize, snap, animations
│   ├── content/                 # One component per app (Terminal, Finder, Notes, …)
│   ├── layout/                  # AppSwitcher, NotificationCenter
│   ├── widgets/                 # Clock, Weather, GitHub graph
│   ├── Dock.tsx · MobileTabBar.tsx · MobileAppDrawer.tsx
│   └── Spotlight.tsx · ContextMenu.tsx · DesktopIcon.tsx · …
├── hooks/                   # useHashRouter, useContent, useFunMessage
├── contexts/                # AdminContext (content editor gate)
├── utils/                   # sound, storage, fileTypeMeta
├── services/geminiService.ts # Gemini API wrapper (lazy-loaded)
├── src/
│   ├── content/notes/       # Blog posts as MDX with frontmatter
│   ├── constants/layout.ts  # Menu bar / dock dimensions, snap threshold
│   └── styles/globals.css   # Fonts, animations, scrollbars
└── e2e/                     # Playwright suite (desktop-shell, apps, mobile)
```

Window state lives in `App.tsx` and flows down to `WindowFrame`, which owns pointer interactions and animations. Content is data-driven: each `DesktopItem` has a `FileType` that selects its renderer.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | |
|--------|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (+ PWA assets) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright end-to-end suite (starts the dev server itself) |
| `npm run typecheck` | `tsc --noEmit` |

**AI features:** set the `API_KEY` environment variable (read at build time by `services/geminiService.ts`). Never commit keys. Note that any key bundled into a static site is visible to visitors — use a restricted, quota-capped key, or proxy requests through a backend.

## Deployment

Pushes to `main` run typecheck → unit tests → Playwright e2e → build, then deploy to GitHub Pages (`.github/workflows/deploy.yml`). Custom domain via `public/CNAME`.

## Easter eggs

Konami code (`↑↑↓↓←→←→BA`), clock click-cycling (binary → hex → coffee), dock long-press wobble, and a terminal worth `ls`-ing around — try `sudo hire luka`.

## Author

**Luka Dadiani** — Product Manager & Senior Designer, London
[LinkedIn](https://www.linkedin.com/in/luka-dadiani-3293a915) · [GitHub](https://github.com/lukataylo) · [X](https://x.com/lukadadiani)
