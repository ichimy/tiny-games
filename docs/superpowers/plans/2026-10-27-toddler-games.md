# Tiny Games Toddler Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three first-class toddler games: memory matching, shape painting, and a three-level cleanup game.

**Architecture:** Each game has a pure-logic module tested by Node and a self-contained HTML/CSS/JS shell. The browser layer renders state and handles touch; logic owns deck building, shape generation, and progression.

**Tech Stack:** Static HTML, CSS, ES modules, Canvas/CSS animations, Web Audio API, Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-game-library-expansion-design.md`

## Global Constraints

- No CDN, remote fonts, remote audio, analytics, accounts, or runtime dependencies.
- Primary controls are at least 64 px; toddler games have no fail timer.
- Support touch, click, keyboard, visible focus, and `prefers-reduced-motion`.
- Each game owns its files under `games/<id>/` and has `LICENSE` plus `UPSTREAM.md`.
- Update `games/registry.js` and bump `CACHE_VERSION` for every game.

---

### Task 1: 谁藏起来了 (`memory-match`)

**Files:**
- Create: `games/memory-match/{logic.js,memory-match.js,index.html,memory-match.css,UPSTREAM.md,LICENSE}`
- Create: `tests/memory-match.test.mjs`
- Modify: `games/registry.js`, `sw.js`

**Interfaces:**
- `createDeck(items, pairCount = 8, random = Math.random)` returns 16 `Card` objects.
- `cardsMatch(a, b)` returns `a.pairId === b.pairId`.
- `isSolved(cards)` returns true only when every card is matched.

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { cardsMatch, createDeck, isSolved } from "../games/memory-match/logic.js";

const items = Array.from({ length: 12 }, (_, index) => ({
  id: `item-${index}`, label: `Item ${index}`, emoji: "🐾",
}));

test("createDeck creates one pair per selected item", () => {
  const deck = createDeck(items, 8, () => 0.25);
  assert.equal(deck.length, 16);
  for (const item of items.slice(0, 8)) {
    assert.equal(deck.filter((card) => card.pairId === item.id).length, 2);
  }
});

test("matching and solved state follow card data", () => {
  const deck = createDeck(items, 2, () => 0.5);
  assert.equal(cardsMatch(deck[0], deck.find((card) => card.pairId === deck[0].pairId && card.uid !== deck[0].uid)), true);
  deck.forEach((card) => { card.matched = true; });
  assert.equal(isSolved(deck), true);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/memory-match.test.mjs`

Expected: FAIL because `logic.js` is missing.

- [ ] **Step 3: Implement the logic**

```js
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createDeck(items, pairCount = 8, random = Math.random) {
  return shuffle(shuffle(items, random).slice(0, pairCount).flatMap((item) =>
    [0, 1].map((side) => ({
      uid: `${item.id}-${side}`, pairId: item.id, label: item.label,
      emoji: item.emoji, matched: false,
    }))), random);
}

export const cardsMatch = (a, b) => Boolean(a && b && a.pairId === b.pairId);
export const isSolved = (cards) => cards.length > 0 && cards.every((card) => card.matched);
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/memory-match.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the game UI**

Create a Chinese page titled “谁藏起来了” with a back link, restart button, responsive 4-column board, and celebration panel. Render a 12-item deck (8 active pairs). Each card is a `button` with minimum 88 px height; show `?` until opened, keep matches visible, flip mismatches back after 650 ms, and disable input while two cards are resolving. Use Web Audio oscillator blips and silently skip audio when unavailable.

- [ ] **Step 6: Add provenance and catalog metadata**

Use upstream `jasonkryst/ThePlayground`, commit `acd4febdf8e2ad7c6a6a59663f8a03ba29ef0f23`, MIT, copyright Jason Kryst. Record that the upstream memory-loop concept was adapted while UI, Chinese labels, emoji set, and vanilla code are Tiny Games originals. Add registry entry `memory-match`, category `toddler`, and bump the service-worker cache.

- [ ] **Step 7: Verify and commit**

```bash
node --test tests/memory-match.test.mjs
npm test
npm run validate:catalog
git add games/memory-match tests/memory-match.test.mjs games/registry.js sw.js
git commit -m "feat: add toddler memory game"
```

Playtest one full round at 390×844, including mismatch, match, restart, keyboard focus, audio unavailable fallback, and zero network requests.

### Task 2: 彩色魔法笔 (`magic-canvas`)

**Files:**
- Create: `games/magic-canvas/{logic.js,magic-canvas.js,index.html,magic-canvas.css,UPSTREAM.md,LICENSE}`
- Create: `tests/magic-canvas.test.mjs`
- Modify: `games/registry.js`, `sw.js`

**Interfaces:**
- `createSpark({ x, y }, random = Math.random)` returns `{ x, y, size, rotation, color, glyph, driftX, driftY }`.
- `pickShapeGlyphs(count, random = Math.random)` returns a string array of the requested length.

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createSpark, pickShapeGlyphs } from "../games/magic-canvas/logic.js";

test("spark stays at the pointer and uses bounded visuals", () => {
  const spark = createSpark({ x: 120, y: 240 }, () => 0.5);
  assert.equal(spark.x, 120);
  assert.equal(spark.y, 240);
  assert.ok(spark.size >= 36 && spark.size <= 96);
  assert.ok(spark.glyph.length > 0);
});

test("glyph helper returns the requested count", () => {
  assert.equal(pickShapeGlyphs(6, () => 0.25).length, 6);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/magic-canvas.test.mjs`

