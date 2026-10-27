import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("PWA registration bypasses HTTP cache and reloads after controller changes", async () => {
  const source = await readFile(new URL("../pwa.js", import.meta.url), "utf8");
  assert.match(source, /updateViaCache:\s*["']none["']/);
  assert.match(source, /controllerchange/);
  assert.match(source, /location\.reload\(\)/);
  assert.match(source, /registration\.update\(\)/);
});

test("service worker navigates open clients after activating an update", async () => {
  const source = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(source, /clients\.matchAll/);
  assert.match(source, /client\.navigate\(client\.url\)/);
});

test("force update page unregisters workers and clears tiny-games caches", async () => {
  const source = await readFile(
    new URL("../update.html", import.meta.url),
    "utf8",
  );
  assert.match(source, /getRegistrations\(\)/);
  assert.match(source, /registration\.unregister\(\)/);
  assert.match(source, /tiny-games-/);
  assert.match(source, /caches\.delete/);
  assert.match(source, /location\.replace/);
});
