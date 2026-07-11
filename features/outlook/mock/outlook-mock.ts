import type { GraphMessage } from "@/features/outlook/types/outlook-types";

export const MOCK_OUTLOOK_MESSAGES: GraphMessage[] = [
  {
    id: "mock-outlook-msg-1",
    conversationId: "mock-outlook-conv-1",
    subject: "Besichtigungstermin Wohnung Musterstraße",
    bodyPreview: "Guten Tag, ich interessiere mich für die Wohnung...",
    from: {
      emailAddress: {
        name: "Max Mustermann",
        address: "max.mustermann@example.com",
      },
    },
    toRecipients: [
      {
        emailAddress: {
          name: "Makler",
          address: "makler@firma.de",
        },
      },
    ],
    receivedDateTime: new Date().toISOString(),
    isRead: false,
    hasAttachments: false,
  },
];
