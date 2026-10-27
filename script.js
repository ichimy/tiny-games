// ── Decorative background (aria-hidden, no keyboard interaction) ──
const palette = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#C77DFF",
  "#FF9A3C",
  "#FF6FD8",
];
const starChars = ["★", "✦", "✧", "◆", "●"];
const bg = document.getElementById("bgShapes");

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

for (let i = 0; i < 18; i++) {
  const el = document.createElement("div");
  el.className = "shape";
  const size = rand(60, 220);
  el.style.cssText = `width:${size}px;height:${size}px;left:${rand(0, 100)}%;top:${rand(0, 100)}%;background:${pick(palette)};animation-duration:${rand(6, 14)}s;animation-delay:${-rand(0, 8)}s`;
  bg.appendChild(el);
}

for (let i = 0; i < 14; i++) {
  const s = document.createElement("div");
  s.className = "star";
  s.textContent = pick(starChars);
  s.setAttribute("aria-hidden", "true");
  s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;color:${pick(palette)};animation-duration:${rand(1.5, 3.5)}s;animation-delay:${-rand(0, 2)}s`;
  bg.appendChild(s);
}

// ── Game catalog ───────────────────────────────────────────
const catalog = globalThis.TINY_GAMES_CATALOG || [];
const catalogRoot = document.getElementById("gameCatalog");
const gameCount = document.getElementById("gameCount");
const filterButtons = [...document.querySelectorAll("[data-category]")];
let activeCategory = "all";

function cardFor(game) {
  const link = document.createElement("a");
  link.className = "game-card";
  link.dataset.game = game.id;
  link.href = game.path;
  link.setAttribute("role", "listitem");
  link.setAttribute("aria-label", `${game.title}，${game.description}`);
  link.innerHTML = `
    <div class="card-thumb" data-tone="${game.category}">
      <span class="thumb-emoji" aria-hidden="true">${game.emoji}</span>
    </div>
    <div class="card-body">
      <div class="card-tag">${game.category === "family" ? "全家玩" : "幼儿玩"}</div>
      <h3 class="card-name">${game.title}</h3>
      <p class="card-en">${game.subtitle}</p>
      <p class="card-desc">${game.description}</p>
      <div class="card-meta">
        <span>${game.players}</span>
        <span class="play-label">${game.source.type === "original" ? "Tiny Games 原创" : "开源改编"} ▶</span>
      </div>
    </div>`;
  return link;
}

function renderCatalog() {
  const games = catalog.filter(
    (game) => activeCategory === "all" || game.category === activeCategory,
  );
  catalogRoot.replaceChildren(...games.map(cardFor));
  gameCount.textContent = String(catalog.length);
  document.getElementById("games-heading").setAttribute(
    "aria-label",
    `当前显示 ${games.length} 个游戏`,
  );
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderCatalog();
  });
});

renderCatalog();
