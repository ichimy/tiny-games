import assert from "node:assert/strict";
import test from "node:test";
import { cardsMatch, createDeck, isSolved } from "../games/memory-match/logic.js";

const items = Array.from({ length: 12 }, (_, index) => ({
  id: `item-${index}`,
  label: `Item ${index}`,
  emoji: "🐾",
}));

test("createDeck creates exactly one pair per selected item", () => {
  const deck = createDeck(items, 8, () => 0.25);
  assert.equal(deck.length, 16);
  const pairIds = new Set(deck.map((card) => card.pairId));
  assert.equal(pairIds.size, 8);
  for (const pairId of pairIds) {
    assert.equal(deck.filter((card) => card.pairId === pairId).length, 2);
  }
});

test("matching and solved state follow card data", () => {
  const deck = createDeck(items, 2, () => 0.5);
  assert.equal(
    cardsMatch(
      deck[0],
      deck.find((card) => card.pairId === deck[0].pairId && card.uid !== deck[0].uid),
    ),
    true,
  );
  assert.equal(
    cardsMatch(deck[0], deck.find((card) => card.pairId !== deck[0].pairId)),
    false,
  );
  deck.forEach((card) => {
    card.matched = true;
  });
  assert.equal(isSolved(deck), true);
});
