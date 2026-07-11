import type { PreparedDocument } from "@/features/documents/services/types";
import type { RealEstateObject } from "@/features/real-estate/object/object-types";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";

/** Stabile Fallback-Referenzen für Detailseiten (nie inline [] oder {} erzeugen). */
export const EMPTY_OBJECT: RealEstateObject | null = null;
export const EMPTY_CUSTOMER: Kundenakte | null = null;
export const EMPTY_DOCUMENTS: readonly PreparedDocument[] = [];
export const EMPTY_SEARCH_RESULTS: readonly unknown[] = [];
