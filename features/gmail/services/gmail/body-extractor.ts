import type { GmailMimePart } from "@/features/gmail/services/gmail/types";

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;
  const padded =
    remainder === 0 ? normalized : normalized + "=".repeat(4 - remainder);
  return Buffer.from(padded, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function walkParts(part: GmailMimePart | undefined, plain: string[], html: string[]): void {
  if (!part) return;

  const mime = part.mimeType ?? "";
  const data = part.body?.data;

  if (data) {
    const decoded = decodeBase64Url(data);
    if (mime === "text/plain") {
      plain.push(decoded.trim());
    } else if (mime === "text/html") {
      html.push(stripHtml(decoded));
    }
  }

  for (const child of part.parts ?? []) {
    walkParts(child, plain, html);
  }
}

/** Extrahiert lesbaren Plain-Text aus Gmail format=full Payload. */
export function extractPlainTextFromGmailPayload(payload?: {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMimePart[];
}): string {
  if (!payload) return "";

  const plain: string[] = [];
  const html: string[] = [];
  walkParts(payload as GmailMimePart, plain, html);

  if (plain.length > 0) {
    return plain.join("\n\n").trim();
  }

  if (html.length > 0) {
    return html.join("\n\n").trim();
  }

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if ((payload.mimeType ?? "").includes("html")) {
      return stripHtml(decoded);
    }
    return decoded.trim();
  }

  return "";
}
