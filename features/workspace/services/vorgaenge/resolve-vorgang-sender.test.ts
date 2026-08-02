import { describe, expect, it } from "vitest";
import {
  isUnknownSenderLabel,
  pickBestVorgangSender,
  resolveVorgangSenderFromText,
} from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";

describe("resolve vorgang sender", () => {
  it("extracts platform inquiry contact from mail body", () => {
    const sender = resolveVorgangSenderFromText({
      fromHeader: "ImmoScout24 <noreply@immoscout24.ch>",
      subject: "Neue Anfrage zu Wohnung",
      bodyText:
        "Interessent: Thomas Müller\nE-Mail: thomas.mueller@example.com\nNachricht: Ich interessiere mich für die Wohnung.",
    });

    expect(sender.name).toBe("Thomas Müller");
    expect(sender.email).toBe("thomas.mueller@example.com");
    expect(sender.from).toBe("Thomas Müller <thomas.mueller@example.com>");
  });

  it("prefers gmail copy sender over db unknown during dedup", () => {
    const sender = pickBestVorgangSender([
      { kunde: "Unbekannt", titel: "Anfrage", from: undefined },
      {
        kunde: "Anna Beispiel",
        titel: "Anfrage",
        from: "Anna Beispiel <anna@example.com>",
      },
    ]);

    expect(sender.name).toBe("Anna Beispiel");
    expect(sender.email).toBe("anna@example.com");
  });

  it("extracts email from DocuSign header", () => {
    const sender = resolveVorgangSenderFromText({
      fromHeader: "DocuSign <noreply@docusign.com>",
      subject: "Your code is 456925",
      bodyText: "Your code is 456925",
    });

    expect(sender.name).toBe("DocuSign");
    expect(sender.email).toBe("noreply@docusign.com");
  });

  it("flags unknown sender labels", () => {
    expect(isUnknownSenderLabel("Unbekannt")).toBe(true);
    expect(isUnknownSenderLabel("(Unbekannt)")).toBe(true);
    expect(isUnknownSenderLabel("Kein Absender")).toBe(true);
    expect(isUnknownSenderLabel("Thomas Müller")).toBe(false);
  });
});
