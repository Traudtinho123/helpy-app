/** Kurzes haptisches Feedback (50ms), wenn verfügbar. */
export function triggerHapticFeedback(durationMs = 50): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Vibration nicht unterstützt oder blockiert.
  }
}
