# Tiny Games Family Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three local pass-and-play family games: charades, forbidden-word clues, and an English letter-guessing puzzle.

**Architecture:** Each game keeps deterministic round/scoring logic in a pure ES module tested by Node. HTML/CSS/JS owns presentation, timers, touch input, and synthesized audio. No server, account, network room, or personal identity storage is introduced.

**Tech Stack:** Static HTML, CSS, ES modules, Web Audio API, Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-game-library-expansion-design.md`

## Global Constraints

- Games support same-device turn-taking only; no network multiplayer.
- No child names or scores leave the current page unless the user explicitly keeps them in local storage.
- Primary controls are at least 48 px; scores never depend on color alone.
- Use original Chinese word/card data and no upstream trademark in the visible title.
- Preserve pinned upstream MIT text and a per-game `UPSTREAM.md`.
- Update `games/registry.js` and bump `CACHE_VERSION` for every game.

---

### Task 1: 你说我猜 (`say-it`)

**Files:**
- Create: `games/say-it/{logic.js,say-it.js,index.html,say-it.css,UPSTREAM.md,LICENSE}`
- Create: `tests/say-it.test.mjs`
- Modify: `games/registry.js`, `sw.js`

**Interfaces:**
- `buildWordQueue(words, random = Math.random)` returns a shuffled copy with no mutation.
- `finishRound(correct, skipped)` returns `{ score: correct * 2 + skipped, correct, skipped }`.
- `WORDS` is an array of `{ text, category }` Chinese prompt objects.

- [ ] **Step 1: Write the failing logic test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { WORDS, buildWordQueue, finishRound } from "../games/say-it/logic.js";

test("word queue is shuffled without mutating the source", () => {
  const source = [{ text: "熊猫" }, { text: "火箭" }];
  const queue = buildWordQueue(source, () => 0);
  assert.notEqual(queue, source);
  assert.equal(source.length, 2);
  assert.deepEqual(queue.map((word) => word.text).sort(), ["火箭", "熊猫"].sort());
});

test("round score rewards correct answers more than skips", () => {
  assert.deepEqual(finishRound(3, 2), { score: 8, correct: 3, skipped: 2 });
  assert.ok(WORDS.length >= 30);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/say-it.test.mjs`

Expected: FAIL because `logic.js` is missing.

- [ ] **Step 3: Implement shuffle, scoring, and original Chinese prompts**

```js
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const buildWordQueue = (words, random = Math.random) => shuffle(words, random);
export const finishRound = (correct, skipped) => ({
  score: correct * 2 + skipped, correct, skipped,
});
```

Create at least 30 family-friendly Chinese prompts across animals, food, actions, and household objects. Example entries: `{ text: "熊猫", category: "动物" }`, `{ text: "刷牙", category: "动作" }`, `{ text: "西瓜", category: "食物" }`.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/say-it.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the pass-and-play flow**

Implement these screens in one page:

1. Setup: category checkboxes, 60/90-second choices, and “开始游戏”.
2. Handoff: “把手机交给描述者” with a large “我准备好了”.
3. Play: prompt, timer, “猜中了”, and “跳过”.
4. Results: correct count, skipped count, score, and “再来一局”.

Use a single `setInterval` that stops on zero or page hide. Buttons must work with touch and keyboard. Do not use a negative “wrong” state; every submitted card either scores correctly or is skipped. Announce score and timer changes through `aria-live="polite"`.

- [ ] **Step 6: Add provenance and catalog metadata**

Use upstream `karlromets/molu`, commit `ce52930a0d4880ce367c6d96e46f61f1860afcb4`, MIT, copyright Karl Romet Somelar. State that the handoff/round concept is adapted and all shipped code, Chinese prompts, scoring, and visuals are Tiny Games originals. Add `say-it` registry entry, category `family`, and bump cache version.

- [ ] **Step 7: Verify and commit**

```bash
node --test tests/say-it.test.mjs
npm test
npm run validate:catalog
git add games/say-it tests/say-it.test.mjs games/registry.js sw.js
git commit -m "feat: add family charades game"
```

Play a full 60-second round on mobile, verify pause/hide behavior, and check that no name or score is sent over the network.

### Task 2: 不能说 (`forbidden-word`)

**Files:**
- Create: `games/forbidden-word/{logic.js,forbidden-word.js,index.html,forbidden-word.css,cards.js,UPSTREAM.md,LICENSE}`
- Create: `tests/forbidden-word.test.mjs`
- Modify: `games/registry.js`, `sw.js`

**Interfaces:**
- `applyTurn(state, action)` accepts `"correct" | "violation" | "skip"`.
- `nextTeam(teamIndex, teamCount)` returns the next zero-based team index.
- `createGame(teamNames, duration = 60)` returns `{ teams, activeTeam, timeLeft, round }`.
- `CARDS` contains at least 30 `{ answer, forbidden: string[] }` entries.

- [ ] **Step 1: Write the failing scoring test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { CARDS, applyTurn, createGame, nextTeam } from "../games/forbidden-word/logic.js";

test("correct, violation, and skip change score safely", () => {
  let game = createGame(["红队", "蓝队"]);
  game = applyTurn(game, "correct");
  assert.equal(game.teams[0].score, 1);
  game = applyTurn(game, "violation");
  assert.equal(game.teams[0].score, 0);
  game = applyTurn(game, "skip");
  assert.equal(game.teams[0].score, 0);
  assert.ok(CARDS.length >= 30);
});

