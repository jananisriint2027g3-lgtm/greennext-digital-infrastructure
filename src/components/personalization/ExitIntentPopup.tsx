import { Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "../icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { getCurrentPage, getSessionId, trackEvent } from "../../lib/analytics";
import { getVisitorActionContext } from "../../lib/action-layer";
import { useExitIntent } from "../../hooks/useExitIntent";

type Destination = { label: string; href: string };

const DESTINATIONS = {
  infrastructure: { label: "Explore AI-ready infrastructure", href: "/infrastructure/ai-ready" },
  automation: { label: "Explore automation capabilities", href: "/automation/monitoring" },
  energy: { label: "Explore energy and cooling", href: "/energy/monitoring" },
  regions: { label: "Explore regional infrastructure", href: "/regions/overview" },
  solutions: { label: "Explore GreenNext solutions", href: "/solutions" },
  sustainability: { label: "Explore sustainability planning", href: "/sustainability" },
  about: { label: "Explore GreenNext", href: "/about/what-we-are" },
} satisfies Record<string, Destination>;

const DEFAULT_DESTINATION = DESTINATIONS["infrastructure"];

function destinationForVisitor(): Destination {
  const context = getVisitorActionContext(getCurrentPage(), getSessionId());
  const destination = DESTINATIONS[context.dominantInterest as keyof typeof DESTINATIONS];
  return destination ?? DEFAULT_DESTINATION;
}

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const closingAction = useRef<"cta" | null>(null);

  const showPopup = useCallback(() => {
    const nextDestination = destinationForVisitor();
    setDestination(nextDestination);
    setOpen(true);
    trackEvent({
      tab: "CTA Interactions",
      event: "exit_intent_popup_impression",
      value: nextDestination.href,
      page: getCurrentPage(),
    });
  }, []);

  useExitIntent(showPopup);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && closingAction.current !== "cta") {
      trackEvent({
        tab: "CTA Interactions",
        event: "exit_intent_popup_dismiss",
        value: "dismiss",
        page: getCurrentPage(),
      });
    }
    closingAction.current = null;
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border-[#1E3A4A] bg-[#0D1520] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-w-[520px]">
        <div className="h-1 bg-gradient-to-r from-[#10B981] via-[#22D3EE] to-[#10B981]" />
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 text-[#34D399]">
              <Sparkles size={20} aria-hidden="true" />
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight text-white">Before you go</DialogTitle>
            <DialogDescription className="mt-3 max-w-md text-sm leading-6 text-[#A8B5C4]">
              Explore how GreenNext can help you build AI-ready, efficient and sustainable data center infrastructure.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-7 gap-3 sm:flex-row sm:justify-start sm:space-x-0">
            <DialogClose asChild>
              <Link
                to={destination.href}
                onClick={() => {
                  closingAction.current = "cta";
                  trackEvent({
                    tab: "CTA Interactions",
                    event: "exit_intent_popup_cta_click",
                    value: destination.href,
                    page: getCurrentPage(),
                  });
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-[#06100D] transition-colors hover:bg-[#34D399] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67E8F9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1520]"
              >
                {destination.label}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </DialogClose>
            <DialogClose className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#334155] px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-[#64748B] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67E8F9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1520]">
              Continue browsing
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
