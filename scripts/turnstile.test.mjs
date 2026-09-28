import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
import { resolveTurnstileSiteKey } from "../src/lib/turnstile.js";

test("development requires explicit key and production rejects test keys", () => {
  assert.equal(resolveTurnstileSiteKey(undefined, true), "");
  assert.equal(resolveTurnstileSiteKey(" real-configured-site-key ", true), "real-configured-site-key");
  assert.equal(resolveTurnstileSiteKey("  ", false), "");
  assert.equal(resolveTurnstileSiteKey("1x00000000000000000000AA", false), "");
  assert.equal(resolveTurnstileSiteKey(" real-configured-site-key ", false), "real-configured-site-key");
});

function loaderHarness() {
  let script;
  const timers = new Map();
  let timerId = 0;
  const window = {};
  const context = vm.createContext({ window,
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
    document: {
      querySelector: () => script,
      createElement: () => {
        const events = new Map();
        return { addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name), remove: () => { script = undefined; }, emit: name => events.get(name)?.() };
      },
      head: { appendChild: node => { script = node; } },
    },
  });
  const source = readFileSync(new URL("../src/lib/turnstile.js", import.meta.url), "utf8").replaceAll("export function", "function");
  vm.runInContext(`${source}\nthis.load = loadTurnstile;`, context);
  return { load: context.load, window, timers, script: () => script };
}

test("concurrent forms share one script and reuse the loaded API", async () => {
  const h = loaderHarness();
  const first = h.load();
  const script = h.script();
  assert.equal(h.load(), first);
  assert.equal(h.script(), script);
  const api = { render() {}, ready() { throw new Error("ready is not supported on async scripts"); } };
  h.window.turnstile = api;
  script.emit("load");
  assert.equal(await first, api);
  assert.equal(await h.load(), api);
  assert.equal(h.timers.size, 0);
});

test("network failure clears the cached failure and allows retry", async () => {
  const h = loaderHarness();
  const first = h.load();
  h.script().emit("error");
  await assert.rejects(first, /Human verification could not load/);
  assert.equal(h.script(), undefined);
  const retry = h.load();
  h.window.turnstile = { render() {} };
  h.script().emit("load");
  assert.equal(await retry, h.window.turnstile);
});

test("stalled script times out and retries without duplicate scripts", async () => {
  const h = loaderHarness();
  const first = h.load();
  [...h.timers.values()][0]();
  await assert.rejects(first);
  assert.equal(h.script(), undefined);
  const second = h.load();
  const failure = assert.rejects(second);
  h.script().emit("error");
  await failure;
  assert.equal(h.timers.size, 0);
});
