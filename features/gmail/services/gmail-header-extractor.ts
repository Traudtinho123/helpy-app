import type { GmailMessagePayload, GmailMimePart } from "@/features/gmail/services/gmail/types";

function readHeaderFromList(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string
): string {
  return (
    headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value?.trim() ?? ""
  );
}

function collectHeadersFromPart(
  part: GmailMimePart | GmailMessagePayload["payload"] | undefined,
  bucket: Map<string, string>
): void {
  if (!part) return;

  for (const header of part.headers ?? []) {
    const key = header.name.toLowerCase();
    if (!bucket.has(key) && header.value?.trim()) {
      bucket.set(key, header.value.trim());
    }
  }

  for (const child of part.parts ?? []) {
    collectHeadersFromPart(child, bucket);
  }
}

/** Liest Gmail-Header auch aus verschachtelten MIME-Parts. */
export function extractGmailHeaders(
  payload: GmailMessagePayload["payload"] | undefined
): Map<string, string> {
  const bucket = new Map<string, string>();
  collectHeadersFromPart(payload, bucket);
  return bucket;
}

export function getGmailHeader(
  payload: GmailMessagePayload["payload"] | undefined,
  name: string
): string {
  const fromMap = extractGmailHeaders(payload);
  return fromMap.get(name.toLowerCase()) ?? "";
}
