import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import "../games/registry.js";

const catalog = globalThis.TINY_GAMES_CATALOG;

test("catalog retains the seven original playable games", () => {
  const ids = catalog.map((game) => game.id);
  for (const id of [
    "balloon-pop",
    "paint-splat",
    "do-anything",
    "rainbow-sort",
    "star-catcher",
    "music-maker",
    "unicorn-fly",
  ]) {
    assert.ok(ids.includes(id), `missing original game: ${id}`);
  }
});

test("catalog categories and ids are valid and unique", () => {
  const ids = catalog.map((game) => game.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const game of catalog) {
    assert.ok(["toddler", "family"].includes(game.category));
    assert.match(game.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(game.path, `./games/${game.id}/`);
  }
});

test("expanded catalog contains ten toddler and three family games", () => {
  assert.equal(catalog.length, 13);
  assert.equal(catalog.filter((game) => game.category === "toddler").length, 10);
  assert.equal(catalog.filter((game) => game.category === "family").length, 3);
});

test("adapted games record an upstream revision and MIT license", () => {
  const adapted = catalog.filter((game) => game.source.type === "adapted");
  assert.equal(adapted.length, 6);
  for (const game of adapted) {
    assert.match(game.source.repo, /^https:\/\/github\.com\//);
    assert.match(game.source.commit, /^[a-f0-9]{40}$/);
    assert.equal(game.source.license, "MIT");
    assert.ok(game.files.some((file) => file.endsWith("/LICENSE")));
    assert.ok(game.files.some((file) => file.endsWith("/UPSTREAM.md")));
  }
});

test("new browser files do not load remote runtime resources", async () => {
  const importedGames = catalog.slice(7);
  for (const game of importedGames) {
    for (const file of game.files) {
      if (!/\.(?:html|css|js)$/.test(file)) continue;
      const source = await readFile(new URL(`..${file.replace(".", "")}`, import.meta.url), "utf8");
      assert.doesNotMatch(source, /(?:src|href)=["']https?:\/\//i, `${game.id}: ${file}`);
    }
  }
});

test("hub loads the registry and exposes category filters", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /games\/registry\.js/);
  assert.match(html, /id="gameCatalog"/);
  assert.match(html, /data-category="toddler"/);
  assert.match(html, /data-category="family"/);
});

test("service worker uses registry to derive every game entry", async () => {
  const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(sw, /importScripts\("\.\/games\/registry\.js"\)/);
  assert.match(sw, /CACHE_VERSION\s*=\s*"v12"/);
  assert.match(sw, /TINY_GAMES_CATALOG\.flatMap\(\(game\) => game\.files\)/);
});
