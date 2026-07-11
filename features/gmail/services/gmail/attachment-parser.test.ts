import { describe, expect, it } from "vitest";
import {
  decodeGmailAttachmentData,
  extractGmailAttachmentsFromPayload,
  inferMimeTypeFromFileName,
  resolveAttachmentContentType,
} from "@/features/gmail/services/gmail/attachment-parser";
import {
  dedupeUnifiedMailAttachments,
  mapGmailAttachmentsToUnified,
} from "@/features/mail/services/mail-attachment-mapper";

describe("Gmail attachment parser", () => {
  it("extrahiert PDF-Anhänge aus MIME-Parts", () => {
    const attachments = extractGmailAttachmentsFromPayload({
      parts: [
        {
          mimeType: "multipart/mixed",
          parts: [
            { mimeType: "text/plain", body: { data: "dGVzdA==" } },
            {
              mimeType: "application/pdf",
              filename: "Expose.pdf",
              body: { attachmentId: "att-1", size: 120_000 },
            },
          ],
        },
      ],
    });

    expect(attachments).toHaveLength(1);
    expect(attachments[0]?.fileName).toBe("Expose.pdf");
    expect(attachments[0]?.mimeType).toBe("application/pdf");
  });

  it("mappt Gmail-Anhänge auf UnifiedMailAttachment", () => {
    const unified = mapGmailAttachmentsToUnified({
      connectionId: "conn-1",
      sourceAccountEmail: "agent@firma.ch",
      message: {
        id: "msg-1",
        subject: "Unterlagen",
        date: "2026-07-10T10:00:00.000Z",
        direction: "incoming",
        attachments: [
          {
            attachmentId: "att-1",
            fileName: "Plan.pdf",
            mimeType: "application/pdf",
            size: 50_000,
          },
        ],
      },
    });

    expect(unified[0]?.provider).toBe("gmail");
    expect(unified[0]?.direction).toBe("incoming");
    expect(unified[0]?.connectionId).toBe("conn-1");
    expect(unified[0]?.id).toBe("gmail:msg-1:att-1");
  });

  it("dekodiert Base64URL ohne Padding korrekt (PDF-Header)", () => {
    const raw = Buffer.from("%PDF-1.4\n%âãÏÓ");
    const base64url = raw
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const decoded = decodeGmailAttachmentData(base64url);
    expect(decoded.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("leitet Office-MIME-Typen aus Dateinamen ab", () => {
    expect(inferMimeTypeFromFileName("Kalkulation.xlsx")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(inferMimeTypeFromFileName("Alt.xls")).toBe("application/vnd.ms-excel");
    expect(inferMimeTypeFromFileName("Vertrag.docx")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(inferMimeTypeFromFileName("Brief.doc")).toBe("application/msword");
  });

  it("ersetzt generischen Gmail-MIME durch Dateinamen-Fallback", () => {
    expect(
      resolveAttachmentContentType(
        "Liste.xlsx",
        "application/octet-stream"
      )
    ).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(
      resolveAttachmentContentType(
        "Expose.pdf",
        "application/pdf"
      )
    ).toBe("application/pdf");
  });

  it("mappt Office-Anhänge mit korrektem contentType", () => {
    const unified = mapGmailAttachmentsToUnified({
      connectionId: "conn-1",
      message: {
        id: "msg-2",
        subject: "Excel",
        date: "2026-07-10T10:00:00.000Z",
        direction: "incoming",
        attachments: [
          {
            attachmentId: "att-2",
            fileName: "Kalkulation.xlsx",
            mimeType: "application/octet-stream",
            size: 12_000,
          },
        ],
      },
    });

    expect(unified[0]?.contentType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("dedupliziert identische Dateinamen aus mehreren Mails", () => {
    const base = {
      provider: "gmail" as const,
      name: "Expose.pdf",
      contentType: "application/pdf",
      size: 120_000,
      providerAttachmentId: "att-1",
      messageSubject: "Unterlagen",
      direction: "incoming" as const,
      connectionId: "conn-1",
      sourceAccountEmail: null,
    };

    const deduped = dedupeUnifiedMailAttachments([
      {
        ...base,
        id: "gmail:msg-1:att-1",
        providerMessageId: "msg-1",
        messageReceivedAt: "2026-07-10T08:00:00.000Z",
      },
      {
        ...base,
        id: "gmail:msg-2:att-9",
        providerMessageId: "msg-2",
        providerAttachmentId: "att-9",
        messageReceivedAt: "2026-07-10T10:00:00.000Z",
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0]?.providerMessageId).toBe("msg-2");
  });
});
