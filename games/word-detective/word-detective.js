import { applyGuess, isLost, isWin, scoreGuess } from "./logic.js";
import { WORDS } from "./words.js";

const setup = document.getElementById("setup");
const gamePanel = document.getElementById("game");
const result = document.getElementById("result");
const board = document.getElementById("board");
const message = document.getElementById("message");
const keyboard = document.getElementById("keyboard");

let wordLength = 3;
let state = null;

function showPanel(panel) {
  [setup, gamePanel, result].forEach((item) => {
    item.hidden = item !== panel;
  });
}

function randomWord(length) {
  const options = WORDS[length];
  return options[Math.floor(Math.random() * options.length)];
}

function typeLetter(letter) {
  if (!state || isWin(state) || isLost(state)) return;
  if (state.current.length >= state.answer.length) return;
  state = { ...state, current: state.current + letter };
  message.textContent = "按回车提交";
  render();
}

function backspace() {
  if (!state || !state.current) return;
  state = { ...state, current: state.current.slice(0, -1) };
  render();
}

function submit() {
  if (!state || state.current.length !== state.answer.length) {
    message.textContent = `请输入 ${state?.answer.length || wordLength} 个字母`;
    return;
  }
  state = applyGuess(state, state.current);
  if (isWin(state)) {
    showResult(true);
    return;
  }
  if (isLost(state)) {
    showResult(false);
    return;
  }
  message.textContent = "继续试试看";
  render();
}

function showResult(won) {
  document.getElementById("resultEmoji").textContent = won ? "🎉" : "🕵️";
  document.getElementById("resultTitle").textContent = won ? "猜中了！" : "差一点点";
  document.getElementById("resultAnswer").textContent = `答案是 ${state.answer}`;
  showPanel(result);
}

function renderRow(letters, rowIndex) {
  const row = document.createElement("div");
  row.className = "row";
  const guess = state.guesses[rowIndex];
  const statuses = guess ? scoreGuess(state.answer, guess) : [];

  for (let index = 0; index < state.answer.length; index += 1) {
    const tile = document.createElement("span");
    const letter = guess?.[index] || letters[index] || "";
    const status = statuses[index];
    tile.className = `tile${status ? ` is-${status}` : ""}`;
    tile.textContent = letter;
    if (status) {
      tile.dataset.symbol = status === "correct" ? "✓" : status === "present" ? "•" : "×";
      tile.setAttribute(
        "aria-label",
        `${letter}，${status === "correct" ? "位置正确" : status === "present" ? "字母存在但位置不对" : "字母不存在"}`,
      );
    }
    row.append(tile);
  }
  return row;
}

function render() {
  const activeRow = state.guesses.length;
  const currentLetters = activeRow < 6 ? [...state.current] : [];
  const rows = Array.from({ length: 6 }, (_, index) =>
    renderRow(index === activeRow ? currentLetters : [], index),
  );
  board.replaceChildren(...rows);
  const activeRowElement = rows[Math.min(activeRow, rows.length - 1)];
  const activeRowBottom =
    activeRowElement.offsetTop + activeRowElement.offsetHeight;
  if (activeRowBottom > board.scrollTop + board.clientHeight) {
    board.scrollTop = activeRowBottom - board.clientHeight + 4;
  }
  document.getElementById("attempt").textContent = `第 ${Math.min(activeRow + 1, 6)} / 6 次`;

  const used = new Set(
    state.guesses.flatMap((guess) => scoreGuess(state.answer, guess).map((status, index) => ({
      letter: guess[index],
      status,
    }))).sort((a, b) => {
      const rank = { absent: 1, present: 2, correct: 3 };
      return rank[a.status] - rank[b.status];
    }).map((item) => `${item.letter}:${item.status}`),
  );
  const best = new Map();
  for (const entry of used) {
    const [letter, status] = entry.split(":");
    best.set(letter, status);
  }
  keyboard.querySelectorAll("button[data-letter]").forEach((button) => {
    button.dataset.status = best.get(button.dataset.letter) || "";
  });
}

function start(length = wordLength) {
  wordLength = Number(length);
  state = { answer: randomWord(wordLength), guesses: [], current: "" };
  message.textContent = `输入一个 ${wordLength} 字母单词`;
  render();
  showPanel(gamePanel);
}

const keys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
keyboard.append(
  ...keys.map((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.letter = letter;
    button.textContent = letter;
    button.addEventListener("click", () => typeLetter(letter));
    return button;
  }),
);

const controlRow = document.createElement("div");
controlRow.className = "control-row";
const back = document.createElement("button");
back.type = "button";
back.textContent = "删除";
back.addEventListener("click", backspace);
const enter = document.createElement("button");
enter.type = "button";
enter.className = "enter";
enter.textContent = "提交";
enter.addEventListener("click", submit);
controlRow.append(back, enter);
keyboard.append(controlRow);

document.getElementById("start").addEventListener("click", () => {
  const selected = document.querySelector('input[name="length"]:checked');
  start(Number(selected?.value || 3));
});
document.getElementById("newGame").addEventListener("click", () => start());
document.getElementById("again").addEventListener("click", () => start());

document.addEventListener("keydown", (event) => {
  if (gamePanel.hidden) return;
  if (event.key === "Enter") submit();
  else if (event.key === "Backspace") backspace();
  else if (/^[a-zA-Z]$/.test(event.key)) typeLetter(event.key.toUpperCase());
});
