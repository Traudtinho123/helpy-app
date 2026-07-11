import type { PreparedDocument } from "@/features/documents/services/types";
import type { HelpyRecognizedDocument } from "@/features/documents/intelligence/document-types";
import {
  isPdfMimeType,
  isOfficeDocumentMimeType,
} from "@/features/gmail/services/gmail/attachment-parser";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";

function normalizeFileName(value: string): string {
  return value.trim().toLowerCase();
}

function fileNamesLooselyMatch(left: string, right: string): boolean {
  const a = normalizeFileName(left);
  const b = normalizeFileName(right);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const stripExt = (name: string) => name.replace(/\.[a-z0-9]+$/i, "");
  const aBase = stripExt(a);
  const bBase = stripExt(b);
  if (aBase.length >= 8 && bBase.length >= 8) {
    if (aBase.includes(bBase) || bBase.includes(aBase)) return true;
  }

  return false;
}

export function findMatchingMailAttachment(
  attachments: readonly UnifiedMailAttachment[],
  input: {
    fileName?: string | null;
    messageId?: string | null;
    mimeType?: string | null;
    providerAttachmentId?: string | null;
  }
): UnifiedMailAttachment | null {
  if (attachments.length === 0) return null;

  const fileName = input.fileName ? normalizeFileName(input.fileName) : null;
  const messageId = input.messageId?.trim() ?? null;
  const providerAttachmentId = input.providerAttachmentId?.trim() ?? null;

  if (providerAttachmentId) {
    const byProviderId = attachments.find(
      (item) => item.providerAttachmentId === providerAttachmentId
    );
    if (byProviderId) return byProviderId;
  }

  if (messageId && fileName) {
    const exact = attachments.find(
      (item) =>
        item.providerMessageId === messageId &&
        normalizeFileName(item.name) === fileName
    );
    if (exact) return exact;
  }

  if (fileName) {
    const byName = attachments.find(
      (item) => normalizeFileName(item.name) === fileName
    );
    if (byName) return byName;
  }

  if (messageId) {
    const onMessage = attachments.filter(
      (item) => item.providerMessageId === messageId
    );
    if (onMessage.length === 1) return onMessage[0];

    if (fileName) {
      const fuzzyOnMessage = onMessage.find((item) =>
        fileNamesLooselyMatch(item.name, input.fileName ?? "")
      );
      if (fuzzyOnMessage) return fuzzyOnMessage;
    }

    const pdfsOnMessage = onMessage.filter((item) =>
      isPdfMimeType(item.contentType)
    );
    if (pdfsOnMessage.length === 1 && fileName?.endsWith(".pdf")) {
      return pdfsOnMessage[0];
    }

    const byMessage = onMessage[0];
    if (byMessage && !fileName) return byMessage;
  }

  if (fileName) {
    const fuzzy = attachments.find((item) =>
      fileNamesLooselyMatch(item.name, input.fileName ?? "")
    );
    if (fuzzy) return fuzzy;
  }

  if (fileName?.endsWith(".pdf") || isPdfMimeType(input.mimeType ?? "")) {
    const pdfs = attachments.filter((item) => isPdfMimeType(item.contentType));
    if (pdfs.length === 1) return pdfs[0];
  }

  if (
    fileName &&
    (isOfficeDocumentMimeType(input.mimeType ?? "") ||
      /\.(xlsx?|docx?|csv|pptx?)$/i.test(fileName))
  ) {
    const officeFiles = attachments.filter(
      (item) =>
        isOfficeDocumentMimeType(item.contentType) ||
        /\.(xlsx?|docx?|csv|pptx?)$/i.test(item.name)
    );
    const exactOffice = officeFiles.find(
      (item) => normalizeFileName(item.name) === fileName
    );
    if (exactOffice) return exactOffice;

    const fuzzyOffice = officeFiles.find((item) =>
      fileNamesLooselyMatch(item.name, input.fileName ?? "")
    );
    if (fuzzyOffice) return fuzzyOffice;

    if (officeFiles.length === 1) return officeFiles[0];
  }

  if (fileName && input.mimeType) {
    return (
      attachments.find(
        (item) =>
          normalizeFileName(item.name) === fileName &&
          item.contentType === input.mimeType
      ) ?? null
    );
  }

  return null;
}

export function resolveDocumentMailAttachment(
  attachments: readonly UnifiedMailAttachment[],
  document?: PreparedDocument | null,
  recognized?: Pick<
    HelpyRecognizedDocument,
    "fileName" | "messageId" | "mimeType" | "providerAttachmentId"
  > | null
): UnifiedMailAttachment | null {
  const fromPrepared = document?.attachmentMeta;

  return findMatchingMailAttachment(attachments, {
    fileName: recognized?.fileName ?? fromPrepared?.fileName ?? document?.title,
    messageId:
      recognized?.messageId ??
      fromPrepared?.sourceMessageId ??
      undefined,
    mimeType: recognized?.mimeType ?? fromPrepared?.mimeType,
    providerAttachmentId:
      recognized?.providerAttachmentId ?? fromPrepared?.providerAttachmentId,
  });
}
