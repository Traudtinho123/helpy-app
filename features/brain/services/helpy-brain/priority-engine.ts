import type {
  BrainPrioritaet,
  Kundentyp,
  PriorityScoreBreakdown,
  WorkdayInputItem,
} from "@/features/brain/services/helpy-brain/types";

const DRINGLICHKEIT_SCORE: Record<BrainPrioritaet, number> = {
  hoch: 100,
  mittel: 55,
  niedrig: 20,
};

const KUNDENTYP_SCORE: Record<Kundentyp, number> = {
  bestandskunde: 75,
  interessent: 65,
  neu: 80,
  behoerde: 90,
};

const WEIGHTS = {
  deadline: 0.28,
  dringlichkeit: 0.22,
  angebotswert: 0.2,
  kundentyp: 0.1,
  wartezeit: 0.12,
  terminbezug: 0.08,
} as const;

function normalizeAngebotswert(wert?: number): number {
  if (!wert) return 0;
  return Math.min(100, (wert / 100_000) * 100);
}

function normalizeWartezeit(tage: number): number {
  return Math.min(100, tage * 22);
}

function normalizeTerminbezug(terminbezug?: string): number {
  if (!terminbezug) return 0;
  const lower = terminbezug.toLowerCase();
  if (/heute|morgen|14:00|09:00/.test(lower)) return 100;
  if (/dienstag|mittwoch|donnerstag/.test(lower)) return 75;
  return 45;
}

function calculateScore(item: WorkdayInputItem): number {
  const deadlineScore = item.deadlineDringlichkeit;
  const dringlichkeitScore = DRINGLICHKEIT_SCORE[item.dringlichkeit];
  const angebotswertScore = normalizeAngebotswert(item.angebotswert);
  const kundentypScore = KUNDENTYP_SCORE[item.kundentyp];
  const wartezeitScore = normalizeWartezeit(item.wartezeitTage);
  const terminScore = normalizeTerminbezug(item.terminbezug);

  return (
    deadlineScore * WEIGHTS.deadline +
    dringlichkeitScore * WEIGHTS.dringlichkeit +
    angebotswertScore * WEIGHTS.angebotswert +
    kundentypScore * WEIGHTS.kundentyp +
    wartezeitScore * WEIGHTS.wartezeit +
    terminScore * WEIGHTS.terminbezug
  );
}

/**
 * Priorisiert Workday-Einträge anhand von Deadline, Dringlichkeit,
 * Angebotswert, Kundentyp, Wartezeit und Terminbezug.
 */
export function prioritizeWorkdayItems(
  items: WorkdayInputItem[]
): PriorityScoreBreakdown[] {
  return [...items]
    .map((item) => ({ item, score: calculateScore(item) }))
    .sort((a, b) => b.score - a.score);
}

export function toPrioritizedItems(
  scored: PriorityScoreBreakdown[],
  limit?: number
): Array<WorkdayInputItem & { rang: number }> {
  const slice = limit ? scored.slice(0, limit) : scored;
  return slice.map(({ item }, index) => ({
    ...item,
    rang: index + 1,
  }));
}
