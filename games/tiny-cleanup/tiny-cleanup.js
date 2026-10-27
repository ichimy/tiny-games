import { LEVELS, advance } from "./logic.js";

const scene = document.getElementById("scene");
const levelTitle = document.getElementById("levelTitle");
const levelVerb = document.getElementById("levelVerb");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const finish = document.getElementById("finish");

const SLOTS = [
  [8, 10],
  [37, 6],
  [67, 14],
  [15, 38],
  [48, 34],
  [73, 45],
  [7, 66],
  [39, 66],
  [68, 72],
];

let state = { levelIndex: 0, hits: 0, complete: false };
let audioContext = null;

function playPop() {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ||= new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 460 + Math.random() * 260;
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch {
    // Visual feedback is enough when audio is unavailable.
  }
}

function addTargets(level) {
  const variants = {
    leaves: ["🍂", "🍁", "🍃"],
    paper: ["🧻", "📄", "🗞️"],
    toys: ["🧸", "🚗", "🪀", "🧩"],
  }[level.id];
  const shuffledSlots = [...SLOTS].sort(() => Math.random() - 0.5).slice(0, 4);
  shuffledSlots.forEach(([left, top], index) => {
    const target = document.createElement("button");
    target.type = "button";
    target.className = "target";
    target.style.left = `${left}%`;
    target.style.top = `${top}%`;
    target.style.setProperty("--tilt", `${-12 + Math.random() * 24}deg`);
    target.style.setProperty("--delay", `${index * 70}ms`);
    target.textContent = variants[index % variants.length];
    target.setAttribute("aria-label", `清理${variants[index % variants.length]}`);
    target.addEventListener("click", () => tapTarget(target));
    scene.append(target);
  });
}

function renderLevel() {
  const level = LEVELS[state.levelIndex];
  levelTitle.textContent = level.title;
  levelVerb.textContent = level.verb;
  scene.dataset.level = level.id;
  scene.replaceChildren();
  finish.hidden = !state.complete;
  if (!state.complete) addTargets(level);
  updateProgress();
}

function updateProgress() {
  const level = LEVELS[state.levelIndex];
  const pct = Math.min(100, Math.round((state.hits / level.targetCount) * 100));
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `${Math.min(state.hits, level.targetCount)} / ${level.targetCount}`;
}

function tapTarget(target) {
  target.classList.add("is-gone");
  target.disabled = true;
  playPop();
  const previousLevel = state.levelIndex;
  state = advance(state, true);
  window.setTimeout(() => {
    target.remove();
    if (state.complete) {
      renderLevel();
      return;
    }
    if (state.levelIndex !== previousLevel) {
      renderLevel();
      return;
    }
    updateProgress();
    if (scene.querySelectorAll(".target:not(.is-gone)").length === 0) {
      addTargets(LEVELS[state.levelIndex]);
    }
  }, 180);
}

function restart() {
  state = { levelIndex: 0, hits: 0, complete: false };
  renderLevel();
}

document.getElementById("restart").addEventListener("click", restart);
document.getElementById("playAgain").addEventListener("click", restart);
renderLevel();
