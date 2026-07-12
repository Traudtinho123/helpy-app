import { buildVoiceAppointmentProposal } from "@/features/voice/services/voice-appointment-proposal";
import {
  autoConfirmVoicePhoneAppointmentIfReady,
  seedVoiceAppointmentProposalFromDb,
} from "@/features/voice/services/voice-phone-appointment-service";
import type { VorgangDbRecord } from "@/features/vorgaenge/types/create-vorgang-types";

/** Baut Terminvorschlag aus DB-Vorgang und triggert Auto-Kalendereintrag. */
export async function syncVoiceAppointmentFromDbRecord(
  record: VorgangDbRecord
): Promise<void> {
  if (record.source !== "helpy_phone") return;
  if (!record.termin_datum || !record.termin_uhrzeit) return;

  const proposal = buildVoiceAppointmentProposal({
    vorgangId: record.id,
    classification: "besichtigung_anfrage",
    analysis: {
      classification: "besichtigung_anfrage",
      callerName: null,
      objectReference: null,
      requestedDateTime: `${record.termin_datum} ${record.termin_uhrzeit}`,
      createVorgang: true,
      summaryHint: record.inhalt,
      terminDatum: record.termin_datum,
      terminUhrzeit: record.termin_uhrzeit,
      terminDauerMinuten: null,
      objekt: null,
      objektAdresse: null,
      anruferName: null,
      notizen: record.inhalt,
    },
    callerPhone: record.anrufer_nummer,
    transcript: record.inhalt,
    summary: record.inhalt,
  });

  if (!proposal) return;

  seedVoiceAppointmentProposalFromDb(proposal);
  await autoConfirmVoicePhoneAppointmentIfReady(record.id);
}
