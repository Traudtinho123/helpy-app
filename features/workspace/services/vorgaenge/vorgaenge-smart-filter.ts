import { getEffectiveVorgangStatus } from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import type { Vorgang, VorgangPriority } from "@/features/workspace/services/vorgaenge/types";

export type VorgaengeQuickFilter = "none" | "heute";

const PRIORITY_SCORE: Record<VorgangPriority, number> = {
  kritisch: 4,
  hoch: 3,
  mittel: 2,
  niedrig: 1,
};

function getReceivedTimestamp(vorgang: Vorgang): number {
  const raw = vorgang.latestMessageAt ?? vorgang.emailDate ?? vorgang.receivedAt;
  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getHoursSinceReceived(vorgang: Vorgang): number {
  const timestamp = getReceivedTimestamp(vorgang);
  if (!timestamp) return 0;
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

/** Kritisch wenn >24h ohne Antwort (eingehende Kundenmail). */
export function isCriticalWithoutReply(vorgang: Vorgang): boolean {
  if (getEffectiveVorgangStatus(vorgang) === "erledigt") return false;
  const awaitingReply =
    vorgang.latestMessageDirection === "incoming" ||
    vorgang.hasUnreadExternalMessage === true;
  return awaitingReply && getHoursSinceReceived(vorgang) > 24;
}

export function computeUrgencyScore(vorgang: Vorgang): number {
  let score = PRIORITY_SCORE[vorgang.prioritaet];
  if (isCriticalWithoutReply(vorgang)) score += 3;
  else if (getHoursSinceReceived(vorgang) > 12) score += 1;
  if (vorgang.hasUnreadExternalMessage) score += 1;
  return score;
}

export function filterHeuteZuErledigen(vorgaenge: Vorgang[]): Vorgang[] {
  const open = vorgaenge.filter(
    (item) => getEffectiveVorgangStatus(item) !== "erledigt"
  );
  const scored = open
    .map((item) => ({ item, score: computeUrgencyScore(item) }))
    .sort((a, b) => b.score - a.score);

  const threshold = Math.max(3, Math.ceil(scored.length * 0.35));
  return scored.slice(0, threshold).map((entry) => entry.item);
}

export type CardBorderAccent = "critical" | "high" | "normal" | "done";

export function getCardBorderAccent(vorgang: Vorgang): CardBorderAccent {
  const status = getEffectiveVorgangStatus(vorgang);
  if (status === "erledigt") return "done";
  if (isCriticalWithoutReply(vorgang)) return "critical";
  if (vorgang.prioritaet === "kritisch" || vorgang.prioritaet === "hoch") {
    return "high";
  }
  return "normal";
}

export const CARD_BORDER_STYLES: Record<CardBorderAccent, string> = {
  critical: "border-l-[#DC2626]",
  high: "border-l-[#F97316]",
  normal: "border-l-[#2563EB]",
  done: "border-l-[#94A3B8]",
};
