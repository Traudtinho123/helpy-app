import { getObjektPath } from "@/features/portfolio/services/object-navigation";
import { getWorkspacePath } from "@/features/workspace/services/workspace/workspace-engine";

export type EntityNavigationFrom = "vorgang" | "kunde" | "portfolio";

/** Kundenakte-Pfad. Zurück führt über die Akte selbst zum Vorgang. */
export function getKundenaktePath(vorgangId: string): string {
  return `/kunden/akte/${encodeURIComponent(vorgangId)}`;
}

type DokumentePathOptions = {
  vorgangId?: string | null;
  documentId?: string | null;
  focus?: "expose" | "offerte" | "dokument" | null;
  selected?: string | null;
};

/**
 * Dokumente-Pfad. Mit `vorgangId` zeigt die Dokumente-Seite
 * „Zurück zum Vorgang“.
 */
export function getDokumentePath(options: DokumentePathOptions = {}): string {
  const params = new URLSearchParams();

  if (options.vorgangId) {
    params.set("vorgang", options.vorgangId);
  }

  if (options.focus) {
    params.set("focus", options.focus);
  }

  const selected = options.selected ?? options.documentId;
  if (selected) {
    params.set("selected", selected);
  }

  const query = params.toString();
  return query ? `/dokumente?${query}` : "/dokumente";
}

export function getVorgangPath(vorgangId: string): string {
  return getWorkspacePath(vorgangId);
}

export function getObjektPathFromVorgang(
  objectId: string,
  vorgangId: string
): string {
  return getObjektPath(objectId, { from: "vorgang", vorgangId });
}
