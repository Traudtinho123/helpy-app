/** Einheitliche KI-Klassifikation für eingehende Mails. */

export type VorgangMailCategory =
  | "besichtigung"
  | "mietanfrage"
  | "kaufanfrage"
  | "allgemeine_anfrage"
  | "portal_anfrage"
  | "spam"
  | "newsletter"
  | "werbung"
  | "system"
  | "benachrichtigung";

export type VorgangArchiveCategory = "newsletter" | "werbung" | "system" | "spam";

export type MailClassificationResult = {
  ist_echter_vorgang: boolean;
  grund: string;
  kategorie: VorgangMailCategory;
  absender_typ: "privat_person" | "unternehmen" | "system" | "unbekannt";
};

const ARCHIVE_CATEGORIES = new Set<VorgangMailCategory>([
  "spam",
  "newsletter",
  "werbung",
  "system",
  "benachrichtigung",
]);

export function isArchiveMailCategory(
  category: VorgangMailCategory
): category is Exclude<VorgangMailCategory, "besichtigung" | "mietanfrage" | "kaufanfrage" | "allgemeine_anfrage" | "portal_anfrage"> {
  return ARCHIVE_CATEGORIES.has(category);
}

export function mapMailCategoryToArchiveCategory(
  category: VorgangMailCategory
): VorgangArchiveCategory {
  if (category === "newsletter") return "newsletter";
  if (category === "werbung") return "werbung";
  if (category === "system" || category === "benachrichtigung") return "system";
  return "spam";
}

export function inferArchiveCategoryFromText(input: {
  from?: string | null;
  subject?: string | null;
  snippet?: string | null;
}): VorgangArchiveCategory {
  const combined = `${input.from ?? ""} ${input.subject ?? ""} ${input.snippet ?? ""}`.toLowerCase();

  if (
    combined.includes("newsletter") ||
    combined.includes("unsubscribe") ||
    combined.includes("abmelden")
  ) {
    return "newsletter";
  }

  if (
    combined.includes("rabatt") ||
    combined.includes("sale") ||
    combined.includes("angebot") ||
    combined.includes("gutschein") ||
    combined.includes("werbung")
  ) {
    return "werbung";
  }

  if (
    combined.includes("noreply") ||
    combined.includes("no-reply") ||
    combined.includes("system") ||
    combined.includes("bestätigung") ||
    combined.includes("verification") ||
    combined.includes("code")
  ) {
    return "system";
  }

  return "spam";
}
