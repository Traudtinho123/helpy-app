export type {
  GlobalSearchCategory,
  GlobalSearchEntry,
  GlobalSearchResultGroup,
  GlobalSearchResults,
} from "@/features/search/types/global-search-types";

export {
  GLOBAL_SEARCH_CATEGORY_LABELS,
  GLOBAL_SEARCH_CATEGORY_ORDER,
} from "@/features/search/types/global-search-types";

export {
  buildGlobalSearchIndex,
  normalizeSearchText,
} from "@/features/search/services/global-search-index";

export {
  EMPTY_SEARCH_RESULTS,
  invalidateGlobalSearchIndex,
  searchGlobal,
  subscribeGlobalSearch,
} from "@/features/search/services/global-search-engine";

export { GlobalSearch, GlobalSearchResultLink } from "@/features/search/components/global-search";
