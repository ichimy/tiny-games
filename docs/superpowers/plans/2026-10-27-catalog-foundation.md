# Tiny Games Catalog Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hard-coded hub data with a tested runtime catalog that drives the home page, category filters, offline precache, and third-party provenance.

**Architecture:** `games/registry.js` assigns a metadata array to `globalThis.TINY_GAMES_CATALOG`, making the same file consumable by the window, tests, and service worker. The hub renders from that array, while `sw.js` imports it and precaches every declared game file.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js built-in test runner, Service Worker Cache API.

**Spec:** `docs/superpowers/specs/2026-10-27-game-library-expansion-design.md`

## Global Constraints

- Keep the site framework-free and runnable without an install or runtime build.
- Keep the promise: no ads, no tracking, no accounts, no third-party runtime requests.
- Preserve relative deployment paths for `tiny-games.chimy.cn` and sub-path hosting.
- Preserve the existing root MIT license and add per-game third-party notices.
- Bump `CACHE_VERSION` whenever the registry or precached assets change.
- Existing uncommitted work belongs to the user; stage only files created or modified for the current task.

---

### Task 1: Catalog Contract and Existing Game Entries

**Files:**
- Create: `package.json`
- Create: `games/registry.js`
- Create: `tests/catalog.test.mjs`
- Create: `scripts/validate-catalog.mjs`

**Interfaces:**
- Produces: `globalThis.TINY_GAMES_CATALOG: GameEntry[]`
- Produces: `GameEntry` fields `id`, `title`, `subtitle`, `description`, `category`, `emoji`, `path`, `tags`, `players`, `featured`, `source`, `files`
- Produces: `npm test` and `npm run validate:catalog`

- [ ] **Step 1: Create the Node test harness and failing catalog contract test**

Create `package.json`:

```json
{
  "name": "tiny-games",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "validate:catalog": "node scripts/validate-catalog.mjs"
  }
}
```

Create `tests/catalog.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import "../games/registry.js";

const catalog = globalThis.TINY_GAMES_CATALOG;

test("catalog defines the seven existing playable games", () => {
  assert.deepEqual(
    catalog.map((game) => game.id),
    [
      "balloon-pop",
      "paint-splat",
      "do-anything",
      "rainbow-sort",
      "star-catcher",
      "music-maker",
      "unicorn-fly",
    ],
  );
});

test("catalog categories and ids are valid and unique", () => {
  const ids = catalog.map((game) => game.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const game of catalog) {
    assert.ok(["toddler", "family"].includes(game.category));
    assert.match(game.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(game.path, `./games/${game.id}/`);
  }
});
```

- [ ] **Step 2: Run the test and verify the missing registry failure**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `games/registry.js`.

- [ ] **Step 3: Create the initial registry**

Create `games/registry.js` with all seven entries. Each entry follows this exact shape:

```js
globalThis.TINY_GAMES_CATALOG = [
  {
    id: "balloon-pop",
    title: "气球迷宫",
    subtitle: "Balloon Pop",
    description: "戳破飘来飘去的气球",
    category: "toddler",
    emoji: "🎈",
    path: "./games/balloon-pop/",
    tags: ["触屏", "因果反馈"],
    players: "1 人",
    featured: true,
    source: { type: "original", license: "MIT" },
    files: [
      "./games/balloon-pop/",
      "./games/balloon-pop/index.html",
      "./games/balloon-pop/balloon-pop.css",
      "./games/balloon-pop/balloon-pop.compat.css",
      "./games/balloon-pop/balloon-pop.js",
      "./games/balloon-pop/og-image.png",
    ],
  },
];
```

Add equivalent entries for Paint Splat, Do Anything, Rainbow Sort, Star Catcher, Music Maker, and Unicorn Fly. Use each directory's actual runtime files. Mark Unicorn Fly as `featured: true`; the other entries use `featured: false` unless their existing card should remain featured.

- [ ] **Step 4: Add the file-existence validator**

Create `scripts/validate-catalog.mjs`:

```js
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "../games/registry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = globalThis.TINY_GAMES_CATALOG;
assert.ok(Array.isArray(catalog) && catalog.length > 0, "catalog must be non-empty");

for (const game of catalog) {
  assert.ok(game.id && game.title && game.description, `invalid entry: ${game.id}`);
  assert.ok(game.files.includes(game.path), `${game.id} must precache its directory`);
  for (const url of game.files) {
    const relative = url.replace(/^\.\//, "").replace(/\/$/, "");
    const target = path.join(root, relative);
    await access(target);
  }
}

console.log(`Validated ${catalog.length} games.`);
```

- [ ] **Step 5: Run catalog tests and validator**

Run: `npm test`

Expected: PASS for both catalog tests.

