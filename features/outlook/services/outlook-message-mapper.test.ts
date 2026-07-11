import { describe, expect, it } from "vitest";
import { mapOutlookMessageToUnifiedMail } from "@/features/mail/services/unified-mail-mapper";
import { MOCK_OUTLOOK_MESSAGES } from "@/features/outlook/mock/outlook-mock";

describe("mapOutlookMessageToUnifiedMail", () => {
  it("mappt Graph-Nachrichten auf UnifiedMailMessage", () => {
    const message = MOCK_OUTLOOK_MESSAGES[0];
    const unified = mapOutlookMessageToUnifiedMail(
      message,
      "makler@firma.de"
    );

    expect(unified.provider).toBe("outlook");
    expect(unified.providerMessageId).toBe(message.id);
    expect(unified.providerThreadId).toBe(message.conversationId);
    expect(unified.subject).toBe(message.subject);
    expect(unified.direction).toBe("incoming");
    expect(unified.sourceAccountEmail).toBe("makler@firma.de");
    expect(unified.isUnread).toBe(true);
  });

  it("erkennt ausgehende Nachrichten anhand der Konto-Adresse", () => {
    const message = {
      ...MOCK_OUTLOOK_MESSAGES[0],
      from: {
        emailAddress: {
          name: "Makler",
          address: "makler@firma.de",
        },
      },
    };

    const unified = mapOutlookMessageToUnifiedMail(
      message,
      "makler@firma.de"
    );

    expect(unified.direction).toBe("outgoing");
  });
});
