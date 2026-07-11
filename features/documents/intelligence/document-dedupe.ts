export type AttachmentDedupeInput = {
  fileName: string;
  messageId?: string | null;
  mimeType: string;
  sizeBytes?: number | null;
  providerAttachmentId?: string | null;
};

export function normalizeFileName(fileName: string): string {
  return fileName.trim().toLowerCase();
}

export function buildAttachmentDedupeKey(input: AttachmentDedupeInput): string {
  const providerAttachmentId = input.providerAttachmentId?.trim();
  if (providerAttachmentId) {
    const messageId = input.messageId?.trim() || "unknown";
    return `${messageId}:attachment:${providerAttachmentId}`;
  }

  const fileName = normalizeFileName(input.fileName);
  const messageId = input.messageId?.trim() || "unknown";
  const mimeType = input.mimeType.trim().toLowerCase();
  return `${messageId}:${fileName}:${mimeType}`;
}

export function parseSizeFromText(text: string): {
  sizeBytes?: number;
  sizeLabel?: string;
} {
  const match = text.match(/(\d+[,.]?\d*)\s*(kb|mb|gb)/i);
  if (!match) return {};

  const rawValue = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(rawValue)) return {};

  const unit = match[2].toLowerCase();
  const multiplier =
    unit === "gb" ? 1024 * 1024 * 1024 : unit === "mb" ? 1024 * 1024 : 1024;

  return {
    sizeBytes: Math.round(rawValue * multiplier),
    sizeLabel: `${match[1]} ${unit.toUpperCase()}`,
  };
}
