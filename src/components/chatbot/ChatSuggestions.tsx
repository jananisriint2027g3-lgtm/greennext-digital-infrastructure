import { trackEvent, getCurrentPage } from "../../lib/analytics";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function ChatSuggestions({ suggestions, onSelect }: ChatSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => {
            trackEvent({
              tab: "AI Assistant",
              event: "chatbot_suggestion_select",
              value: suggestion,
              page: getCurrentPage(),
            });
            onSelect(suggestion);
          }}
          className="rounded-full border border-[#263849] bg-[#0D1520] px-2.5 py-1.5 text-left text-[11px] text-[#94A3B8] transition-colors hover:border-[#10B981]/70 hover:text-[#D1FAE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
