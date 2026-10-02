import { useEffect, useRef } from "react";
import { hasShownExitIntent, isDesktopPointerExit, markExitIntentShown } from "../lib/exit-intent";

export function useExitIntent(onIntent: () => void): void {
  const triggered = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const desktopPointer = window.matchMedia("(pointer: fine)").matches;
    if (triggered.current || !desktopPointer || hasShownExitIntent(window.sessionStorage)) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (triggered.current || !isDesktopPointerExit(event, desktopPointer) || hasShownExitIntent(window.sessionStorage)) return;
      triggered.current = true;
      markExitIntentShown(window.sessionStorage);
      onIntent();
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [onIntent]);
}
