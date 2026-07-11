import { getAllDocuments } from "@/features/documents/services/document-engine";
import {
  DOCUMENT_OVERVIEW_FILTER_ORDER,
  isRealOverviewDocument,
  matchesOverviewFilter,
  sortOverviewDocuments,
  type DocumentOverviewFilter,
} from "@/features/documents/services/document-overview-utils";
import type { PreparedDocument } from "@/features/documents/services/types";

export type DocumentOverviewCounts = Record<DocumentOverviewFilter, number>;

function dedupeOverviewDocuments(
  documents: PreparedDocument[]
): PreparedDocument[] {
  const seen = new Set<string>();
  const result: PreparedDocument[] = [];

  for (const document of documents) {
    const key =
      document.attachmentMeta?.dedupeKey ??
      `${document.id}:${document.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(document);
  }

  return result;
}

function getRealOverviewDocuments(): PreparedDocument[] {
  return dedupeOverviewDocuments(
    getAllDocuments().filter(isRealOverviewDocument)
  );
}

export function getOverviewFilterCounts(): DocumentOverviewCounts {
  const documents = getRealOverviewDocuments();

  return DOCUMENT_OVERVIEW_FILTER_ORDER.reduce<DocumentOverviewCounts>(
    (counts, filter) => {
      counts[filter] =
        filter === "alle"
          ? documents.length
          : documents.filter((document) =>
              matchesOverviewFilter(document, filter)
            ).length;
      return counts;
    },
    {} as DocumentOverviewCounts
  );
}

export function getOverviewDocuments(
  filter: DocumentOverviewFilter,
  query = ""
): PreparedDocument[] {
  const normalized = query.trim().toLowerCase();
  let documents = getRealOverviewDocuments().filter((document) =>
    matchesOverviewFilter(document, filter)
  );

  if (normalized) {
    documents = documents.filter((document) => {
      const haystack = [
        document.title,
        document.customer,
        document.typeLabel,
        document.vorgangTitle ?? "",
        document.links?.objectTitle ?? "",
        document.attachmentMeta?.fileName ?? "",
        document.attachmentMeta?.recognizedCategory ?? "",
        document.attachmentMeta?.sourcePlatform ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }

  return sortOverviewDocuments(documents);
}

export function hasRealOverviewDocuments(): boolean {
  return getRealOverviewDocuments().length > 0;
}