Run: `npm run validate:catalog`

Expected: PASS and print `Validated 7 games.`

- [ ] **Step 6: Commit the catalog contract**

```bash
git add package.json games/registry.js tests/catalog.test.mjs scripts/validate-catalog.mjs
git commit -m "feat: add tiny games catalog"
```

### Task 2: Registry-Driven Home Page and Category Filters

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `styles.compat.css`

**Interfaces:**
- Consumes: `globalThis.TINY_GAMES_CATALOG`
- Produces: DOM containers `#gameCatalog`, `#gameCount`
- Produces: buttons `[data-category="all|toddler|family"]`

- [ ] **Step 1: Add a failing static hub contract test**

Add to `tests/catalog.test.mjs`:

```js
import { readFile } from "node:fs/promises";

test("hub loads the registry and exposes category filters", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /games\/registry\.js/);
  assert.match(html, /id="gameCatalog"/);
  assert.match(html, /data-category="toddler"/);
  assert.match(html, /data-category="family"/);
});
```

Run: `npm test`

Expected: FAIL because the hub still contains hard-coded cards.

- [ ] **Step 2: Replace the static game grid with a registry mount**

In `index.html`, load `games/registry.js` before `script.js`, replace the game-card block with:

```html
<div class="catalog-filters" role="group" aria-label="游戏分类">
  <button class="catalog-filter is-active" data-category="all" aria-pressed="true">
    全部 <span id="gameCount"></span>
  </button>
  <button class="catalog-filter" data-category="toddler" aria-pressed="false">幼儿玩</button>
  <button class="catalog-filter" data-category="family" aria-pressed="false">全家玩</button>
</div>
<div class="game-grid" id="gameCatalog" role="list"></div>
<noscript>
  <p>请启用 JavaScript，或直接打开 <a href="./games/balloon-pop/">Balloon Pop</a>。</p>
</noscript>
```

- [ ] **Step 3: Render cards and filters in `script.js`**

Append this behavior after the decorative background setup:

```js
const catalog = globalThis.TINY_GAMES_CATALOG || [];
const catalogRoot = document.getElementById("gameCatalog");
const gameCount = document.getElementById("gameCount");
const filterButtons = [...document.querySelectorAll("[data-category]")];
let activeCategory = "all";

function cardFor(game) {
  const link = document.createElement("a");
  link.className = "game-card";
  link.href = game.path;
  link.setAttribute("role", "listitem");
  link.setAttribute("aria-label", `${game.title}，${game.description}`);
  link.innerHTML = `
    <div class="card-thumb card-thumb-${game.id}">
      <span class="thumb-emoji" aria-hidden="true">${game.emoji}</span>
    </div>
    <div class="card-body">
      <div class="card-tag">${game.category === "family" ? "全家玩" : "幼儿玩"}</div>
      <h3 class="card-name">${game.title}</h3>
      <p class="card-en">${game.subtitle}</p>
      <p class="card-desc">${game.description}</p>
      <div class="card-meta">
        <span>${game.players}</span>
        <span class="play-label">${game.source.type === "original" ? "Tiny Games 原创" : "开源改编"} ▶</span>
      </div>
    </div>`;
  return link;
}

function renderCatalog() {
  const games = catalog.filter(
    (game) => activeCategory === "all" || game.category === activeCategory,
  );
  catalogRoot.replaceChildren(...games.map(cardFor));
  gameCount.textContent = String(catalog.length);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderCatalog();
  });
});

renderCatalog();
```

- [ ] **Step 4: Add filter and card styles**

Add to both `styles.css` and `styles.compat.css`:

```css
.catalog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: center;
  margin: 0 auto var(--space-8);
}

.catalog-filter {
  min-height: 48px;
  padding: 10px 20px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-display);
  font-weight: 800;
}

.catalog-filter.is-active {
  background: var(--color-yellow);
  box-shadow: var(--shadow-sm);
}

.card-en {
  margin: -4px 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-muted);
}
```

- [ ] **Step 5: Verify hub contract and responsive rendering**

Run: `npm test`

Expected: PASS.

Open `index.html` through a local server and verify category buttons switch between 7 cards, all and each category have at least one game, and 390 px width has no horizontal scroll.

- [ ] **Step 6: Commit the hub**

```bash
git add index.html script.js styles.css styles.compat.css tests/catalog.test.mjs
git commit -m "feat: render home page from game catalog"
```

### Task 3: Catalog-Driven Offline Cache

**Files:**
- Modify: `sw.js`
- Modify: `tests/catalog.test.mjs`

**Interfaces:**
- Consumes: `globalThis.TINY_GAMES_CATALOG`
- Produces: `PRECACHE_URLS` containing every unique catalog file and app-shell asset

