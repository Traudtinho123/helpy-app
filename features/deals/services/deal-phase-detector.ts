import type { DealType } from "@/features/deals/types/deal-types";

export type PhaseDetectionResult = {
  phase: number;
  reason: string;
  notificationTitle: string;
};

type PhaseRule = {
  phase: number;
  patterns: RegExp[];
  reason: string;
  notificationTitle: (name: string) => string;
};

const VERKAUF_RULES: PhaseRule[] = [
  {
    phase: 7,
    patterns: [
      /vertrag\s+(unterzeichnet|unterschrieben)/i,
      /haben\s+den\s+vertrag\s+signiert/i,
    ],
    reason: "Vertrag unterzeichnet erkannt",
    notificationTitle: (n) => `🎉 ${n} hat den Vertrag unterzeichnet!`,
  },
  {
    phase: 5,
    patterns: [
      /kaufangebot/i,
      /angebot\s+(machen|abgeben|unterbreiten)/i,
      /möchten\s+(ein\s+)?angebot/i,
      /offerte\s+(machen|abgeben)/i,
    ],
    reason: "Kaufangebot erkannt",
    notificationTitle: (n) => `🎉 ${n} hat ein Kaufangebot gemacht!`,
  },
  {
    phase: 2,
    patterns: [
      /besichtigungstermin/i,
      /bestätige\s+(den\s+)?besichtigung/i,
      /besichtigung\s+(vereinbart|bestätigt)/i,
      /termin\s+für\s+die\s+besichtigung/i,
    ],
    reason: "Besichtigung vereinbart erkannt",
    notificationTitle: (n) => `${n}: Besichtigung vereinbart`,
  },
  {
    phase: 3,
    patterns: [
      /besichtigung\s+(war|hat\s+stattgefunden|durchgeführt)/i,
      /nach\s+der\s+besichtigung/i,
    ],
    reason: "Besichtigung durchgeführt erkannt",
    notificationTitle: (n) => `${n}: Besichtigung durchgeführt`,
  },
  {
    phase: 6,
    patterns: [/in\s+verhandlung/i, /verhandeln\s+wir/i, /gegenangebot/i],
    reason: "Verhandlung erkannt",
    notificationTitle: (n) => `${n}: In Verhandlung`,
  },
  {
    phase: 4,
    patterns: [
      /interesse\s+(bekundet|bestätigt)/i,
      / sehr\s+interessiert/i,
      /möchten\s+(weiter|fortfahren)/i,
    ],
    reason: "Interesse bekundet",
    notificationTitle: (n) => `${n} hat Interesse bekundet`,
  },
];

const VERMIETUNG_RULES: PhaseRule[] = [
  {
    phase: 7,
    patterns: [/mietvertrag\s+unterschrieben/i, /vertrag\s+unterzeichnet/i],
    reason: "Mietvertrag unterschrieben",
    notificationTitle: (n) => `🎉 ${n}: Mietvertrag unterschrieben!`,
  },
  {
    phase: 4,
    patterns: [/bewerbung\s+(eingereicht|erhalten)/i, /mietbewerbung/i],
    reason: "Bewerbung erhalten",
    notificationTitle: (n) => `${n} hat eine Bewerbung eingereicht`,
  },
  {
    phase: 2,
    patterns: [
      /besichtigungstermin/i,
      /bestätige\s+(den\s+)?besichtigung/i,
      /besichtigung\s+(vereinbart|bestätigt)/i,
    ],
    reason: "Besichtigung vereinbart",
    notificationTitle: (n) => `${n}: Besichtigung vereinbart`,
  },
  {
    phase: 3,
    patterns: [/besichtigung\s+(war|hat\s+stattgefunden)/i],
    reason: "Besichtigung durchgeführt",
    notificationTitle: (n) => `${n}: Besichtigung durchgeführt`,
  },
  {
    phase: 5,
    patterns: [/bonität\s+(geprüft|ok|bestätigt)/i, /solvency/i],
    reason: "Bonität geprüft",
    notificationTitle: (n) => `${n}: Bonität geprüft`,
  },
];

export function detectDealPhaseFromMailContent(
  content: string,
  dealType: DealType,
  interessentName = "Interessent"
): PhaseDetectionResult | null {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const rules = dealType === "vermietung" ? VERMIETUNG_RULES : VERKAUF_RULES;

  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return {
        phase: rule.phase,
        reason: rule.reason,
        notificationTitle: rule.notificationTitle(interessentName),
      };
    }
  }

  return null;
}

export function shouldAdvancePhase(
  currentPhase: number,
  detectedPhase: number
): boolean {
  return detectedPhase > currentPhase && detectedPhase <= 9;
}
