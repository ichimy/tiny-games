import { cardsMatch, createDeck, isSolved } from "./logic.js";

const ITEMS = [
  ["熊猫", "🐼"],
  ["狮子", "🦁"],
  ["青蛙", "🐸"],
  ["小鱼", "🐟"],
  ["火箭", "🚀"],
  ["苹果", "🍎"],
  ["星星", "⭐"],
  ["小车", "🚗"],
  ["云朵", "☁️"],
  ["花朵", "🌻"],
  ["蛋糕", "🍰"],
  ["气球", "🎈"],
].map(([label, emoji]) => ({ id: label, label, emoji }));

const board = document.getElementById("board");
const status = document.getElementById("status");
const win = document.getElementById("win");
let deck = createDeck(ITEMS);
let first = null;
let second = null;
let locked = false;
let audioContext = null;

function beep(kind) {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ||= new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = kind === "match" ? 720 : 280;
    gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.16);
  } catch {
    // Audio is decorative; some browsers require a gesture first.
  }
}

function render() {
  board.replaceChildren(
    ...deck.map((card) => {
      const button = document.createElement("button");
      const revealed = card.matched || card === first || card === second;
      button.type = "button";
      button.className = `card${revealed ? " is-open" : ""}${card.matched ? " is-matched" : ""}`;
      button.dataset.uid = card.uid;
      button.textContent = revealed ? card.emoji : "?";
      button.setAttribute("aria-label", revealed ? card.label : "未翻开的卡片");
      button.setAttribute("aria-pressed", String(revealed));
      button.addEventListener("click", () => choose(card));
      return button;
    }),
  );
  const matchedPairs = deck.filter((card) => card.matched).length / 2;
  status.textContent = `找到 ${matchedPairs} / ${deck.length / 2} 对`;
  win.hidden = !isSolved(deck);
}

function choose(card) {
  if (locked || card.matched || card === first) return;
  if (!first) {
    first = card;
    render();
    return;
  }
  if (card === first) return;
  second = card;
  render();

  if (cardsMatch(first, second)) {
    first.matched = true;
    second.matched = true;
    first = null;
    second = null;
    beep("match");
    render();
    return;
  }

  locked = true;
  window.setTimeout(() => {
    first = null;
    second = null;
    locked = false;
    beep("miss");
    render();
  }, 650);
}

function restart() {
  deck = createDeck(ITEMS);
  first = null;
  second = null;
  locked = false;
  render();
}

document.getElementById("restart").addEventListener("click", restart);
document.getElementById("playAgain").addEventListener("click", restart);
render();
