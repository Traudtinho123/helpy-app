import { describe, expect, it } from "vitest";
import {
  HELPY_MAIL_SUBJECT_PREFIX,
  isHelpySystemMail,
  resolveHelpyReportLabel,
  stripHelpySubjectPrefix,
} from "@/features/workspace/services/vorgaenge/helpy-report-detector";

describe("helpy report detector", () => {
  it("detects [HELPY] subject prefix", () => {
    expect(
      isHelpySystemMail({
        subject: `${HELPY_MAIL_SUBJECT_PREFIX} Deine HELPY Wochenzusammenfassung – KW 27`,
        from: "viktor@example.com",
      })
    ).toBe(true);
  });

  it("detects HELPY system domains", () => {
    expect(
      isHelpySystemMail({
        subject: "Neue Benachrichtigung",
        from: "notifications@helpy.ai",
      })
    ).toBe(true);
  });

  it("detects self-sent HELPY mails", () => {
    expect(
      isHelpySystemMail({
        subject: "Deine HELPY Wochenzusammenfassung – KW 27",
        from: "viktor@example.com",
        sourceAccountEmail: "viktor@example.com",
      })
    ).toBe(true);
  });

  it("ignores regular customer mail", () => {
    expect(
      isHelpySystemMail({
        subject: "Besichtigungstermin",
        from: "kunde@example.com",
        sourceAccountEmail: "viktor@example.com",
      })
    ).toBe(false);
  });

  it("resolves report labels and strips prefix", () => {
    expect(
      resolveHelpyReportLabel(
        "[HELPY] Deine HELPY Wochenzusammenfassung – KW 27"
      )
    ).toBe("Wochenbericht");
    expect(
      stripHelpySubjectPrefix("[HELPY] Deine HELPY Wochenzusammenfassung – KW 27")
    ).toBe("Deine HELPY Wochenzusammenfassung – KW 27");
  });
});
