import assert from "node:assert/strict";
import test from "node:test";
import { WORDS, buildWordQueue, finishRound } from "../games/say-it/logic.js";

test("word queue is shuffled without mutating the source", () => {
  const source = [{ text: "熊猫" }, { text: "火箭" }];
  const queue = buildWordQueue(source, () => 0);
  assert.notEqual(queue, source);
  assert.equal(source.length, 2);
  assert.deepEqual(
    queue.map((word) => word.text).sort(),
    ["火箭", "熊猫"].sort(),
  );
});

test("round score rewards correct answers more than skips", () => {
  assert.deepEqual(finishRound(3, 2), { score: 8, correct: 3, skipped: 2 });
  assert.ok(WORDS.length >= 30);
});
