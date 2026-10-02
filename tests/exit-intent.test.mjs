import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/exit-intent.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exitIntent = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("only upward desktop movement at the browser boundary triggers", () => {
  assert.equal(exitIntent.isDesktopPointerExit({ clientY: 3, movementY: -4, buttons: 0 }, true), true);
  assert.equal(exitIntent.isDesktopPointerExit({ clientY: 3, movementY: 2, buttons: 0 }, true), false);
  assert.equal(exitIntent.isDesktopPointerExit({ clientY: 3, movementY: -4, buttons: 1 }, true), false);
  assert.equal(exitIntent.isDesktopPointerExit({ clientY: 3, movementY: -4, buttons: 0 }, false), false);
  assert.equal(exitIntent.isDesktopPointerExit({ clientY: 30, movementY: -4, buttons: 0 }, true), false);
});

test("shown state is safe and once-per-session", () => {
  const state = storage();
  assert.equal(exitIntent.hasShownExitIntent(state), false);
  exitIntent.markExitIntentShown(state);
  assert.equal(exitIntent.hasShownExitIntent(state), true);
  assert.equal(exitIntent.hasShownExitIntent(storage({ [exitIntent.EXIT_INTENT_SHOWN_KEY]: "corrupted" })), false);
});
