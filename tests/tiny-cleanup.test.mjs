import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, advance } from "../games/tiny-cleanup/logic.js";

test("three levels advance without a failure state", () => {
  assert.deepEqual(
    LEVELS.map((level) => level.id),
    ["leaves", "paper", "toys"],
  );
  let state = { levelIndex: 0, hits: 0, complete: false };
  for (let index = 0; index < LEVELS[0].targetCount; index += 1) {
    state = advance(state, true);
  }
  assert.deepEqual(state, { levelIndex: 1, hits: 0, complete: false });
});

test("the final level marks the game complete", () => {
  let state = {
    levelIndex: LEVELS.length - 1,
    hits: LEVELS.at(-1).targetCount - 1,
    complete: false,
  };
  state = advance(state, true);
  assert.equal(state.complete, true);
});