Expected: FAIL because `logic.js` is missing.

- [ ] **Step 3: Implement the generator**

```js
const GLYPHS = ["●", "★", "♥", "✦", "◆", "☁"];
const COLORS = ["#ff5e7e", "#ffb703", "#58c7a4", "#4d96ff", "#c77dff"];
const pick = (values, random) => values[Math.floor(random() * values.length)];

export const pickShapeGlyphs = (count, random = Math.random) =>
  Array.from({ length: count }, () => pick(GLYPHS, random));

export function createSpark({ x, y }, random = Math.random) {
  return {
    x, y, size: 36 + Math.floor(random() * 61),
    rotation: Math.floor(random() * 360), color: pick(COLORS, random),
    glyph: pick(GLYPHS, random), driftX: -40 + Math.floor(random() * 81),
    driftY: -80 - Math.floor(random() * 61),
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/magic-canvas.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the canvas interaction**

Create a full-screen paper-canvas page with a back link and a large “全部清空” button. Use Pointer Events to spawn sparks on tap and on pointer movement spaced at least 18 px. Keyboard Enter or Space spawns a spark in the center. Each spark animates upward with its own color, rotation, and drift; users can clear all nodes instantly. Apply `touch-action: none`, safe-area padding, and disable drift under reduced motion.

- [ ] **Step 6: Add provenance and catalog metadata**

Use upstream `khafidhteer/kids-games-jtr-lab`, commit `e20affb05cda8b5455b7a50dded8566ddf68b6dd`, MIT, copyright khafidhteer. State that only the shape-spawning concept was adapted; all runtime code and visuals are standalone. Add registry entry `magic-canvas`, category `toddler`, and bump cache version.

- [ ] **Step 7: Verify and commit**

```bash
node --test tests/magic-canvas.test.mjs
npm test
npm run validate:catalog
git add games/magic-canvas tests/magic-canvas.test.mjs games/registry.js sw.js
git commit -m "feat: add magic canvas toddler game"
```

Playtest tap, drag, keyboard, clear, mobile height, and zero network requests.

### Task 3: 小小清理队 (`tiny-cleanup`)

**Files:**
- Create: `games/tiny-cleanup/{logic.js,tiny-cleanup.js,index.html,tiny-cleanup.css,UPSTREAM.md,LICENSE}`
- Create: `tests/tiny-cleanup.test.mjs`
- Modify: `games/registry.js`, `sw.js`

**Interfaces:**
- `LEVELS` contains `leaves`, `paper`, `toys`.
- `advance(state, tappedTarget)` returns `{ levelIndex, hits, complete }`.

- [ ] **Step 1: Write the failing progression test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, advance } from "../games/tiny-cleanup/logic.js";

test("three levels advance without a failure state", () => {
  assert.deepEqual(LEVELS.map((level) => level.id), ["leaves", "paper", "toys"]);
  let state = { levelIndex: 0, hits: 0, complete: false };
  for (let i = 0; i < LEVELS[0].targetCount; i += 1) state = advance(state, true);
  assert.deepEqual(state, { levelIndex: 1, hits: 0, complete: false });
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/tiny-cleanup.test.mjs`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement progression**

```js
export const LEVELS = [
  { id: "leaves", title: "收落叶", targetCount: 8, emoji: "🍂" },
  { id: "paper", title: "扫纸团", targetCount: 10, emoji: "🧻" },
  { id: "toys", title: "收玩具", targetCount: 8, emoji: "🧸" },
];

export function advance(state, tappedTarget) {
  if (!tappedTarget || state.complete) return { ...state };
  const hits = state.hits + 1;
  if (hits < LEVELS[state.levelIndex].targetCount) return { ...state, hits };
  if (state.levelIndex < LEVELS.length - 1) {
    return { levelIndex: state.levelIndex + 1, hits: 0, complete: false };
  }
  return { ...state, hits, complete: true };
}
```

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/tiny-cleanup.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the three tap-only scenes**

Create one responsive playfield with a level title, visible progress dots, and a restart button. Spawn 3–5 large target buttons at non-overlapping random positions; each level uses a different pastel background and emoji family. Tapping removes the target, updates `aria-live`, and spawns another until the level target is reached. Final completion shows a celebration and restart. There is no timer or loss state.

- [ ] **Step 6: Add provenance and catalog metadata**

Use upstream `justinsoderstrom/mini-games`, commit `fa53575a62ded424c786e09dd1ad8dad91d58423`, MIT, copyright Justin Soderstrom. Record that mower, vacuum, and leaves concepts informed the three-level cleanup flow; all shipped code and visuals are standalone Tiny Games work. Add registry entry, category `toddler`, and bump cache version.

- [ ] **Step 7: Verify and commit**

```bash
node --test tests/tiny-cleanup.test.mjs
npm test
npm run validate:catalog
git add games/tiny-cleanup tests/tiny-cleanup.test.mjs games/registry.js sw.js
git commit -m "feat: add toddler cleanup game"
```

Playtest all three levels at mobile and desktop sizes and complete them offline.

## Pack Completion Gate

The catalog contains ten games, all three toddler games load without external requests, all tests pass, and the hub displays them under “幼儿玩”.
