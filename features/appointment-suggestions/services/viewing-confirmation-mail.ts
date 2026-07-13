import {
  buildIcsCalendarInvite,
  icsToBase64,
} from "@/features/appointment-suggestions/services/ics-calendar-invite";
import type { AppointmentSuggestion } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { buildReplyDraftCompanyContext } from "@/features/reply-drafts/services/reply-draft-company-knowledge";
import { sendGmailMessage } from "@/features/gmail/services/gmail-drafts";
import { createClient } from "@/lib/supabase/client";
import { getCompanyProfileSnapshot } from "@/lib/company/company-profile-service";

export type SendViewingConfirmationMailResult =
  | { ok: true; icsContent: string }
  | { ok: false; error: string; icsContent?: string };

function buildConfirmationBody(input: {
  customerName: string;
  dateLabel: string;
  start: string;
  end: string;
  location: string | null;
  durationLabel: string;
  signature: string;
}): string {
  return `Guten Tag ${input.customerName},

ich bestätige hiermit Ihren Besichtigungstermin:

📅 ${input.dateLabel} um ${input.start} Uhr
📍 ${input.location ?? "Ort wird noch bekannt gegeben"}
⏱ Dauer: ca. ${input.durationLabel}

Im Anhang finden Sie eine Kalendereinladung, die Sie direkt in Ihren Kalender importieren können.

Bei Fragen stehe ich Ihnen gerne zur Verfügung.

${input.signature}`.trim();
}

export function buildViewingIcsInvite(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  organizerEmail: string
): string {
  const profile = getCompanyProfileSnapshot();
  const companyContext = buildReplyDraftCompanyContext(profile);

  return buildIcsCalendarInvite({
    uid: `helpy-invite-${suggestion.vorgangId}-${slot.id}@helpy.app`,
    summary: `Besichtigung ${suggestion.objekt}`,
    description: `Besichtigung mit ${companyContext.companyName}`,
    location: suggestion.location ?? undefined,
    date: slot.date,
    startTime: slot.start,
    endTime: slot.end,
    organizerEmail,
    organizerName: companyContext.companyName,
    attendeeEmail: suggestion.contactEmail,
    attendeeName: suggestion.customer,
  });
}

export async function sendViewingConfirmationWithIcs(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot
): Promise<SendViewingConfirmationMailResult> {
  const supabase = createClient();
  if (!supabase) {
    return { ok: false, error: "Keine aktive Sitzung." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.provider_token ?? null;
  const organizerEmail = session?.user?.email ?? "";

  if (!organizerEmail) {
    return { ok: false, error: "Organisator-E-Mail nicht verfügbar." };
  }

  const companyContext = buildReplyDraftCompanyContext();
  const icsContent = buildViewingIcsInvite(suggestion, slot, organizerEmail);
  const body = buildConfirmationBody({
    customerName: suggestion.customer,
    dateLabel: slot.dateLabel,
    start: slot.start,
    end: slot.end,
    location: suggestion.location,
    durationLabel: suggestion.durationLabel,
    signature: companyContext.emailSignature || companyContext.companyName,
  });

  if (!suggestion.contactEmail) {
    return {
      ok: false,
      error: "Kunden-E-Mail nicht bekannt — .ics steht zum Download bereit.",
      icsContent,
    };
  }

  if (!accessToken) {
    return {
      ok: false,
      error: "Gmail nicht verbunden — .ics steht zum Download bereit.",
      icsContent,
    };
  }

  const subject = `Kalendereinladung: Besichtigung ${suggestion.objekt} - ${slot.dateLabel}`;

  const result = await sendGmailMessage({
    accessToken,
    to: suggestion.contactEmail,
    subject,
    body,
    attachments: [
      {
        filename: "besichtigung.ics",
        mimeType: "text/calendar; method=REQUEST",
        contentBase64: icsToBase64(icsContent),
      },
    ],
  });

  if (!result.ok) {
    return { ok: false, error: result.error, icsContent };
  }

  return { ok: true, icsContent };
}

export function downloadIcsFile(icsContent: string, filename = "besichtigung.ics"): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
