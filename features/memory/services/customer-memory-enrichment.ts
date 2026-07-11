import type {
  CustomerMemoryHistoryItem,
  CustomerMemoryProfile,
  MemoryEnrichmentHint,
} from "@/features/memory/types/customer-memory-types";

function daysBetween(fromIso: string, to = Date.now()): number {
  const from = new Date(fromIso).getTime();
  if (Number.isNaN(from)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

function formatDaysAgoLabel(days: number): string {
  if (days === 0) return "heute";
  if (days === 1) return "1 Tag";
  return `${days} Tagen`;
}

function findLatestHistory(
  history: CustomerMemoryHistoryItem[],
  type: CustomerMemoryHistoryItem["type"]
): CustomerMemoryHistoryItem | undefined {
  return history.find((item) => item.type === type);
}

export function buildMemoryEnrichmentHints(
  profile: CustomerMemoryProfile | null,
  currentVorgangId?: string
): MemoryEnrichmentHint[] {
  if (!profile) return [];

  const hints: MemoryEnrichmentHint[] = [];
  const priorVorgangCount = profile.vorgangIds.filter(
    (id) => id !== currentVorgangId
  ).length;

  if (priorVorgangCount > 0) {
    hints.push({ id: "bekannter-kunde", label: "Bekannter Kunde" });
  }

  const lastOffer = findLatestHistory(profile.history, "angebot");
  if (lastOffer) {
    const days = daysBetween(lastOffer.date);
    hints.push({
      id: "letztes-angebot",
      label: `Letztes Angebot vor ${formatDaysAgoLabel(days)}`,
    });
  }

  if (profile.contact.communicationStyle.toLowerCase().includes("telefon")) {
    hints.push({ id: "bevorzugt-telefon", label: "Bevorzugt Telefon" });
  }

  const openOffer = profile.history.find(
    (item) => item.type === "angebot" && item.status === "offen"
  );
  if (openOffer) {
    hints.push({ id: "offene-offerte", label: "Offene Offerte" });
  }

  const pendingReply = profile.history.find(
    (item) =>
      item.type === "antwort" &&
      item.status === "ausstehend" &&
      item.vorgangId !== currentVorgangId
  );
  const currentPendingReply = profile.history.find(
    (item) =>
      item.type === "antwort" &&
      item.status === "ausstehend" &&
      item.vorgangId === currentVorgangId
  );

  if (pendingReply || currentPendingReply) {
    hints.push({ id: "antwort-ausstehend", label: "Antwort noch ausstehend" });
  }

  return hints;
}

export function buildMemoryPanelBullets(
  profile: CustomerMemoryProfile | null,
  hints: MemoryEnrichmentHint[]
): string[] {
  if (!profile) return [];

  const bullets = [
    ...hints.map((hint) => hint.label),
    `${profile.contact.company} · ${profile.contact.email}`,
    profile.contact.communicationStyle,
    profile.contact.tone,
  ];

  if (profile.history.length > 0) {
    bullets.push(`${profile.vorgangIds.length} Vorgänge in der Historie`);
  }

  return [...new Set(bullets)].slice(0, 6);
}
