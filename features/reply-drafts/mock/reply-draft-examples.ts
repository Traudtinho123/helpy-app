import type { ReplyDraft } from "@/features/reply-drafts/types/reply-draft-types";

export const REPLY_DRAFT_EXAMPLES: ReplyDraft[] = [
  {
    id: "reply-draft-example-re",
    vorgangId: "brain-v3-example-re",
    recipient: "Anna Müller <anna.mueller@example.com>",
    recipientEmail: "anna.mueller@example.com",
    originalFrom: "Anna Müller <anna.mueller@example.com>",
    recipientValid: true,
    subject: "Re: Besichtigung Wohnung Musterstrasse",
    tone: "Freundlich und professionell",
    draftText: `Sehr geehrte Frau Müller,

vielen Dank für Ihre Nachricht und Ihr Interesse an einer Besichtigung.

Gerne schlage ich Ihnen einen Termin vor — bitte teilen Sie mir mit, wann es Ihnen in den nächsten Tagen am besten passt.

Mit freundlichen Grüßen`,
    missingInfo: ["Bevorzugter Besichtigungstermin", "Telefonnummer für Rückfragen"],
    suggestedAttachments: ["Exposé (Entwurf)"],
    needsConfirmation: true,
    status: "vorbereitet",
  },
  {
    id: "reply-draft-example-hw",
    vorgangId: "brain-v3-example-hw",
    recipient: "Thomas Weber <t.weber@example.com>",
    recipientEmail: "t.weber@example.com",
    originalFrom: "Thomas Weber <t.weber@example.com>",
    recipientValid: true,
    subject: "Re: Offertanfrage Badezimmer",
    tone: "Klar und verbindlich",
    draftText: `Sehr geehrter Herr Weber,

vielen Dank für Ihre Offertanfrage. Für eine genaue Kalkulation schlage ich zuerst einen Vor-Ort-Termin vor.

Mit freundlichen Grüßen`,
    missingInfo: ["Adresse der Baustelle", "Gewünschter Zeitraum"],
    suggestedAttachments: ["Checkliste Vor-Ort-Termin"],
    needsConfirmation: true,
    status: "vorbereitet",
  },
];
