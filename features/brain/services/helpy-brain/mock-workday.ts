import type { WorkdayInputItem } from "@/features/brain/services/helpy-brain/types";
import { getVorgangPath } from "@/features/workspace/services/workspace";

/** Realistische Mock-Daten für HELPY Brain v0.3 Tagesplanung */
export const MOCK_WORKDAY_ITEMS: WorkdayInputItem[] = [
  {
    id: "weber-angebot",
    titel: "Angebot Weber & Co. versenden",
    kategorie: "angebot",
    kategorieLabel: "Angebot",
    deadline: "Freitag",
    deadlineDringlichkeit: 92,
    dringlichkeit: "hoch",
    angebotswert: 85_000,
    kundentyp: "bestandskunde",
    wartezeitTage: 3,
    empfohleneAktion: "Angebot öffnen und versenden",
    priorisierungsGrund:
      "Kunde wartet seit 3 Tagen — hoher Angebotswert und Frist Freitag",
    href: getVorgangPath("weber-angebot"),
  },
  {
    id: "finanzamt-steuer",
    titel: "Steuerbescheid prüfen",
    kategorie: "behoerde",
    kategorieLabel: "Behörde",
    deadline: "Einspruchsfrist 4 Wochen",
    deadlineDringlichkeit: 85,
    dringlichkeit: "hoch",
    kundentyp: "behoerde",
    wartezeitTage: 1,
    empfohleneAktion: "Bescheid im Elster-Portal prüfen",
    priorisierungsGrund:
      "Behördliche Frist — rechtzeitige Prüfung vermeidet Nacharbeit",
    href: getVorgangPath("finanzamt-steuer"),
  },
  {
    id: "sandra-termin",
    titel: "Termin mit Sandra Klein vorbereiten",
    kategorie: "termin",
    kategorieLabel: "Termin",
    deadline: "Heute, 14:00 Uhr",
    deadlineDringlichkeit: 78,
    dringlichkeit: "mittel",
    kundentyp: "interessent",
    wartezeitTage: 1,
    terminbezug: "Heute · 14:00 Uhr · Q2-Planung",
    empfohleneAktion: "Gesprächsvorbereitung und Kalendereinladung",
    priorisierungsGrund:
      "Termin heute Nachmittag — Vorbereitung sichert professionellen Eindruck",
    href: getVorgangPath("sandra-termin"),
  },
  {
    id: "mueller-rueckfrage",
    titel: "Rückfrage Müller GmbH beantworten",
    kategorie: "email",
    kategorieLabel: "E-Mail",
    deadline: "Heute",
    deadlineDringlichkeit: 70,
    dringlichkeit: "mittel",
    kundentyp: "bestandskunde",
    wartezeitTage: 2,
    empfohleneAktion: "Antwort im Vorgang verfassen",
    priorisierungsGrund:
      "Bestandskunde mit offener Rückfrage — schnelle Antwort stärkt Vertrauen",
    href: getVorgangPath("mueller-rueckfrage"),
  },
  {
    id: "schmidt-angebot",
    titel: "Angebot Schmidt GmbH fertigstellen",
    kategorie: "angebot",
    kategorieLabel: "Angebot",
    deadline: "Diese Woche",
    deadlineDringlichkeit: 55,
    dringlichkeit: "mittel",
    angebotswert: 24_000,
    kundentyp: "interessent",
    wartezeitTage: 1,
    empfohleneAktion: "Entwurf prüfen und freigeben",
    priorisierungsGrund: "Wartungsangebot fast fertig — nach Top-Prioritäten angehen",
    href: getVorgangPath("schmidt-angebot"),
  },
  {
    id: "techstart-neu",
    titel: "Erstkontakt TechStart AG",
    kategorie: "kunde",
    kategorieLabel: "Neuer Kunde",
    deadline: "Heute",
    deadlineDringlichkeit: 60,
    dringlichkeit: "mittel",
    kundentyp: "neu",
    wartezeitTage: 0,
    empfohleneAktion: "Willkommensmail und Erstgespräch anbieten",
    priorisierungsGrund:
      "Frischer Lead — heute antworten erhöht Abschlusswahrscheinlichkeit",
    href: getVorgangPath("techstart-neu"),
  },
];

export const MOCK_WORKDAY_USER_NAME = "Martina";

export const MOCK_WORKDAY_STATUS = {
  emailsAnalysiert: 18,
  termineErkannt: 4,
  angeboteVorbereitet: 2,
  neueKunden: 1,
  aufgabenPriorisiert: 6,
};
