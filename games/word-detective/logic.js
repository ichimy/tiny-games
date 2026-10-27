export function scoreGuess(answer, guess) {
  const normalizedAnswer = String(answer).toUpperCase();
  const normalizedGuess = String(guess).toUpperCase();
  const result = Array(normalizedGuess.length).fill("absent");
  const remaining = [...normalizedAnswer];

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (normalizedGuess[index] === normalizedAnswer[index]) {
      result[index] = "correct";
      remaining[index] = null;
    }
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (result[index] !== "absent") continue;
    const found = remaining.indexOf(normalizedGuess[index]);
    if (found >= 0) {
      result[index] = "present";
      remaining[found] = null;
    }
  }

  return result;
}

export function applyGuess(state, guess) {
  const normalized = String(guess).toUpperCase();
  if (
    state.guesses.length >= 6 ||
    normalized.length !== state.answer.length
  ) {
    return { ...state };
  }
  return {
    ...state,
    guesses: [...state.guesses, normalized],
    current: "",
  };
}

export const isWin = (state) =>
  state.guesses.at(-1) === state.answer.toUpperCase();

export const isLost = (state) =>
  state.guesses.length >= 6 && !isWin(state);
