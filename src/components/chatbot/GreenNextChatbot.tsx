import { Bot, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import { getAssistantResponse, type AssistantResponse } from "./chatService";

interface ChatEntry {
  id: number;
  role: "user" | "assistant";
  text: string;
  links?: AssistantResponse["links"];
}

const INITIAL_GREETING =
  "Hi! I'm the GreenNext AI Assistant. I can help you explore our infrastructure, regional focus areas, energy efficiency, automation, and digital infrastructure concepts.";

const SUGGESTIONS = [
  "What is GreenNext?",
  "Explore the four regions",
  "What is AI-ready infrastructure?",
  "How does automation work?",
  "Tell me about energy efficiency",
  "Contact GreenNext",
];

export function GreenNextChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([
    { id: 1, role: "assistant", text: INITIAL_GREETING },
  ]);
  const nextId = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timersRef.current.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const resetConversation = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    setInput("");
    setIsTyping(false);
    setMessages([{ id: nextId.current++, role: "assistant", text: INITIAL_GREETING }]);
  };

  const sendMessage = (value = input) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || isTyping) return;

    const userMessage: ChatEntry = {
      id: nextId.current++,
      role: "user",
      text: trimmedValue,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsTyping(true);

    const timer = setTimeout(() => {
      const response = getAssistantResponse(trimmedValue);
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: response.text,
          links: response.links,
        },
      ]);
      setIsTyping(false);
      timersRef.current = timersRef.current.filter((item) => item !== timer);
    }, 520);

    timersRef.current.push(timer);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[110] sm:right-6">
      {isOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="greennext-assistant-title"
          className="absolute bottom-16 right-0 flex h-[min(600px,calc(100vh-100px))] w-[calc(100vw-24px)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0B0F17] shadow-[0_18px_60px_rgba(0,0,0,0.45)] animate-in fade-in slide-in-from-bottom-3"
        >
          <header className="flex items-center justify-between border-b border-[#1E293B] bg-[#0D1520] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#245044] bg-[#10B981]/10 text-[#34D399]">
                <Bot size={17} aria-hidden="true" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0D1520] bg-[#10B981]" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    id="greennext-assistant-title"
                    className="truncate text-sm font-semibold text-[#F8FAFC]"
                  >
                    GreenNext AI Assistant
                  </h2>
                  <span className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[#10B981] sm:inline">
                    Online
                  </span>
                </div>
                <p className="truncate text-[10px] text-[#64748B]">
                  Infrastructure &amp; Digital Presence · content-guided demo
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetConversation}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-[#1E293B] hover:text-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
              >
                <RotateCcw size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close GreenNext AI Assistant"
                title="Close assistant"
                className="rounded-md p-1.5 text-[#64748B] transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4" aria-live="polite">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                text={message.text}
                links={message.links}
              />
            ))}

            {messages.length === 1 && !isTyping && (
              <ChatSuggestions suggestions={SUGGESTIONS} onSelect={sendMessage} />
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1 rounded-2xl border border-[#1E293B] bg-[#111A26] px-3.5 py-3"
                  aria-label="Assistant is typing"
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#38BDF8]"
                      style={{ animationDelay: `${dot * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="border-t border-[#1E293B] bg-[#0D1520] p-3"
          >
            <label htmlFor="greennext-assistant-input" className="sr-only">
              Ask GreenNext AI Assistant
            </label>
            <div className="flex items-end gap-2 rounded-xl border border-[#263849] bg-[#0B0F17] p-1.5 transition-colors focus-within:border-[#10B981]/70">
              <textarea
                ref={inputRef}
                id="greennext-assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Ask about GreenNext..."
                rows={1}
                disabled={isTyping}
                className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-[#F8FAFC] outline-none placeholder:text-[#64748B] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10B981] text-[#06110D] transition-all hover:bg-[#34D399] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
              >
                <Send size={15} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1.5 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-[#475569]">
              Frontend content assistant · Shift+Enter for a new line
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close GreenNext AI Assistant" : "Open GreenNext AI Assistant"}
        aria-expanded={isOpen}
        title="GreenNext AI Assistant"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#34D399]/60 bg-[#10B981] text-[#06110D] shadow-[0_0_24px_rgba(16,185,129,0.28)] transition-all hover:scale-105 hover:bg-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A0E]"
      >
        {isOpen ? <X size={20} aria-hidden="true" /> : <Bot size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
