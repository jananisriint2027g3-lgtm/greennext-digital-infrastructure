import { ExternalLink } from "../icons";
import type { AssistantLink } from "./chatService";
import { trackEvent, getCurrentPage } from "../../lib/analytics";

interface ChatMessageProps {
  role: "user" | "assistant";
  text: string;
  links?: AssistantLink[];
}

export function ChatMessage({ role, text, links }: ChatMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
          isAssistant
            ? "border border-[#1E293B] bg-[#111A26] text-[#CBD5E1]"
            : "bg-[#10B981] text-[#06110D]"
        }`}
      >
        <p className="whitespace-pre-line">{text}</p>

        {links && links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[#1E293B] pt-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() =>
                  trackEvent({
                    tab: "AI Assistant",
                    event: "chatbot_link_click",
                    value: link.label,
                    page: getCurrentPage(),
                  })
                }
                className="inline-flex items-center gap-1 rounded-md border border-[#245044] px-2 py-1 text-[11px] font-medium text-[#6EE7B7] transition-colors hover:border-[#10B981] hover:bg-[#10B981]/10"
              >
                {link.label}
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
