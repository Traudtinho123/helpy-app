import type {
  BrainEmailInput,
  BrainPrioritaet,
  TaskDetectionResult,
} from "@/features/brain/services/helpy-brain/types";

const TASK_PATTERNS: Array<{
  pattern: RegExp;
  beschreibung: string | ((match: RegExpMatchArray) => string);
  prioritaet: BrainPrioritaet;
}> = [
  {
    pattern: /verbindliches?\s+angebot/i,
    beschreibung: "Angebot erstellen",
    prioritaet: "hoch",
  },
  {
    pattern: /angebot\s+(erstellen|vorbereiten|senden)/i,
    beschreibung: "Angebot erstellen",
    prioritaet: "hoch",
  },
  {
    pattern: /rückfrage|nachfrage/i,
    beschreibung: "Rückfrage beantworten",
    prioritaet: "mittel",
  },
  {
    pattern: /termin\s+(bestätigen|vorschlagen|vereinbaren)/i,
    beschreibung: "Termin bestätigen",
    prioritaet: "mittel",
  },
  {
    pattern: /rechnung/i,
    beschreibung: "Rechnung prüfen",
    prioritaet: "mittel",
  },
];

export function detectTasks(email: BrainEmailInput): TaskDetectionResult {
  const text = `${email.betreff ?? ""} ${email.inhalt}`;
  const aufgaben: TaskDetectionResult["aufgaben"] = [];
  const seen = new Set<string>();

  for (const { pattern, beschreibung, prioritaet } of TASK_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    const label =
      typeof beschreibung === "function"
        ? beschreibung(match)
        : beschreibung;

    if (seen.has(label)) continue;
    seen.add(label);

    aufgaben.push({
      beschreibung: label,
      prioritaet,
      quelle: "e-mail-inhalt",
    });
  }

  if (
    /angebot/i.test(text) &&
    !seen.has("Angebot erstellen")
  ) {
    aufgaben.push({
      beschreibung: "Angebot erstellen",
      prioritaet: "hoch",
      quelle: "e-mail-inhalt",
    });
  }

  if (aufgaben.length === 0) {
    aufgaben.push({
      beschreibung: "E-Mail beantworten",
      prioritaet: "mittel",
      quelle: "fallback",
    });
  }

  return { aufgaben };
}
