export interface PersistedChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  links?: Array<{ label: string; href: string }>;
}

export interface PersistedChatConversation {
  savedAt: number;
  updatedAt: number;
  messages: PersistedChatMessage[];
}

export const CHAT_CONVERSATION_STORAGE_KEY = "gn_chat_conversation";
export const CHAT_CONVERSATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CHAT_MESSAGES = 40;
const memoryStorage: Record<string, string> = {};

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const testKey = "__gn_chat_storage__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch {
    // Fall back to memory when browser storage is unavailable.
  }
  return null;
}

function readValue(key: string): string | null {
  const storage = getStorage();
  try {
    return storage?.getItem(key) ?? memoryStorage[key] ?? null;
  } catch {
    return memoryStorage[key] ?? null;
  }
}

function writeValue(key: string, value: string): void {
  const storage = getStorage();
  try {
    if (storage) {
      storage.setItem(key, value);
      return;
    }
  } catch {
    // Fall back to memory when writes are blocked or quota is exceeded.
  }
  memoryStorage[key] = value;
}

function clearValue(key: string): void {
  const storage = getStorage();
  try {
    storage?.removeItem(key);
  } catch {
    // Continue with the in-memory cleanup.
  }
  delete memoryStorage[key];
}

function sanitizeMessages(value: unknown): PersistedChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (message): message is Record<string, unknown> =>
        Boolean(message) && typeof message === "object",
    )
    .map((message, index) => {
      const role =
        message["role"] === "user" ? "user" : message["role"] === "assistant" ? "assistant" : null;
      const text = typeof message["text"] === "string" ? message["text"].trim().slice(0, 2000) : "";
      if (!role || !text) return null;

      const links = Array.isArray(message["links"])
        ? message["links"]
            .filter(
              (link): link is Record<string, unknown> => Boolean(link) && typeof link === "object",
            )
            .map((link) => ({
              label: typeof link["label"] === "string" ? link["label"].slice(0, 120) : "",
              href:
                typeof link["href"] === "string" && link["href"].startsWith("/")
                  ? link["href"]
                  : "",
            }))
            .filter((link) => link.label && link.href)
            .slice(0, 4)
        : undefined;

      const safeMessage = {
        id: typeof message["id"] === "number" ? message["id"] : index + 1,
        role,
        text,
      };
      return links?.length ? { ...safeMessage, links } : safeMessage;
    })
    .filter((message): message is PersistedChatMessage => Boolean(message))
    .slice(-MAX_CHAT_MESSAGES);
}

export function loadChatConversation(now = Date.now()): PersistedChatConversation | null {
  const raw = readValue(CHAT_CONVERSATION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedChatConversation>;
    const updatedAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0;
    const messages = sanitizeMessages(parsed.messages);
    if (
      !updatedAt ||
      now - updatedAt > CHAT_CONVERSATION_TTL_MS ||
      messages.length < 2 ||
      !messages.some((message) => message.role === "user")
    ) {
      clearValue(CHAT_CONVERSATION_STORAGE_KEY);
      return null;
    }
    return {
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : updatedAt,
      updatedAt,
      messages,
    };
  } catch {
    clearValue(CHAT_CONVERSATION_STORAGE_KEY);
    return null;
  }
}

export function saveChatConversation(messages: PersistedChatMessage[], now = Date.now()): void {
  const safeMessages = sanitizeMessages(messages);
  if (safeMessages.length < 2 || !safeMessages.some((message) => message.role === "user")) {
    clearValue(CHAT_CONVERSATION_STORAGE_KEY);
    return;
  }

  const existing = loadChatConversation(now);
  writeValue(
    CHAT_CONVERSATION_STORAGE_KEY,
    JSON.stringify({
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      messages: safeMessages,
    } satisfies PersistedChatConversation),
  );
}

export function clearChatConversation(): void {
  clearValue(CHAT_CONVERSATION_STORAGE_KEY);
}
