export type GlobalSearchCategory =
  | "kunde"
  | "objekt"
  | "gmail"
  | "dokument"
  | "besichtigung"
  | "offerte"
  | "kalender"
  | "pipeline"
  | "memory";

export type GlobalSearchEntry = {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  subtitle: string;
  href: string;
  searchText: string;
};

export type GlobalSearchResultGroup = {
  category: GlobalSearchCategory;
  label: string;
  items: GlobalSearchEntry[];
};

export type GlobalSearchResults = {
  query: string;
  groups: GlobalSearchResultGroup[];
  totalCount: number;
};

export const GLOBAL_SEARCH_CATEGORY_LABELS: Record<GlobalSearchCategory, string> =
  {
    kunde: "Kunden",
    objekt: "Objekte",
    gmail: "Gmail",
    dokument: "Dokumente",
    besichtigung: "Besichtigungen",
    offerte: "Offerten",
    kalender: "Kalender",
    pipeline: "Pipeline",
    memory: "Memory",
  };

export const GLOBAL_SEARCH_CATEGORY_ORDER: GlobalSearchCategory[] = [
  "kunde",
  "objekt",
  "gmail",
  "dokument",
  "besichtigung",
  "offerte",
  "kalender",
  "pipeline",
  "memory",
];
