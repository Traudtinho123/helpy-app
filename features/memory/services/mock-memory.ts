import type { MemoryEntry } from "@/features/memory/services/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export const MOCK_USER_MEMORIES: MemoryEntry[] = [
  {
    id: "mem-user-1",
    scope: "nutzer",
    title: "Angebots-Zeitfenster",
    insight: "Martina arbeitet Angebote meistens vormittags ab.",
    source: "helpy",
    createdAt: "2026-06-01",
    relevance: 8,
  },
  {
    id: "mem-user-2",
    scope: "nutzer",
    title: "Antwortstil",
    insight: "Martina bevorzugt formelle Antworttexte.",
    source: "helpy",
    createdAt: "2026-05-15",
    relevance: 7,
  },
  {
    id: "mem-user-3",
    scope: "nutzer",
    title: "Fristen im Kalender",
    insight: "Martina möchte wichtige Fristen immer im Kalender sehen.",
    source: "manuell",
    createdAt: "2026-04-20",
    relevance: 9,
  },
];

export const MOCK_CUSTOMER_MEMORIES: MemoryEntry[] = [
  {
    id: "mem-c-1-1",
    scope: "kunde",
    customerId: "1",
    title: "Antwortverhalten",
    insight: "Dieser Kunde antwortet meistens nach 2–3 Tagen.",
    source: "helpy",
    createdAt: "2026-06-10",
    relevance: 9,
  },
  {
    id: "mem-c-1-2",
    scope: "kunde",
    customerId: "1",
    title: "Bevorzugter Kanal",
    insight: "Dieser Kunde bevorzugt Telefon statt E-Mail.",
    source: "helpy",
    createdAt: "2026-06-12",
    relevance: 10,
  },
  {
    id: "mem-c-1-3",
    scope: "kunde",
    customerId: "1",
    title: "Typische Rückfragen",
    insight: "Kunde fragt oft nach Lieferzeiten.",
    source: "helpy",
    createdAt: "2026-06-18",
    relevance: 8,
  },
  {
    id: "mem-c-1-4",
    scope: "kunde",
    customerId: "1",
    title: "Angebotsformat",
    insight: "Angebote sollten als PDF vorbereitet werden.",
    source: "helpy",
    createdAt: "2026-06-20",
    relevance: 9,
  },
  {
    id: "mem-c-2-1",
    scope: "kunde",
    customerId: "2",
    title: "Terminpräferenz",
    insight: "Sandra reagiert schnell auf Terminvorschläge per E-Mail.",
    source: "helpy",
    createdAt: "2026-07-01",
    relevance: 8,
  },
  {
    id: "mem-c-2-2",
    scope: "kunde",
    customerId: "2",
    title: "Entscheidungsweg",
    insight: "Angebote werden intern mit dem Einkauf abgestimmt.",
    source: "helpy",
    createdAt: "2026-06-25",
    relevance: 7,
  },
  {
    id: "mem-c-3-1",
    scope: "kunde",
    customerId: "3",
    title: "Besichtigungswunsch",
    insight: "Besichtigungen werden bevorzugt am Nachmittag geplant.",
    source: "helpy",
    createdAt: "2026-07-02",
    relevance: 9,
  },
  {
    id: "mem-c-4-1",
    scope: "kunde",
    customerId: "4",
    title: "Erstkontakt",
    insight: "Neuer Lead — bevorzugt schnelle Erstreaktion per E-Mail.",
    source: "helpy",
    createdAt: "2026-07-06",
    relevance: 10,
  },
];

export const MOCK_SKILL_MEMORIES: MemoryEntry[] = [
  {
    id: "mem-s-re-1",
    scope: "branche",
    skill: "real-estate",
    title: "Besichtigungszeit",
    insight: "Interessenten bevorzugen Besichtigungen am Abend.",
    source: "helpy",
    createdAt: "2026-05-01",
    relevance: 8,
  },
  {
    id: "mem-s-re-2",
    scope: "branche",
    skill: "real-estate",
    title: "Exposé-Vorbereitung",
    insight: "Exposés sollen immer von HELPY vorbereitet werden — bitte prüfen und bestätigen.",
    source: "helpy",
    createdAt: "2026-05-01",
    relevance: 9,
  },
  {
    id: "mem-s-hw-1",
    scope: "branche",
    skill: "construction",
    title: "Vor-Ort-Termin",
    insight: "Offerten brauchen meist einen Vor-Ort-Termin.",
    source: "helpy",
    createdAt: "2026-05-01",
    relevance: 9,
  },
  {
    id: "mem-s-hw-2",
    scope: "branche",
    skill: "construction",
    title: "Material prüfen",
    insight: "Materialliste soll vor Angebot geprüft werden.",
    source: "helpy",
    createdAt: "2026-05-01",
    relevance: 8,
  },
  {
    id: "mem-s-cl-1",
    scope: "branche",
    skill: "consulting-legal",
    title: "Fristen hervorheben",
    insight: "Fristen müssen immer hervorgehoben werden.",
    source: "helpy",
    createdAt: "2026-05-01",
    relevance: 10,
  },
  {
    id: "mem-s-cl-2",
    scope: "branche",
    skill: "consulting-legal",
    title: "Erstgespräch",
    insight: "Erstgespräch soll bei neuen Mandanten vorgeschlagen werden.",
    source: "helpy",
    createdAt: "2026-05-01",
    relevance: 9,
  },
];

/** Vorgang-ID → Kunden-ID für Mock-Zuordnung */
export const VORGANG_CUSTOMER_MAP: Record<string, string> = {
  "weber-angebot": "1",
  "mueller-rueckfrage": "1",
  "sandra-termin": "2",
  "schmidt-angebot": "2",
  "finanzamt-steuer": "5",
  "techstart-neu": "4",
};

export function getAllMockMemories(): MemoryEntry[] {
  return [
    ...MOCK_USER_MEMORIES,
    ...MOCK_CUSTOMER_MEMORIES,
    ...MOCK_SKILL_MEMORIES,
  ];
}

export function resolveCustomerIdForVorgang(vorgangId: string): string | undefined {
  return VORGANG_CUSTOMER_MAP[vorgangId];
}

export function getSkillMemories(skill: HelpySkill): MemoryEntry[] {
  return MOCK_SKILL_MEMORIES.filter((entry) => entry.skill === skill);
}
