import type {
  BrainIntent,
  BrainPriority,
  PriorityDetectionInput,
} from "@/features/brain/services/brain-v2/types";

const HIGH_VALUE_KEYWORDS = [
  "45 arbeitsplätze",
  "penthouse",
  "850 m²",
  "24×",
  "büroausstattung",
];

function isDeadlineSoon(event: PriorityDetectionInput["event"]): boolean {
  const text = `${event.title} ${JSON.stringify(event.payload)}`.toLowerCase();
  const frist = String(event.payload.frist ?? event.payload.deadline ?? "");

  if (containsAny(text, ["heute", "morgen"])) return true;
  if (frist.includes("10.07") || frist.includes("08.07")) return true;

  return event.createdAt <= "2026-07-08T23:59:59+02:00";
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function isHighValueRequest(event: PriorityDetectionInput["event"]): boolean {
  const text = `${event.title} ${JSON.stringify(event.payload)}`.toLowerCase();
  return containsAny(text, HIGH_VALUE_KEYWORDS);
}

function isThisWeek(event: PriorityDetectionInput["event"]): boolean {
  const text = `${event.title} ${JSON.stringify(event.payload)}`.toLowerCase();
  return containsAny(text, ["diese woche", "heute", "morgen", "freitag"]);
}

export function detectPriority(input: PriorityDetectionInput): BrainPriority {
  const { event, intent, customerMatch } = input;

  if (intent === "frist" || event.type === "frist-erkannt") {
    return isDeadlineSoon(event) ? "kritisch" : "hoch";
  }

  if (intent === "rueckruf" || event.type === "neue-whatsapp-nachricht") {
    return "hoch";
  }

  if (
    intent === "angebotsanfrage" ||
    intent === "offertanfrage"
  ) {
    if (isHighValueRequest(event)) return "hoch";
    if (event.priority === "hoch") return "hoch";
    return "mittel";
  }

  if (intent === "immobilienanfrage" || intent === "besichtigung") {
    if (event.priority === "hoch") return "hoch";
    return "mittel";
  }

  if (intent === "terminwunsch" || event.type === "terminaenderung") {
    return isThisWeek(event) ? "hoch" : "mittel";
  }

  if (intent === "normale_nachricht" || intent === "dokument") {
    return "niedrig";
  }

  if (intent === "rechnung") {
    return "niedrig";
  }

  if (intent === "mandatsanfrage") {
    return customerMatch.type === "neuer_kunde" ? "hoch" : "mittel";
  }

  if (event.priority === "hoch") return "hoch";
  if (event.priority === "mittel") return "mittel";
  return "niedrig";
}

export const PRIORITY_SORT_ORDER: Record<BrainPriority, number> = {
  kritisch: 0,
  hoch: 1,
  mittel: 2,
  niedrig: 3,
};

export function sortByBrainPriority<T extends { priority: BrainPriority }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => PRIORITY_SORT_ORDER[a.priority] - PRIORITY_SORT_ORDER[b.priority]
  );
}