test("nextTeam wraps in both directions", () => {
  assert.equal(nextTeam(1, 2), 0);
  assert.equal(nextTeam(0, 2), 1);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/forbidden-word.test.mjs`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement scoring and next-team rules**

```js
export const nextTeam = (teamIndex, teamCount) => (teamIndex + 1) % teamCount;

export function createGame(teamNames, duration = 60) {
  return {
    teams: teamNames.map((name) => ({ name, score: 0 })),
    activeTeam: 0, timeLeft: duration, round: 1,
  };
}

export function applyTurn(state, action) {
  const teams = state.teams.map((team, index) => ({
    ...team,
    score: index === state.activeTeam
      ? Math.max(0, team.score + (action === "correct" ? 1 : action === "violation" ? -1 : 0))
      : team.score,
  }));
  return { ...state, teams };
}
```

Create at least 30 original Chinese cards. Each card has one answer and three forbidden words, for example `{ answer: "熊猫", forbidden: ["黑白", "竹子", "中国"] }`.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/forbidden-word.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the same-device team game**

Implement setup for exactly two teams, default names “红队 / 蓝队”, and timer selection 60/90 seconds. Each turn begins with a handoff screen, then shows an answer and its three visibly labeled forbidden words. “猜对” adds one, “违规” removes one without going below zero, and “跳过” changes neither score. After each action draw the next card. When time expires, show both scores and switch the active team; provide a new-match button.

- [ ] **Step 6: Add provenance and catalog metadata**

Use upstream `VittorioCodes/guesscue`, commit `5861ecd747689a1b33f569977aa131d73cdaacb7`, MIT, copyright Vittorio Kun. Record that same-device team scoring and forbidden-word rules were adapted; all shipped code, Chinese cards, and visuals are original. Add registry entry, category `family`, and bump cache version.

- [ ] **Step 7: Verify and commit**

```bash
node --test tests/forbidden-word.test.mjs
npm test
npm run validate:catalog
git add games/forbidden-word tests/forbidden-word.test.mjs games/registry.js sw.js
git commit -m "feat: add forbidden word family game"
```

Play two full turns on mobile and verify score clamping, timer expiry, handoff privacy, and no network requests.

### Task 3: 猜词小侦探 (`word-detective`)

**Files:**
- Create: `games/word-detective/{logic.js,word-detective.js,index.html,word-detective.css,words.js,UPSTREAM.md,LICENSE}`
- Create: `tests/word-detective.test.mjs`
- Modify: `games/registry.js`, `sw.js`

**Interfaces:**
- `scoreGuess(answer, guess)` returns an array of `"correct" | "present" | "absent"`.
- `applyGuess(state, guess)` returns a new state and never mutates input.
- `isWin(state)` and `isLost(state)` return booleans.
- `WORDS` is grouped by lengths 3, 4, and 5.

- [ ] **Step 1: Write the failing word-state test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { applyGuess, isLost, isWin, scoreGuess } from "../games/word-detective/logic.js";

test("duplicate letters are scored only as many times as they occur", () => {
  assert.deepEqual(scoreGuess("APPLE", "PIPER"), ["present", "absent", "correct", "present", "absent"]);
});

test("six completed guesses lose when none matches", () => {
  let state = { answer: "CRANE", guesses: [], current: "" };
  for (const guess of ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "ZZZZZ"]) {
    state = applyGuess(state, guess);
  }
  assert.equal(isLost(state), true);
  assert.equal(isWin(state), false);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/word-detective.test.mjs`

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement Wordle-style scoring**

```js
export function scoreGuess(answer, guess) {
  const result = Array(guess.length).fill("absent");
  const remaining = [...answer];
  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }
  for (let i = 0; i < guess.length; i += 1) {
    if (result[i] !== "absent") continue;
    const found = remaining.indexOf(guess[i]);
    if (found >= 0) {
      result[i] = "present";
      remaining[found] = null;
    }
  }
  return result;
}

export function applyGuess(state, guess) {
  if (state.guesses.length >= 6 || guess.length !== state.answer.length) return { ...state };
  return { ...state, guesses: [...state.guesses, guess], current: "" };
}

export const isWin = (state) => state.guesses.at(-1) === state.answer;
export const isLost = (state) => state.guesses.length >= 6 && !isWin(state);
```

Create curated uppercase English word lists for three-, four-, and five-letter modes.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/word-detective.test.mjs`

Expected: PASS.

- [ ] **Step 5: Build the Chinese game interface**

Create a mode picker, six-row board, on-screen A–Z keyboard, and physical keyboard support. Each tile shows its letter plus an inline symbol for correct (`✓`), present (`•`), or absent (`×`), so feedback is not color-only. Validate word length, prevent duplicate guesses, and show win/loss with “再猜一次”. Use CSS only and no external font.

- [ ] **Step 6: Add provenance and catalog metadata**

Use upstream `flashsolver/hanlah`, commit `0866ce481b67d85b951c02993ba01851ead72f8a`, MIT, copyright Karim. Record that the letter-guessing interaction was adapted; the Chinese interface, scoring module, visual shell, and selected word data are original. Add registry entry, category `family`, and bump cache version.

- [ ] **Step 7: Verify and commit**

```bash
node --test tests/word-detective.test.mjs
npm test
npm run validate:catalog
git add games/word-detective tests/word-detective.test.mjs games/registry.js sw.js
git commit -m "feat: add family word detective game"
```

Play a win and a loss at 390×844 and desktop width, using both physical and on-screen keyboards.

## Pack Completion Gate

All three family games appear under “全家玩”, complete a full local round without console errors, make zero network requests, and preserve the upstream notices listed in `THIRD_PARTY_NOTICES.md`.
