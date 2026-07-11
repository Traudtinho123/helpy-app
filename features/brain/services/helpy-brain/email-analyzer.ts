import { detectCalendarEvents } from "@/features/brain/services/helpy-brain/calendar-detector";
import { detectOffers } from "@/features/brain/services/helpy-brain/offer-detector";
import { detectTasks } from "@/features/brain/services/helpy-brain/task-detector";
import type {
  BrainEmailInput,
  BrainPrioritaet,
  EmailAnalysisResult,
  EmailAnalyzerContext,
} from "@/features/brain/services/helpy-brain/types";

function extractAbsenderName(email: BrainEmailInput): string {
  const lines = email.inhalt.trim().split("\n");
  const lastLine = lines[lines.length - 1]?.trim();
  if (lastLine && !lastLine.includes("@") && lastLine.length < 60) {
    return lastLine;
  }
  return email.absender;
}

function determinePrioritaet(context: EmailAnalyzerContext): BrainPrioritaet {
  if (context.istAngebotsanfrage) return "hoch";
  if (context.deadlines.some((d) => d.frist === "Freitag")) return "hoch";
  if (context.aufgaben.some((a) => a.prioritaet === "hoch")) return "hoch";
  if (context.termine.length > 0) return "mittel";
  return "mittel";
}

function buildZusammenfassung(
  email: BrainEmailInput,
  context: EmailAnalyzerContext
): string {
  const name = extractAbsenderName(email);

  if (context.istAngebotsanfrage && context.angebote[0]) {
    const angebot = context.angebote[0];
    const mengeText =
      angebot.menge !== undefined
        ? `${angebot.menge} Arbeitsplätze`
        : "eine Anfrage";
    const deadlineText = angebot.deadline
      ? ` Deadline: ${angebot.deadline}.`
      : "";
    return `${name} fordert ein verbindliches Angebot für ${mengeText} an.${deadlineText}`;
  }

  return `${name} hat eine Nachricht gesendet, die deine Aufmerksamkeit erfordert.`;
}

function buildEmpfohleneAktion(context: EmailAnalyzerContext): string {
  if (context.istAngebotsanfrage) {
    return "Angebot vorbereiten und bis zur Frist versenden";
  }
  if (context.aufgaben[0]) {
    return context.aufgaben[0].beschreibung;
  }
  return "E-Mail beantworten";
}

function buildAntwortEntwurf(
  email: BrainEmailInput,
  context: EmailAnalyzerContext
): string {
  const name = extractAbsenderName(email);
  const anrede = name.includes(" ")
    ? `Sehr geehrter Herr ${name.split(" ").pop()}`
    : `Sehr geehrte/r ${name}`;

  if (context.istAngebotsanfrage && context.angebote[0]) {
    const angebot = context.angebote[0];
    const frist = angebot.deadline ?? "in Kürze";
    return `${anrede},\n\nvielen Dank für Ihre Anfrage. Wir erstellen Ihnen bis ${frist} ein detailliertes Angebot${angebot.menge ? ` für ${angebot.menge} Arbeitsplätze inkl. Lieferung` : ""}. Bei Rückfragen stehe ich gerne zur Verfügung.\n\nMit freundlichen Grüßen`;
  }

  return `${anrede},\n\nvielen Dank für Ihre Nachricht. Ich melde mich zeitnah mit einer Rückmeldung.\n\nMit freundlichen Grüßen`;
}

function buildHelpyNachricht(
  email: BrainEmailInput,
  context: EmailAnalyzerContext,
  prioritaet: BrainPrioritaet
): string {
  const name = extractAbsenderName(email);
  const parts: string[] = [];

  if (context.istAngebotsanfrage) {
    parts.push(
      `Ich habe erkannt, dass ${name.includes(" ") ? "Herr " + name.split(" ").pop() : name} ein verbindliches Angebot benötigt.`
    );
  }

  if (prioritaet === "hoch") {
    parts.push("Ich würde diese Anfrage heute priorisieren.");
  }

  if (context.angebote[0]?.deadline) {
    parts.push(
      `Die Frist ${context.angebote[0].deadline} habe ich für dich markiert.`
    );
  }

  parts.push("Ich habe bereits einen Antwortentwurf vorbereitet.");

  return parts.join(" ");
}

export function analyzeEmailContent(
  email: BrainEmailInput
): EmailAnalysisResult {
  const { aufgaben } = detectTasks(email);
  const { angebote, istAngebotsanfrage } = detectOffers(email);
  const { termine, deadlines } = detectCalendarEvents(email);

  const context: EmailAnalyzerContext = {
    aufgaben,
    angebote,
    termine,
    istAngebotsanfrage,
    deadlines,
  };

  const prioritaet = determinePrioritaet(context);

  return {
    zusammenfassung: buildZusammenfassung(email, context),
    prioritaet,
    erkannteAufgaben: aufgaben,
    erkannteTermine: termine,
    erkannteAngebote: angebote,
    empfohleneAktion: buildEmpfohleneAktion(context),
    antwortEntwurf: buildAntwortEntwurf(email, context),
    helpyNachricht: buildHelpyNachricht(email, context, prioritaet),
    analysiertAm: new Date().toISOString(),
  };
}
