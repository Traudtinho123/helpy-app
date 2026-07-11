export type RecognizedDocumentSource =
  | "Gmail"
  | "ImmoScout24"
  | "Homegate"
  | "Sonstige Quelle";

export function resolveDocumentSource(quelle?: string | null): RecognizedDocumentSource {
  const normalized = quelle?.trim().toLowerCase() ?? "";

  if (normalized.includes("immoscout")) return "ImmoScout24";
  if (normalized.includes("homegate")) return "Homegate";
  if (normalized.includes("gmail") || normalized === "") return "Gmail";

  return "Sonstige Quelle";
}