- [ ] **Step 1: Add failing cache contract tests**

Append:

```js
test("service worker uses registry to derive every game entry", async () => {
  const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(sw, /importScripts\("\.\/games\/registry\.js"\)/);
  assert.match(sw, /CACHE_VERSION\s*=\s*"v2"/);
  assert.match(sw, /TINY_GAMES_CATALOG\.flatMap\(\(game\) => game\.files\)/);
});
```

Run: `npm test`

Expected: FAIL because `sw.js` still has a hand-written v1 list.

- [ ] **Step 2: Import the registry and derive the precache list**

Replace the hand-written game entries in `sw.js` with:

```js
importScripts("./games/registry.js");

const CACHE_VERSION = "v2";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles.compat.css",
  "./script.js",
  "./pwa.js",
  "./manifest.json",
  "./games/registry.js",
  "./assets/favicon.ico",
  "./assets/favicon-16x16.png",
  "./assets/favicon-32x32.png",
  "./assets/apple-touch-icon.png",
  "./assets/android-chrome-192x192.png",
  "./assets/android-chrome-512x512.png",
  "./assets/maskable-192x192.png",
  "./assets/maskable-512x512.png",
  "./assets/fonts/fonts.css",
  "./assets/fonts/fredoka-one-400.woff2",
  "./assets/fonts/nunito-variable.woff2",
  ...globalThis.TINY_GAMES_CATALOG.flatMap((game) => game.files),
].filter((url, index, all) => all.indexOf(url) === index);
```

- [ ] **Step 3: Verify the cache manifest**

Run: `npm test`

Expected: PASS.

Run: `npm run validate:catalog`

Expected: PASS and print `Validated 7 games.`

- [ ] **Step 4: Commit the offline catalog**

```bash
git add sw.js tests/catalog.test.mjs
git commit -m "feat: precache games from catalog"
```

### Task 4: Provenance and Expansion Documentation

**Files:**
- Create: `THIRD_PARTY_NOTICES.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: source metadata from each new game
- Produces: a single human-readable license inventory and catalog maintenance guide

- [ ] **Step 1: Write the third-party inventory**

Create `THIRD_PARTY_NOTICES.md` with a table containing these exact rows:

```markdown
| Game | Upstream | Commit | License | Reused |
|---|---|---|---|---|
| 谁藏起来了 | https://github.com/jasonkryst/ThePlayground | acd4febdf8e2ad7c6a6a59663f8a03ba29ef0f23 | MIT | Memory-game loop concepts and interaction patterns |
| 彩色魔法笔 | https://github.com/khafidhteer/kids-games-jtr-lab | e20affb05cda8b5455b7a50dded8566ddf68b6dd | MIT | Shape-spawning concept and interaction patterns |
| 小小清理队 | https://github.com/justinsoderstrom/mini-games | fa53575a62ded424c786e09dd1ad8dad91d58423 | MIT | Three toddler cleanup game concepts |
| 你说我猜 | https://github.com/karlromets/molu | ce52930a0d4880ce367c6d96e46f61f1860afcb4 | MIT | Turn-based clue-guessing loop |
| 不能说 | https://github.com/VittorioCodes/guesscue | 5861ecd747689a1b33f569977aa131d73cdaacb7 | MIT | Shared-device team and forbidden-word rules |
| 猜词小侦探 | https://github.com/flashsolver/hanlah | 0866ce481b67d85b951c02993ba01851ead72f8a | MIT | Letter-guessing interaction |
```

Add a statement that each game directory contains the applicable `LICENSE` and `UPSTREAM.md` before its code is imported.

- [ ] **Step 2: Update README counts and maintenance workflow**

Replace the stale “all seven games” and single-game structure claims with:

- Current count: 7 existing games after foundation work; this grows to 13 after the two game-pack plans.
- How to add a game: create its folder, add metadata to `games/registry.js`, list runtime files, include provenance files, bump `CACHE_VERSION`, run both validation commands, then browser-test offline behavior.
- The “no external dependency” rule applies to runtime; Node is only used for tests and catalog validation.

- [ ] **Step 3: Run documentation checks**

Run:

```bash
npm test
npm run validate:catalog
git diff --check
```

Expected: all commands PASS and no whitespace errors.

- [ ] **Step 4: Commit provenance docs**

```bash
git add THIRD_PARTY_NOTICES.md README.md
git commit -m "docs: document game provenance and catalog workflow"
```

## Plan Completion Gate

Run `npm test` and `npm run validate:catalog`; both must pass. Open the home page at mobile and desktop widths, verify category filters and all 7 existing links, then confirm the service worker reaches `activated` with `CACHE_VERSION = "v2"` before starting the toddler pack plan.
