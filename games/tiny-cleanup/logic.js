export const LEVELS = [
  { id: "leaves", title: "收落叶", verb: "点掉落叶", targetCount: 8, emoji: "🍂" },
  { id: "paper", title: "扫纸团", verb: "戳破纸团", targetCount: 10, emoji: "🧻" },
  { id: "toys", title: "收玩具", verb: "送回玩具", targetCount: 8, emoji: "🧸" },
];

export function advance(state, tappedTarget) {
  if (!tappedTarget || state.complete) return { ...state };
  const hits = state.hits + 1;
  if (hits < LEVELS[state.levelIndex].targetCount) {
    return { ...state, hits };
  }
  if (state.levelIndex < LEVELS.length - 1) {
    return { levelIndex: state.levelIndex + 1, hits: 0, complete: false };
  }
  return { ...state, hits, complete: true };
}
