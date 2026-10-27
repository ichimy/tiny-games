# 🎈 Tiny Games for Tiny Humans

> Free browser-based touch games for tiny humans. No ads. No tracking. No accounts.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![Works offline](https://img.shields.io/badge/works-offline-blue)

---

## What is this?

A growing collection of tiny, self-contained browser games for toddlers and
families. Each game lives in its own folder with zero runtime dependencies —
no frameworks, no build step, no tracking scripts, no accounts. Just open and
play.

The games are designed to be:

- **Touch-first** — large tap targets, responsive to little fingers
- **Visually bold** — bright saturated colours, chunky shapes, emoji-driven
- **Sound-enabled** — all audio generated via the Web Audio API (no audio files)
- **Instant** — no loading screens, no sign-ups, no pop-ups
- **Offline-capable** — works after the page has loaded, no internet needed

---

## 🕹️ Games

| Game                | Status  | Description                                 |
| ------------------- | ------- | ------------------------------------------- |
| 🎈 **气球迷宫** | ✅ Live | Tap colourful floating balloons to pop them |
| 🎨 **手指涂鸦** | ✅ Live | Finger-paint with bright colours |
| 🔨 **想戳就戳** | ✅ Live | Every touch makes something surprising |
| 🌈 **彩虹分类** | ✅ Live | Sort colourful blobs into matching buckets |
| ⭐ **接住星星** | ✅ Live | Touch falling stars before they disappear |
| 🎵 **小小音乐家** | ✅ Live | Build a tiny song from colourful buttons |
| 🦄 **独角兽飞行** | ✅ Live | Fly through the clouds and collect stars |
| 🃏 **谁藏起来了** | ✅ Live | Find matching pairs in an animal memory game |
| ✨ **彩色魔法笔** | ✅ Live | Tap and drag to create floating shapes |
| 🧹 **小小清理队** | ✅ Live | Complete three gentle cleanup levels |
| 🗣️ **你说我猜** | ✅ Live | Give clues and guess before time runs out |
| 🎭 **不能说** | ✅ Live | Describe answers without saying forbidden words |
| 🔎 **猜词小侦探** | ✅ Live | Find the hidden English word in six tries |

---

## 🗂️ Project structure

```
tiny-games/
├── index.html              # Landing page
├── games/
│   ├── registry.js         # Shared hub + offline game catalog
│   ├── balloon-pop/        # Original games
│   ├── say-it/             # Adapted family games
│   └── ...
├── tests/                  # Node contract tests
├── scripts/                # Catalog validation
├── THIRD_PARTY_NOTICES.md
└── README.md
```

Each game is fully self-contained in its own directory. Runtime files stay
local; Node.js is only used for tests and catalog validation.

---

## 🚀 Getting started

No build tools. No npm install. No config.

```bash
git clone https://github.com/rvgpl/tiny-games.git
cd tiny-games
open index.html
# or double-click index.html in your file explorer
```

## 📲 Installable / offline (PWA)

The site is a Progressive Web App — it can be added to a home screen and played
with no connection at all.

| File            | Job                                                          |
| --------------- | ------------------------------------------------------------ |
| `manifest.json` | App name, icons, `standalone` display, home-screen shortcuts |
| `sw.js`         | Precache the whole site, then serve it cache-first           |
| `pwa.js`        | Registers the service worker from every page                 |

On the first visit the service worker reads `games/registry.js` and stores every
declared game asset, so the hub and all 13 games keep working offline afterwards.
Bump `CACHE_VERSION` in `sw.js` whenever the catalog or a cached asset changes.

The service worker needs a real origin, so it activates on a hosted copy (or
`localhost`) but not over `file://`. The games themselves still run from a
double-clicked file — they just can't install or precache that way.

---

## 🏗️ How games are built

Every game follows the same rules:

- **Simple HTML file** — CSS, JS, and markup in their own files.
- **No external dependencies** — no CDN links, no audio files
- **Web Audio API** — all sounds synthesised in code
- **CSS/SVG/emoji only** — no external images
- **Self-hosted fonts** — Fredoka One and Nunito live in `assets/fonts/`
- **Touch + click** — works on mobile Safari, Chrome, and desktop
- **No reading required** — fully visual and audio feedback

## 🎨 Landing page

`index.html` is the main hub. It's built with:

- **CSS `@layer`** — `reset → tokens → base → layout → components → animations → utilities`
- **CSS custom properties** — full design token system for colours, spacing, typography, shadows, and per-card accents
- **Keyboard navigation** — skip link, `:focus-visible` ring, for interactive vs static cards
- **Accessibility** — `aria-label`, `aria-hidden` on decorations, `role="list"`, `.sr-only`, `prefers-reduced-motion` support
- **Full meta tags** — Open Graph, Twitter Card, canonical URL, theme-color
- **Self-hosted webfonts** — no Google Fonts request, so the hub loads the same everywhere

## 📄 Licence

MIT — do whatever you like with it. See [LICENSE](LICENSE) for details.
Adapted games retain their own upstream MIT licenses and pinned revisions; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 🧪 Development checks

```bash
npm test
npm run validate:catalog
```

To add a game: create its folder, add metadata and runtime files to
`games/registry.js`, include `UPSTREAM.md` and `LICENSE` when adapting upstream
code, bump `CACHE_VERSION`, then run both checks above.

---

Made with 💛 by [Ravigopal Kesari](https://www.ravigopal.com) for the little ones.
