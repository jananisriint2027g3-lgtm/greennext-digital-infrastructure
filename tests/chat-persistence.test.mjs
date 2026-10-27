import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/chat-persistence.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const persistence = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

function installStorage() {
  const values = new Map();
  global.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  return values;
}

test("chat persistence restores a bounded unfinished conversation", () => {
  installStorage();
  const messages = [
    { id: 1, role: "assistant", text: "Hello" },
    { id: 2, role: "user", text: "Tell me about cooling" },
  ];
  persistence.saveChatConversation(messages, 1_000);
  assert.deepEqual(persistence.loadChatConversation(2_000).messages, messages);
});

test("expired and invalid conversations are cleared", () => {
  const values = installStorage();
  persistence.saveChatConversation(
    [
      { id: 1, role: "assistant", text: "Hello" },
      { id: 2, role: "user", text: "Question" },
    ],
    1_000,
  );
  assert.equal(
    persistence.loadChatConversation(1_000 + persistence.CHAT_CONVERSATION_TTL_MS + 1),
    null,
  );
  values.set(persistence.CHAT_CONVERSATION_STORAGE_KEY, "not-json");
  assert.equal(persistence.loadChatConversation(2_000), null);
});

test("storage failures fall back without throwing", () => {
  global.window = {
    localStorage: {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    },
  };
  assert.doesNotThrow(() =>
    persistence.saveChatConversation(
      [
        { id: 1, role: "assistant", text: "Hello" },
        { id: 2, role: "user", text: "Question" },
      ],
      3_000,
    ),
  );
  assert.equal(persistence.loadChatConversation(3_001).messages.length, 2);
});
