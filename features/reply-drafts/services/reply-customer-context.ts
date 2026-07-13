import { findCrmCustomerByMatch } from "@/features/crm/services/crm-store";
import { getLeadScoreForCustomer } from "@/features/lead-scoring/services/lead-score-store";
import { getAllMailVorgaenge } from "@/features/mail/unified-mail-source-service";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { ReplyCustomerContext } from "@/features/reply-drafts/types/mail-analysis-types";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";

function resolveSenderEmail(input: ReplyDraftInput): string {
  return (
    input.senderEmail ||
    extractEmailAddress(input.originalFrom ?? "") ||
    extractEmailAddress(input.gmailMessage?.from ?? "") ||
    ""
  ).toLowerCase();
}

function formatPreviousMailDate(value?: string): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString("de-CH");
}

export function buildReplyCustomerContext(
  input: ReplyDraftInput
): ReplyCustomerContext {
  const email = resolveSenderEmail(input);
  const customer = findCrmCustomerByMatch({
    email,
    firma: input.senderName,
    ansprechpartner: input.senderName,
  });

  const previousMails = getAllMailVorgaenge()
    .filter((vorgang) => {
      const sender = extractEmailAddress(vorgang.from ?? "")?.toLowerCase();
      return sender && email && sender === email && vorgang.id !== input.vorgangId;
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.receivedAt ?? a.emailDate ?? "");
      const bTime = Date.parse(b.receivedAt ?? b.emailDate ?? "");
      return bTime - aTime;
    })
    .slice(0, 3)
    .map((vorgang) => ({
      subject: vorgang.titel,
      snippet: vorgang.snippet ?? vorgang.summary ?? "",
      dateLabel: vorgang.receivedLabel ?? formatPreviousMailDate(vorgang.receivedAt),
    }));

  if (!customer) {
    return {
      isKnownCustomer: false,
      customerName: input.senderName || null,
      companyName: null,
      status: null,
      leadScore: null,
      notes: [],
      previousMails,
    };
  }

  return {
    isKnownCustomer: true,
    customerName: customer.ansprechpartner || input.senderName,
    companyName: customer.firma || null,
    status: customer.status === "neu" ? "Neuer Kunde" : "Bestandskunde",
    leadScore: getLeadScoreForCustomer(customer.id),
    notes: customer.notes.slice(0, 3),
    previousMails,
  };
}

export function formatPreviousCommunicationBlock(
  context: ReplyCustomerContext
): string {
  if (context.previousMails.length === 0) {
    return context.isKnownCustomer
      ? "Bekannter Kunde — keine früheren Mails in diesem Posteingang gefunden."
      : "";
  }

  return context.previousMails
    .map(
      (mail, index) =>
        `${index + 1}. ${mail.dateLabel} — ${mail.subject}: ${mail.snippet.slice(0, 140)}`
    )
    .join("\n");
}

export function formatCustomerContextBlock(
  context: ReplyCustomerContext
): string {
  if (!context.isKnownCustomer) {
    return "Absender ist kein bekannter Kunde in der Akte.";
  }

  const lines = [
    `Bekannter Kunde: ${context.customerName ?? "—"}`,
    context.companyName ? `Firma: ${context.companyName}` : null,
    context.status ? `Status: ${context.status}` : null,
    context.leadScore != null ? `Lead-Score: ${context.leadScore}/10` : null,
    context.notes.length > 0 ? `Notizen: ${context.notes.join(" | ")}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}
