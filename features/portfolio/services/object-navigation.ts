import { getWorkspacePath } from "@/features/workspace/services/workspace/workspace-engine";

export type ObjectNavigationOrigin =
  | { from: "portfolio" }
  | { from: "vorgang"; vorgangId: string }
  | { from: "kunde"; vorgangId: string };

type ObjectPathOptions = {
  from?: ObjectNavigationOrigin["from"];
  vorgangId?: string;
};

/**
 * Builds `/objekte/{id}` with optional origin query so "Zurück" can return
 * to the real source (Vorgang / Kundenakte) instead of always `/objekte`.
 */
export function getObjektPath(
  objectId: string,
  options?: ObjectPathOptions
): string {
  const base = `/objekte/${encodeURIComponent(objectId)}`;
  if (!options?.from || options.from === "portfolio") {
    return base;
  }

  const params = new URLSearchParams();
  params.set("from", options.from);
  if (options.vorgangId) {
    params.set("vorgangId", options.vorgangId);
  }
  return `${base}?${params.toString()}`;
}

/** @deprecated Prefer getObjektPath — kept for existing real-estate imports. */
export function getRealEstateObjectPath(
  objectId: string,
  options?: ObjectPathOptions
): string {
  return getObjektPath(objectId, options);
}

export function parseObjectNavigationOrigin(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ObjectNavigationOrigin {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  const from = get("from");
  const vorgangId = get("vorgangId");

  if (from === "vorgang" && vorgangId) {
    return { from: "vorgang", vorgangId };
  }
  if (from === "kunde" && vorgangId) {
    return { from: "kunde", vorgangId };
  }
  return { from: "portfolio" };
}

export function parseObjektInitialTab(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): "uebersicht" | "dossier" {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  return get("tab") === "dossier" ? "dossier" : "uebersicht";
}

export function resolveObjectBackNavigation(origin: ObjectNavigationOrigin): {
  href: string;
  label: string;
} {
  switch (origin.from) {
    case "vorgang":
      return {
        href: getWorkspacePath(origin.vorgangId),
        label: "Zurück zum Vorgang",
      };
    case "kunde":
      return {
        href: `/kunden/akte/${encodeURIComponent(origin.vorgangId)}`,
        label: "Zurück zur Kundenakte",
      };
    case "portfolio":
    default:
      return {
        href: "/objekte",
        label: "Zurück zum Portfolio",
      };
  }
}
