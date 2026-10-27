import { CARDS } from "./cards.js";
import { applyTurn, createGame, nextTeam } from "./logic.js";

const setup = document.getElementById("setup");
const handoff = document.getElementById("handoff");
const play = document.getElementById("play");
const results = document.getElementById("results");

let game = null;
let cardQueue = [];
let cardIndex = 0;
let duration = 60;
let timeLeft = 60;
let turnNumber = 0;
let interval = null;
let running = false;

function showPanel(panel) {
  [setup, handoff, play, results].forEach((item) => {
    item.hidden = item !== panel;
  });
}

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function nextCard() {
  if (cardIndex >= cardQueue.length) {
    cardQueue = shuffle(CARDS);
    cardIndex = 0;
  }
  const card = cardQueue[cardIndex];
  cardIndex += 1;
  document.getElementById("answer").textContent = card.answer;
  document.getElementById("forbidden").replaceChildren(
    ...card.forbidden.map((word) => {
      const item = document.createElement("span");
      item.textContent = word;
      return item;
    }),
  );
}

function updateStatus() {
  const team = game.teams[game.activeTeam];
  document.getElementById("activeTeam").textContent = team.name;
  document.getElementById("score").textContent = `${team.score} 分`;
  document.getElementById("timer").textContent = String(Math.max(0, timeLeft));
}

function stopTimer() {
  window.clearInterval(interval);
  interval = null;
  running = false;
}

function endTurn() {
  stopTimer();
  turnNumber += 1;
  if (turnNumber >= 6) {
    const [a, b] = game.teams;
    document.getElementById("winner").textContent =
      a.score === b.score ? "平局！" : `${a.score > b.score ? a.name : b.name}获胜！`;
    document.getElementById("finalScores").replaceChildren(
      ...game.teams.map((team) => {
        const item = document.createElement("div");
        const score = document.createElement("strong");
        const name = document.createElement("span");
        score.textContent = String(team.score);
        name.textContent = team.name;
        item.append(score, name);
        return item;
      }),
    );
    showPanel(results);
    return;
  }
  game.activeTeam = nextTeam(game.activeTeam, game.teams.length);
  if (game.activeTeam === 0) game.round += 1;
  showHandoff();
}

function startTimer() {
  if (interval || timeLeft <= 0) return;
  running = true;
  interval = window.setInterval(() => {
    timeLeft -= 1;
    updateStatus();
    if (timeLeft <= 0) endTurn();
  }, 1000);
}

function showHandoff() {
  document.getElementById("roundLabel").textContent = `第 ${game.round} / 3 轮`;
  document.getElementById("handoffTeam").textContent = `轮到${game.teams[game.activeTeam].name}`;
  showPanel(handoff);
}

function useAction(action) {
  if (!running) return;
  game = applyTurn(game, action);
  updateStatus();
  nextCard();
}

document.getElementById("start").addEventListener("click", () => {
  const teamA = document.getElementById("teamA").value.trim() || "红队";
  const teamB = document.getElementById("teamB").value.trim() || "蓝队";
  duration = Number(document.querySelector('input[name="duration"]:checked')?.value || 60);
  timeLeft = duration;
  turnNumber = 0;
  cardQueue = shuffle(CARDS);
  cardIndex = 0;
  game = createGame([teamA, teamB], duration);
  showHandoff();
});

document.getElementById("ready").addEventListener("click", () => {
  timeLeft = duration;
  updateStatus();
  nextCard();
  showPanel(play);
  startTimer();
});

document.getElementById("correct").addEventListener("click", () => useAction("correct"));
document.getElementById("violation").addEventListener("click", () => useAction("violation"));
document.getElementById("skip").addEventListener("click", () => useAction("skip"));
document.getElementById("again").addEventListener("click", () => {
  stopTimer();
  showPanel(setup);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopTimer();
  else if (!play.hidden && timeLeft > 0) startTimer();
});

document.addEventListener("keydown", (event) => {
  if (play.hidden) return;
  if (event.key === "ArrowRight") useAction("correct");
  if (event.key === "ArrowLeft") useAction("skip");
  if (event.key === "ArrowDown") useAction("violation");
});
