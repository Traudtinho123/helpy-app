import { upsertKundenakte } from "@/features/kundenakte/services/kundenakte-store";
import { recordKundenaktePrepared } from "@/features/kundenakte/services/kundenakte-timeline";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { KUNDENAKTE_STATUS_LABELS } from "@/features/kundenakte/types/kundenakte-types";
import { HELPY_KUNDENAKTE_HINT } from "@/features/kundenakte/services/kundenakte-engine";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const VOICE_QUELLE = "Telefon";

function normalizePhone(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length >= 6 ? trimmed : "—";
}

/** Erstellt Kundenakte-Stub aus Telefonanruf (nur Client). */
export function prepareKundenakteFromVoiceCall(input: {
  vorgangId: string;
  callerName?: string | null;
  callerPhone?: string | null;
  summary: string;
  titel: string;
  skill: HelpySkill;
  receivedAt: string;
  receivedLabel: string;
}): Kundenakte | null {
  const phone = normalizePhone(input.callerPhone);
  const name = input.callerName?.trim() || "Unbekannt";
  if (phone === "—" && name === "Unbekannt") return null;

  const skillConfig = getSkillConfig(input.skill);
  const id =
    phone !== "—"
      ? `voice-${phone.replace(/\D/g, "")}`
      : `voice-${input.vorgangId}`;

  const record: Kundenakte = {
    id,
    vorgangId: input.vorgangId,
    name,
    firma: "—",
    email: "—",
    telefon: phone,
    adresse: "—",
    quelle: VOICE_QUELLE,
    skill: input.skill,
    skillLabel: skillConfig.label,
    letzterKontakt: input.receivedAt,
    letzterKontaktLabel: input.receivedLabel,
    betreff: input.titel,
    zusammenfassung: input.summary,
    status: "vorbereitet",
    statusLabel: KUNDENAKTE_STATUS_LABELS.vorbereitet,
    isKnownCustomer: false,
    helpyHint: HELPY_KUNDENAKTE_HINT,
  };

  upsertKundenakte(record);
  recordKundenaktePrepared({
    kundenakteId: record.id,
    vorgangId: record.vorgangId,
    customerName: record.name,
  });

  return record;
}
