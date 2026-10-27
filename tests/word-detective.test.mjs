import assert from "node:assert/strict";
import test from "node:test";
import {
  applyGuess,
  isLost,
  isWin,
  scoreGuess,
} from "../games/word-detective/logic.js";

test("duplicate letters are scored only as many times as they occur", () => {
  assert.deepEqual(
    scoreGuess("APPLE", "PIPER"),
    ["present", "absent", "correct", "present", "absent"],
  );
});

test("six completed guesses lose when none matches", () => {
  let state = { answer: "CRANE", guesses: [], current: "" };
  for (const guess of ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "ZZZZZ"]) {
    state = applyGuess(state, guess);
  }
  assert.equal(isLost(state), true);
  assert.equal(isWin(state), false);
});
