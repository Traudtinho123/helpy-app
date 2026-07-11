import type { GlobalSearchEntry } from "@/features/search/types/global-search-types";

/** Demo-Einträge für typische Suchszenarien (Bahnhofstrasse, Budget 950'000). */
export const GLOBAL_SEARCH_MOCK_ENTRIES: GlobalSearchEntry[] = [
  {
    id: "mock-obj-bahnhofstrasse",
    category: "objekt",
    title: "Attikawohnung Bahnhofstrasse 14",
    subtitle: "8001 Zürich · Verkauf · 4.5 Zi.",
    href: "/vorgaenge",
    searchText:
      "attikawohnung bahnhofstrasse 14 8001 zuerich zürich verkauf 4.5 zi objekt immobilie",
  },
  {
    id: "mock-kunde-bahnhofstrasse",
    category: "kunde",
    title: "Familie Berger",
    subtitle: "Interessent · Bahnhofstrasse 14 · Zürich",
    href: "/kunden",
    searchText:
      "familie berger interessent bahnhofstrasse 14 zuerich zürich kunde",
  },
  {
    id: "mock-kalender-bahnhofstrasse",
    category: "kalender",
    title: "Besichtigung Bahnhofstrasse 14",
    subtitle: "Freitag, 18:30 · Familie Berger",
    href: "/kalender?focus=besichtigung",
    searchText:
      "besichtigung bahnhofstrasse 14 freitag 18:30 familie berger termin kalender",
  },
  {
    id: "mock-dokument-bahnhofstrasse",
    category: "dokument",
    title: "Exposé — Bahnhofstrasse 14",
    subtitle: "Attikawohnung · zur Prüfung",
    href: "/dokumente?focus=expose",
    searchText: "expose bahnhofstrasse 14 attikawohnung dokument",
  },
  {
    id: "mock-memory-budget-950",
    category: "memory",
    title: "Budget: 950.000 CHF",
    subtitle: "Familie Berger · Immobiliensuche Zürich",
    href: "/kunden",
    searchText:
      "budget 950000 950.000 chf 950 000 familie berger immobiliensuche zuerich memory",
  },
  {
    id: "mock-kunde-budget-950",
    category: "kunde",
    title: "Familie Berger",
    subtitle: "Budget 950.000 CHF · Attikawohnung gesucht",
    href: "/kunden",
    searchText:
      "familie berger budget 950000 950.000 chf kunde interessent zuerich",
  },
  {
    id: "mock-obj-budget-950",
    category: "objekt",
    title: "Attikawohnung Bahnhofstrasse 14",
    subtitle: "Kaufpreis 1.120.000 CHF · passt zu Budget 950'000",
    href: "/vorgaenge",
    searchText:
      "attikawohnung bahnhofstrasse 14 1120000 950000 budget objekt zuerich",
  },
  {
    id: "mock-besichtigung-mueller",
    category: "besichtigung",
    title: "Besichtigung — Weber & Co.",
    subtitle: "Thomas Müller · Gewerbeeinheit Industriestraße",
    href: "/kalender?focus=besichtigung",
    searchText:
      "besichtigung thomas mueller müller weber co gewerbeeinheit industriestrasse termin",
  },
  {
    id: "mock-gmail-mueller",
    category: "gmail",
    title: "Angebotsanfrage Büroausstattung",
    subtitle: "Thomas Müller · Weber & Co. GmbH",
    href: "/workspace/weber-angebot",
    searchText:
      "angebotsanfrage bueroausstattung thomas mueller müller weber co gmail mail",
  },
];
