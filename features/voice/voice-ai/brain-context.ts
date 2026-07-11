import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { VoiceBrainContext } from "@/features/voice/voice-core/types";
import { getVoiceMemoryRecords } from "@/features/voice/voice-memory/memory-store";

const SKILL_CONTEXT_HINTS: Record<HelpySkill, string> = {
  "real-estate":
    "Immobilien-Kontext: Objekte, Besichtigungen, Preise, Zimmer, Adressen.",
  construction:
    "Construction-Kontext: Probleme, Adresse, Fotos, Termine, Offerten.",
  "consulting-legal":
    "Consulting/Legal-Kontext: Mandant, Fragen, Rückruf, Dokumente.",
};

export function buildSkillPromptContext(skill: HelpySkill): string {
  return SKILL_CONTEXT_HINTS[skill];
}

export function buildVoiceBrainContext(input: {
  skill: HelpySkill;
  callerName?: string | null;
  callerPhone?: string | null;
}): VoiceBrainContext {
  const memories = getVoiceMemoryRecords().slice(0, 5);

  return {
    skill: input.skill,
    customerName: input.callerName ?? null,
    customerPhone: input.callerPhone ?? null,
    openVorgaenge: [],
    recentCalls: memories.map((item) => item.summary),
    calendarHint: null,
    companyKnowledge: buildSkillPromptContext(input.skill),
  };
}
