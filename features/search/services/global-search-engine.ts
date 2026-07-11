import { subscribeCrmPipeline } from "@/features/crm/pipeline/pipeline-store";
import { subscribeIntelligenceCustomerMemory } from "@/features/intelligence/customer-memory/customer-memory-store";
import { subscribeDocuments } from "@/features/documents/services/document-engine";
import { subscribeKundenakte } from "@/features/kundenakte/services/kundenakte-store";
import { subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import {
  buildGlobalSearchIndex,
  normalizeSearchText,
} from "@/features/search/services/global-search-index";
import type {
  GlobalSearchCategory,
  GlobalSearchEntry,
  GlobalSearchResults,
  GlobalSearchResultGroup,
} from "@/features/search/types/global-search-types";
import {
  GLOBAL_SEARCH_CATEGORY_LABELS,
  GLOBAL_SEARCH_CATEGORY_ORDER,
} from "@/features/search/types/global-search-types";
import { subscribeAllMailVorgaenge } from "@/features/mail";

let indexCache: GlobalSearchEntry[] | null = null;
let indexGeneration = 0;

const resultsCache = new Map<
  string,
  { generation: number; value: GlobalSearchResults }
>();

export const EMPTY_SEARCH_RESULTS: GlobalSearchResults = {
  query: "",
  groups: [],
  totalCount: 0,
};

export function invalidateGlobalSearchIndex(): void {
  if (indexCache === null) {
    return;
  }
  indexCache = null;
  indexGeneration += 1;
}

function getSearchIndex(): GlobalSearchEntry[] {
  if (!indexCache) {
    indexCache = buildGlobalSearchIndex();
  }
  return indexCache;
}

function scoreMatch(entry: GlobalSearchEntry, query: string): number {
  const title = normalizeSearchText(entry.title);
  const subtitle = normalizeSearchText(entry.subtitle);

  if (title.startsWith(query)) return 0;
  if (title.includes(query)) return 1;
  if (subtitle.includes(query)) return 2;
  return 3;
}

export function searchGlobal(
  query: string,
  limitPerCategory = 5
): GlobalSearchResults {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return EMPTY_SEARCH_RESULTS;
  }

  const cacheKey = `${normalizedQuery}\0${limitPerCategory}`;
  const cached = resultsCache.get(cacheKey);
  if (cached?.generation === indexGeneration) {
    return cached.value;
  }

  const matches = getSearchIndex()
    .filter((entry) => entry.searchText.includes(normalizedQuery))
    .sort((a, b) => scoreMatch(a, normalizedQuery) - scoreMatch(b, normalizedQuery));

  const grouped = new Map<GlobalSearchCategory, GlobalSearchEntry[]>();

  for (const entry of matches) {
    const bucket = grouped.get(entry.category) ?? [];
    if (bucket.length >= limitPerCategory) continue;
    bucket.push(entry);
    grouped.set(entry.category, bucket);
  }

  const groups: GlobalSearchResultGroup[] = GLOBAL_SEARCH_CATEGORY_ORDER.flatMap(
    (category) => {
      const items = grouped.get(category);
      if (!items?.length) return [];
      return [
        {
          category,
          label: GLOBAL_SEARCH_CATEGORY_LABELS[category],
          items,
        },
      ];
    }
  );

  const results: GlobalSearchResults = {
    query,
    groups,
    totalCount: matches.length,
  };

  resultsCache.set(cacheKey, { generation: indexGeneration, value: results });
  return results;
}

export function subscribeGlobalSearch(listener: () => void): () => void {
  let generationAtSubscribe = indexGeneration;

  const invalidateAndNotify = () => {
    const hadIndex = indexCache !== null;
    invalidateGlobalSearchIndex();
    if (!hadIndex && indexGeneration === generationAtSubscribe) {
      return;
    }
    generationAtSubscribe = indexGeneration;
    listener();
  };

  const unsubMail = subscribeAllMailVorgaenge(invalidateAndNotify);
  const unsubObjects = subscribeRealEstateObjects(invalidateAndNotify);
  const unsubDocuments = subscribeDocuments(invalidateAndNotify);
  const unsubMemory = subscribeIntelligenceCustomerMemory(invalidateAndNotify);
  const unsubPipeline = subscribeCrmPipeline(invalidateAndNotify);
  const unsubKundenakte = subscribeKundenakte(invalidateAndNotify);

  return () => {
    unsubMail();
    unsubObjects();
    unsubDocuments();
    unsubMemory();
    unsubPipeline();
    unsubKundenakte();
  };
}
