import type { PreparedDocument } from "@/features/documents/services/types";

export type DocumentOverviewFilter =
  | "alle"
  | "expose"
  | "grundriss"
  | "ausweis"
  | "finanzierungsbestaetigung"
  | "vertrag"
  | "sonstige";

export const DOCUMENT_OVERVIEW_FILTER_LABELS: Record<
  DocumentOverviewFilter,
  string
> = {
  alle: "Alle",
  expose: "Exposés",
  grundriss: "Grundrisse",
  ausweis: "Ausweise",
  finanzierungsbestaetigung: "Finanzierungsbestätigungen",
  vertrag: "Verträge",
  sonstige: "Sonstige",
};

export const DOCUMENT_OVERVIEW_FILTER_ORDER: DocumentOverviewFilter[] = [
  "alle",
  "expose",
  "grundriss",
  "ausweis",
  "finanzierungsbestaetigung",
  "vertrag",
  "sonstige",
];

const STATIC_MOCK_DOCUMENT_ID = /^doc-\d+$/;

export function isRealOverviewDocument(document: PreparedDocument): boolean {
  if (document.category === "vorlage") return false;
  if (document.attachmentMeta) return true;
  if (STATIC_MOCK_DOCUMENT_ID.test(document.id)) return false;
  if (
    document.id.startsWith("recognized-") ||
    document.id.startsWith("expose-") ||
    document.id.startsWith("obj-doc-")
  ) {
    return true;
  }
  return document.preparedByHelpy;
}

export function getDocumentFileName(document: PreparedDocument): string {
  return document.attachmentMeta?.fileName ?? document.title;
}

export function getDocumentCategoryLabel(document: PreparedDocument): string {
  return document.attachmentMeta?.recognizedCategory ?? document.typeLabel;
}

export function getDocumentSourceLabel(document: PreparedDocument): string {
  return document.attachmentMeta?.sourcePlatform ?? "HELPY vorbereitet";
}

export function getDocumentObjectOrVorgangLabel(
  document: PreparedDocument
): string {
  if (document.links?.objectTitle) return document.links.objectTitle;
  if (document.vorgangTitle) return document.vorgangTitle;
  return "—";
}

export function getDocumentAssignedToLabel(document: PreparedDocument): string {
  const parts: string[] = [];

  if (document.customer && document.customer !== "—") {
    parts.push(`Kunde · ${document.customer}`);
  }

  if (document.links?.objectTitle) {
    parts.push(`Objekt · ${document.links.objectTitle}`);
  } else if (document.vorgangTitle) {
    parts.push(`Vorgang · ${document.vorgangTitle}`);
  }

  return parts.join(" · ") || "—";
}

export function getDocumentOverviewCategory(
  document: PreparedDocument
): Exclude<DocumentOverviewFilter, "alle"> {
  const label = getDocumentCategoryLabel(document).toLowerCase();
  const typeId = document.typeId;

  if (
    typeId === "expose" ||
    label.includes("exposé") ||
    label.includes("expose")
  ) {
    return "expose";
  }

  if (label.includes("grundriss") || label.includes("plan")) {
    return "grundriss";
  }

  if (label.includes("ausweis")) {
    return "ausweis";
  }

  if (label.includes("finanzier")) {
    return "finanzierungsbestaetigung";
  }

  if (
    label.includes("vertrag") ||
    typeId === "reservationsbestaetigung" ||
    typeId === "mandatsbestaetigung" ||
    typeId === "auftragsbestaetigung"
  ) {
    return "vertrag";
  }

  return "sonstige";
}

export function matchesOverviewFilter(
  document: PreparedDocument,
  filter: DocumentOverviewFilter
): boolean {
  if (filter === "alle") return true;
  return getDocumentOverviewCategory(document) === filter;
}

export function sortOverviewDocuments(
  documents: PreparedDocument[]
): PreparedDocument[] {
  return [...documents].sort((left, right) => {
    const leftRecognized = Boolean(left.attachmentMeta);
    const rightRecognized = Boolean(right.attachmentMeta);

    if (leftRecognized !== rightRecognized) {
      return leftRecognized ? -1 : 1;
    }

    const leftPrepared = left.preparedByHelpy ? 0 : 1;
    const rightPrepared = right.preparedByHelpy ? 0 : 1;
    if (leftPrepared !== rightPrepared) {
      return leftPrepared - rightPrepared;
    }

    return getDocumentFileName(left).localeCompare(
      getDocumentFileName(right),
      "de"
    );
  });
}
