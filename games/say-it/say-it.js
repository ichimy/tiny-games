import { WORDS, buildWordQueue, finishRound } from "./logic.js";

const setup = document.getElementById("setup");
const handoff = document.getElementById("handoff");
const play = document.getElementById("play");
const results = document.getElementById("results");
const timerEl = document.getElementById("timer");
const wordEl = document.getElementById("word");
const wordCategory = document.getElementById("wordCategory");

let selectedWords = [];
let queue = [];
let queueIndex = 0;
let duration = 60;
let timeLeft = 60;
let correct = 0;
let skipped = 0;
let interval = null;
let running = false;

function showPanel(panel) {
  [setup, handoff, play, results].forEach((item) => {
    item.hidden = item !== panel;
  });
}

function selectedCategories() {
  return [...document.querySelectorAll("#categories input:checked")].map(
    (input) => input.value,
  );
}

function nextWord() {
  if (queueIndex >= queue.length) {
    queue = buildWordQueue(selectedWords);
    queueIndex = 0;
  }
  const current = queue[queueIndex];
  queueIndex += 1;
  wordEl.textContent = current.text;
  wordCategory.textContent = current.category;
}

function updateTimer() {
  timerEl.textContent = String(Math.max(0, timeLeft));
}

function stopTimer() {
  window.clearInterval(interval);
  interval = null;
  running = false;
}

function finish() {
  stopTimer();
  const result = finishRound(correct, skipped);
  document.getElementById("score").textContent = String(result.score);
  document.getElementById("correctCount").textContent = String(result.correct);
  document.getElementById("skipCount").textContent = String(result.skipped);
  showPanel(results);
}

function startTimer() {
  if (interval) return;
  running = true;
  interval = window.setInterval(() => {
    timeLeft -= 1;
    updateTimer();
    if (timeLeft <= 0) finish();
  }, 1000);
}

function nextTurn(delta) {
  if (!running) return;
  if (delta === "correct") correct += 1;
  if (delta === "skip") skipped += 1;
  nextWord();
}

document.getElementById("start").addEventListener("click", () => {
  const categories = new Set(selectedCategories());
  selectedWords = WORDS.filter((word) => categories.has(word.category));
  if (selectedWords.length === 0) {
    document.getElementById("setupStatus").textContent = "至少选择一个词库。";
    return;
  }
  document.getElementById("setupStatus").textContent = "";
  const selectedDuration = document.querySelector('input[name="duration"]:checked');
  duration = Number(selectedDuration?.value || 60);
  timeLeft = duration;
  correct = 0;
  skipped = 0;
  queue = buildWordQueue(selectedWords);
  queueIndex = 0;
  updateTimer();
  showPanel(handoff);
});

document.getElementById("ready").addEventListener("click", () => {
  play.hidden = false;
  setup.hidden = true;
  handoff.hidden = true;
  results.hidden = true;
  nextWord();
  startTimer();
});

document.getElementById("correct").addEventListener("click", () => nextTurn("correct"));
document.getElementById("skip").addEventListener("click", () => nextTurn("skip"));
document.getElementById("again").addEventListener("click", () => {
  stopTimer();
  showPanel(setup);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopTimer();
  } else if (!play.hidden && timeLeft > 0) {
    startTimer();
  }
});

document.addEventListener("keydown", (event) => {
  if (handoff.hidden || play.hidden) return;
  if (event.key === "ArrowRight") nextTurn("correct");
  if (event.key === "ArrowLeft") nextTurn("skip");
});
