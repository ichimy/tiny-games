import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "../games/registry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = globalThis.TINY_GAMES_CATALOG;

assert.ok(Array.isArray(catalog) && catalog.length > 0, "catalog must be non-empty");

for (const game of catalog) {
  assert.ok(game.id && game.title && game.description, `invalid entry: ${game.id}`);
  assert.ok(game.files.includes(game.path), `${game.id} must precache its directory`);
  for (const url of game.files) {
    const relative = url.replace(/^\.\//, "").replace(/\/$/, "");
    const target = path.join(root, relative);
    await access(target);
  }
}

console.log(`Validated ${catalog.length} games.`);
