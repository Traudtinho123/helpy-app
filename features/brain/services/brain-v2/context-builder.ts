import type { ContextBuildInput } from "@/features/brain/services/brain-v2/types";

export function buildContext(input: ContextBuildInput): string[] {
  const { event, intent, customerMatch } = input;
  const context: string[] = [];
  const payload = event.payload;

  if (customerMatch.type === "bestandskunde") {
    context.push("Kunde hatte bereits früher Kontakt.");
  }

  if (customerMatch.type === "neuer_kunde") {
    context.push("Ich habe einen neuen Kunden erkannt.");
  }

  if (customerMatch.type === "unbekannt") {
    context.push("Absender ist noch nicht eindeutig zugeordnet.");
  }

  if (
    intent === "angebotsanfrage" ||
    intent === "offertanfrage"
  ) {
    if (String(payload.vorschau ?? "").includes("3 Tage") || event.id === "evt-1") {
      context.push("Kunde wartet seit 3 Tagen auf Rückmeldung.");
    }
    context.push("Angebot existiert noch nicht — Entwurf kann vorbereitet werden.");
  }

  if (intent === "immobilienanfrage" || intent === "besichtigung") {
    if (payload.wunsch || String(payload.wunsch ?? "").includes("Abend")) {
      context.push("Termin wurde bereits vorgeschlagen — Abend bevorzugt.");
    }
    context.push("Besichtigung oder Erstgespräch steht noch aus.");
  }

  if (intent === "frist") {
    context.push("Frist läuft bald ab — Kalenderprüfung empfohlen.");
  }

  if (intent === "dokument" || event.type === "neue-datei") {
    context.push("Dokument fehlt noch im Vorgang — Zuordnung empfohlen.");
  }

  if (intent === "terminwunsch" || event.type === "terminaenderung") {
    context.push("Kalender und Beteiligte sollten abgestimmt werden.");
  }

  if (intent === "rueckruf") {
    context.push("Rückruf wurde ausdrücklich gewünscht.");
  }

  if (intent === "mandatsanfrage") {
    context.push("Erstgespräch und Mandatsunterlagen können vorbereitet werden.");
  }

  return context.slice(0, 4);
}

export function buildSummary(
  input: ContextBuildInput & { title: string }
): string {
  const { intent, customerMatch, title } = input;
  const name =
    customerMatch.companyName ?? customerMatch.customerName;

  switch (intent) {
    case "angebotsanfrage":
      return `Angebotsanfrage von ${name}: ${title}`;
    case "offertanfrage":
      return `Offertanfrage von ${name}: ${title}`;
    case "immobilienanfrage":
      return `Immobilienanfrage von ${name}: ${title}`;
    case "besichtigung":
      return `Besichtigungswunsch von ${name}: ${title}`;
    case "rueckruf":
      return `Rückrufwunsch von ${name}: ${title}`;
    case "terminwunsch":
      return `Terminbezug für ${name}: ${title}`;
    case "frist":
      return `Frist für ${name}: ${title}`;
    case "dokument":
      return `Neues Dokument von ${name}: ${title}`;
    case "mandatsanfrage":
      return `Mandatsanfrage von ${name}: ${title}`;
    case "rechnung":
      return `Rechnungsbezug von ${name}: ${title}`;
    default:
      return `Nachricht von ${name}: ${title}`;
  }
}
