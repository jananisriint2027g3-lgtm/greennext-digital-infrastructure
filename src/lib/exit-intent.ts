export const EXIT_INTENT_SHOWN_KEY = "gn_exit_intent_shown";
const EXIT_INTENT_TOP_THRESHOLD = 8;

export function isDesktopPointerExit(event: Pick<MouseEvent, "clientY" | "movementY" | "buttons">, desktopPointer: boolean): boolean {
  return desktopPointer && event.buttons === 0 && event.movementY < 0 && event.clientY <= EXIT_INTENT_TOP_THRESHOLD;
}

export function hasShownExitIntent(storage: Storage | null | undefined): boolean {
  try {
    return storage?.getItem(EXIT_INTENT_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markExitIntentShown(storage: Storage | null | undefined): void {
  try {
    storage?.setItem(EXIT_INTENT_SHOWN_KEY, "1");
  } catch {
    // Exit intent is optional and must not affect the visitor experience.
  }
}
