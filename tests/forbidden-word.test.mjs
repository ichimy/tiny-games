import assert from "node:assert/strict";
import test from "node:test";
import {
  CARDS,
  applyTurn,
  createGame,
  nextTeam,
} from "../games/forbidden-word/logic.js";

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
