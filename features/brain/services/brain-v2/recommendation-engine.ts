import type {
  BrainIntent,
  BrainPriority,
  CreatedObject,
  PreparedAction,
  RecommendationInput,
} from "@/features/brain/services/brain-v2/types";

export function createRecommendation(input: RecommendationInput): {
  recommendedNextStep: string;
  helpyMessage: string;
  preparedActions: PreparedAction[];
  createdObjects: CreatedObject[];
} {
  const { intent, priority, customerMatch, context } = input;

  const actions = getPreparedActions(intent, customerMatch.type);
  const objects = getCreatedObjects(intent, customerMatch.type);
  const nextStep = getNextStep(intent, priority);
  const helpyMessage = getHelpyMessage(intent, priority, customerMatch.type, context);

  return {
    recommendedNextStep: nextStep,
    helpyMessage,
    preparedActions: actions,
    createdObjects: objects,
  };
}

function getPreparedActions(
  intent: BrainIntent,
  customerType: RecommendationInput["customerMatch"]["type"]
): PreparedAction[] {
  const base: PreparedAction[] = ["Workspace öffnen"];

  switch (intent) {
    case "angebotsanfrage":
    case "offertanfrage":
      return [
        "Angebot vorbereiten",
        "Antwort vorbereiten",
        ...(customerType === "neuer_kunde" ? (["Kunde anlegen"] as PreparedAction[]) : []),
        ...base,
      ];
    case "immobilienanfrage":
    case "besichtigung":
      return ["Besichtigung planen", "Antwort vorbereiten", ...base];
    case "rueckruf":
      return ["Rückruf planen", "Antwort vorbereiten", ...base];
    case "terminwunsch":
      return ["Besichtigung planen", "Frist sichern", ...base];
    case "frist":
      return ["Frist sichern", "Antwort vorbereiten", ...base];
    case "dokument":
      return ["Dokument prüfen", ...base];
    case "mandatsanfrage":
      return [
        "Kunde anlegen",
        "Antwort vorbereiten",
        "Dokument prüfen",
        ...base,
      ];
    case "rechnung":
      return ["Dokument prüfen", "Antwort vorbereiten", ...base];
    default:
      return ["Antwort vorbereiten", ...base];
  }
}

function getCreatedObjects(
  intent: BrainIntent,
  customerType: RecommendationInput["customerMatch"]["type"]
): CreatedObject[] {
  const objects: CreatedObject[] = ["Vorgang vorbereitet"];

  if (customerType === "neuer_kunde") {
    objects.push("Kunde vorbereitet");
  }

  if (
    intent === "angebotsanfrage" ||
    intent === "offertanfrage"
  ) {
    objects.push("Aufgabe vorbereitet");
  }

  if (
    intent === "besichtigung" ||
    intent === "terminwunsch" ||
    intent === "frist"
  ) {
    objects.push("Termin vorbereitet");
  }

  if (intent === "dokument") {
    objects.push("Dokument vorbereitet");
  }

  return objects;
}

function getNextStep(intent: BrainIntent, priority: BrainPriority): string {
  if (priority === "kritisch") {
    return "Sofort prüfen und Frist oder Termin sichern.";
  }

  const steps: Record<BrainIntent, string> = {
    angebotsanfrage: "Angebotsanfrage prüfen und Entwurf vorbereiten.",
    offertanfrage: "Offerte prüfen und Positionen ergänzen.",
    immobilienanfrage: "Interessent kontaktieren und nächsten Schritt abstimmen.",
    besichtigung: "Besichtigungstermin vorschlagen und bestätigen.",
    rueckruf: "Rückruf einplanen und Kunde informieren.",
    terminwunsch: "Termin bestätigen oder Alternativen vorschlagen.",
    frist: "Frist im Kalender sichern und Vorgang priorisieren.",
    rechnung: "Rechnung prüfen und Zuordnung abschließen.",
    dokument: "Dokument prüfen und dem Vorgang zuordnen.",
    mandatsanfrage: "Erstgespräch vorbereiten und Kundenakte anlegen.",
    normale_nachricht: "Nachricht lesen und Antwort vorbereiten.",
  };

  return steps[intent];
}

function getHelpyMessage(
  intent: BrainIntent,
  priority: BrainPriority,
  customerType: RecommendationInput["customerMatch"]["type"],
  context: string[]
): string {
  if (priority === "kritisch") {
    return "Ich würde die Frist sofort im Kalender sichern.";
  }

  if (customerType === "neuer_kunde") {
    return "Ich habe einen neuen Kunden erkannt und würde eine Kundenakte vorbereiten.";
  }

  const messages: Partial<Record<BrainIntent, string>> = {
    angebotsanfrage:
      "Ich empfehle, zuerst diese Angebotsanfrage zu prüfen.",
    offertanfrage:
      "Ich empfehle, zuerst diese Offertanfrage zu prüfen.",
    immobilienanfrage:
      "Ich würde den Kontakt vorbereiten und eine Besichtigung vorschlagen.",
    besichtigung:
      "Ich würde den Kontakt vorbereiten und eine Besichtigung vorschlagen.",
    rueckruf:
      "Ich empfehle, den Rückruf heute noch einzuplanen.",
    terminwunsch:
      "Ich würde den Termin vorschlagen — bitte prüfen und bestätigen.",
    frist:
      "Ich würde die Frist im Kalender vorbereiten — bitte prüfen und bestätigen.",
    dokument:
      "Ich habe das Dokument vorbereitet — bitte prüfen und bestätigen.",
    mandatsanfrage:
      "Ich empfehle, zuerst das Erstgespräch vorzubereiten.",
  };

  const base =
    messages[intent] ??
    "Bitte prüfe die Angaben und bestätige — ich habe alles Wichtige vorbereitet.";

  if (context.some((c) => c.includes("3 Tagen"))) {
    return `${base} Der Kunde wartet seit 3 Tagen.`;
  }

  return base;
}
