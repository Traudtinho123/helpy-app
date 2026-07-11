let counter = 0;

/** Stabile Demo-IDs — kein Date.now() (Hydration-sicher). */
export function createHelpyEventId(prefix = "hev"): string {
  counter += 1;
  return `${prefix}-${String(counter).padStart(6, "0")}`;
}

export function resetHelpyEventIdCounter(): void {
  counter = 0;
}
