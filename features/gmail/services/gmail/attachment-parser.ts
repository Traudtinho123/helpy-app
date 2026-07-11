import type {
  GmailAttachmentMeta,
  GmailMimePart,
} from "@/features/gmail/services/gmail/types";

const INLINE_SKIP_MIME = new Set([
  "text/plain",
  "text/html",
  "multipart/alternative",
  "multipart/mixed",
  "multipart/related",
]);

function decodeBase64Url(data: string): Buffer {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;
  const padded =
    remainder === 0 ? normalized : normalized + "=".repeat(4 - remainder);
  return Buffer.from(padded, "base64");
}

function inferFileName(part: GmailMimePart, mimeType: string): string {
  if (part.filename?.trim()) return part.filename.trim();
  if (mimeType.startsWith("image/")) {
    const ext = mimeType.split("/")[1] ?? "bin";
    return `anhang.${ext}`;
  }
  return "anhang.bin";
}

function collectParts(part: GmailMimePart | undefined, acc: GmailAttachmentMeta[]): void {
  if (!part) return;

  const mimeType = part.mimeType ?? "application/octet-stream";
  const attachmentId = part.body?.attachmentId;

  if (attachmentId && !INLINE_SKIP_MIME.has(mimeType)) {
    const fileName = inferFileName(part, mimeType);
    if (fileName || attachmentId) {
      acc.push({
        attachmentId,
        fileName,
        mimeType,
        size: part.body?.size ?? 0,
      });
    }
  }

  for (const child of part.parts ?? []) {
    collectParts(child, acc);
  }
}

export function extractGmailAttachmentsFromPayload(payload?: {
  parts?: GmailMimePart[];
  mimeType?: string;
  filename?: string;
  body?: { attachmentId?: string; size?: number; data?: string };
}): GmailAttachmentMeta[] {
  if (!payload) return [];

  const acc: GmailAttachmentMeta[] = [];

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      collectParts(part, acc);
    }
  } else if (payload.body?.attachmentId) {
    acc.push({
      attachmentId: payload.body.attachmentId,
      fileName: inferFileName(
        { filename: payload.filename, mimeType: payload.mimeType },
        payload.mimeType ?? "application/octet-stream"
      ),
      mimeType: payload.mimeType ?? "application/octet-stream",
      size: payload.body.size ?? 0,
    });
  }

  const seen = new Set<string>();
  return acc.filter((item) => {
    const key = `${item.attachmentId}:${item.fileName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function decodeGmailAttachmentData(base64Url: string): Buffer {
  return decodeBase64Url(base64Url);
}

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

function normalizeMimeTypeValue(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

export function inferMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.trim().toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  return "application/octet-stream";
}

/** Gmail liefert oft generischen MIME — Dateiname als Fallback. */
export function resolveAttachmentContentType(
  fileName: string,
  mimeType?: string | null
): string {
  const normalized = normalizeMimeTypeValue(mimeType ?? "");
  if (normalized && !GENERIC_MIME_TYPES.has(normalized)) {
    return mimeType!.trim();
  }

  const inferred = inferMimeTypeFromFileName(fileName);
  if (inferred !== "application/octet-stream") return inferred;

  return normalized || "application/octet-stream";
}

export function isPreviewableImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/jpeg") || mimeType.startsWith("image/png") || mimeType.startsWith("image/jpg");
}

export function isPdfMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeTypeValue(mimeType);
  return normalized === "application/pdf" || normalized.endsWith("/pdf");
}

export function isExcelMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeTypeValue(mimeType);
  return (
    normalized === "application/vnd.ms-excel" ||
    normalized ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    normalized === "text/csv" ||
    normalized.endsWith(".sheet") ||
    normalized.includes("spreadsheet")
  );
}

export function isWordMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeTypeValue(mimeType);
  return (
    normalized === "application/msword" ||
    normalized ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalized.endsWith(".document") ||
    normalized.includes("wordprocessing")
  );
}

export function isOfficeDocumentMimeType(mimeType: string): boolean {
  return (
    isExcelMimeType(mimeType) ||
    isWordMimeType(mimeType) ||
    normalizeMimeTypeValue(mimeType).includes("presentation") ||
    normalizeMimeTypeValue(mimeType).includes("powerpoint")
  );
}

export function isOfficeAttachment(fileName: string, mimeType: string): boolean {
  const lower = fileName.trim().toLowerCase();
  if (/\.(docx?|xlsx?|csv|pptx?)$/i.test(lower)) return true;
  return isOfficeDocumentMimeType(resolveAttachmentContentType(fileName, mimeType));
}

export function isInlinePreviewableMimeType(mimeType: string): boolean {
  return isPdfMimeType(mimeType) || isPreviewableImageMimeType(mimeType);
}

export function attachmentContentDisposition(mimeType: string): "inline" | "attachment" {
  return isInlinePreviewableMimeType(mimeType) ? "inline" : "attachment";
}
