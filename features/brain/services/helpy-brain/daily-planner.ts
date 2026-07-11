import {
  prioritizeWorkdayItems,
  toPrioritizedItems,
} from "@/features/brain/services/helpy-brain/priority-engine";
import {
  MOCK_WORKDAY_ITEMS,
  MOCK_WORKDAY_STATUS,
  MOCK_WORKDAY_USER_NAME,
} from "@/features/brain/services/helpy-brain/mock-workday";
import type {
  DailyPlan,
  PrioritizedWorkdayItem,
  WorkdayInputItem,
} from "@/features/brain/services/helpy-brain/types";

const TOP_ITEMS_LIMIT = 4;

function buildGreeting(userName: string): string {
  return `Guten Morgen ${userName} 👋`;
}

function buildSummary(items: PrioritizedWorkdayItem[]): string {
  const angebote = items.filter((i) => i.kategorie === "angebot").length;
  const termine = items.filter((i) => i.kategorie === "termin").length;
  const emails = items.filter(
    (i) => i.kategorie === "email" || i.kategorie === "behoerde"
  ).length;

  return `Ich habe deinen Arbeitstag vorbereitet — ${items.length} Prioritäten, ${angebote} Angebote, ${termine} Termine und ${emails} E-Mails warten auf dich.`;
}

function buildHelpyRecommendation(top: PrioritizedWorkdayItem): string {
  if (top.id === "weber-angebot") {
    return "Ich habe deine wichtigsten Aufgaben sortiert. Ich würde zuerst das Angebot von Weber & Co. versenden, weil der Kunde bereits seit 3 Tagen wartet und der Angebotswert hoch ist.";
  }

  return `Ich habe deine wichtigsten Aufgaben sortiert. Ich würde zuerst „${top.titel}“ angehen — ${top.priorisierungsGrund.charAt(0).toLowerCase()}${top.priorisierungsGrund.slice(1)}.`;
}

function buildNextBestAction(top: PrioritizedWorkdayItem): string {
  return `Nächster bester Schritt: ${top.empfohleneAktion}`;
}

function buildStatusMetrics() {
  const s = MOCK_WORKDAY_STATUS;
  return [
    { label: "E-Mails analysiert", value: s.emailsAnalysiert },
    { label: "Termine erkannt", value: s.termineErkannt },
    { label: "Angebote vorbereitet", value: s.angeboteVorbereitet },
    { label: "Neuer Kunde erkannt", value: s.neueKunden },
    { label: "Aufgaben priorisiert", value: s.aufgabenPriorisiert },
  ];
}

export function createDailyPlan(
  items: WorkdayInputItem[] = MOCK_WORKDAY_ITEMS,
  userName: string = MOCK_WORKDAY_USER_NAME
): DailyPlan {
  const scored = prioritizeWorkdayItems(items);
  const prioritizedItems = toPrioritizedItems(scored, TOP_ITEMS_LIMIT);
  const wichtigsteAufgabe = prioritizedItems[0];

  return {
    greeting: buildGreeting(userName),
    summary: buildSummary(prioritizedItems),
    prioritizedItems,
    wichtigsteAufgabe,
    helpyRecommendation: buildHelpyRecommendation(wichtigsteAufgabe),
    nextBestAction: buildNextBestAction(wichtigsteAufgabe),
    statusMetrics: buildStatusMetrics(),
    progressPercent: 60,
    progressMessage: "Du bist gut im Plan.",
    userName,
  };
}
