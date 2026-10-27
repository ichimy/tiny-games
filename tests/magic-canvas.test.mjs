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
