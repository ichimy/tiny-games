import { createSpark, pickShapeGlyphs } from "./logic.js";

const canvas = document.getElementById("canvas");
const hint = document.getElementById("hint");
const clear = document.getElementById("clear");
let lastPoint = null;
let audioContext = null;

function playPop() {
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    audioContext ||= new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(420 + Math.random() * 320, audioContext.currentTime);
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch {
    // Visual feedback remains available when audio is blocked.
  }
}

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
  };
}

function paint(point) {
  if (
    lastPoint &&
    Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < 18
  ) {
    return;
  }
  lastPoint = point;
  hint.hidden = true;
  const spark = createSpark(point);
  const node = document.createElement("span");
  node.className = "spark";
  node.textContent = spark.glyph;
  node.setAttribute("aria-hidden", "true");
  node.style.left = `${spark.x}px`;
  node.style.top = `${spark.y}px`;
  node.style.color = spark.color;
  node.style.fontSize = `${spark.size}px`;
  node.style.setProperty("--rotation", `${spark.rotation}deg`);
  node.style.setProperty("--drift-x", `${spark.driftX}px`);
  node.style.setProperty("--drift-y", `${spark.driftY}px`);
  canvas.append(node);
  playPop();
}

canvas.addEventListener("pointerdown", (event) => {
  lastPoint = null;
  canvas.setPointerCapture(event.pointerId);
  paint(pointFromEvent(event));
});

canvas.addEventListener("pointermove", (event) => {
  if (canvas.hasPointerCapture(event.pointerId)) paint(pointFromEvent(event));
});

canvas.addEventListener("pointerup", () => {
  lastPoint = null;
});

canvas.addEventListener("pointercancel", () => {
  lastPoint = null;
});

canvas.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  lastPoint = null;
  paint({
    x: rect.width * (0.3 + Math.random() * 0.4),
    y: rect.height * (0.35 + Math.random() * 0.35),
  });
});

clear.addEventListener("click", () => {
  canvas.querySelectorAll(".spark").forEach((node) => node.remove());
  hint.hidden = false;
  lastPoint = null;
  canvas.focus();
});

const glyphs = pickShapeGlyphs(3);
hint.textContent = glyphs.join(" ");
