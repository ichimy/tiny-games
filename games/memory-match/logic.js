export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createDeck(items, pairCount = 8, random = Math.random) {
  const selected = shuffle(items, random).slice(0, pairCount);
  return shuffle(
    selected.flatMap((item) =>
      [0, 1].map((side) => ({
        uid: `${item.id}-${side}`,
        pairId: item.id,
        label: item.label,
        emoji: item.emoji,
        matched: false,
      })),
    ),
    random,
  );
}

export const cardsMatch = (a, b) => Boolean(a && b && a.pairId === b.pairId);

export const isSolved = (cards) =>
  cards.length > 0 && cards.every((card) => card.matched);
