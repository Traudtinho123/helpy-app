import {
  buildWorkspaceContext,
  peekWorkspaceContext,
} from "@/features/workspace/context/workspace-context-service";
import { openWorkspacePanel } from "@/features/workspace/panels/workspace-panel-stack";
import {
  resolveAngebotPanelView,
  resolveDokumentPanelView,
  resolveKundePanelView,
  resolveObjektPanelView,
  resolveTerminPanelView,
} from "@/features/workspace/panels/workspace-panel-resolvers";
import type { WorkspaceContext } from "@/features/workspace/context/workspace-context";
import {
  getMailListeVorgang,
  getMailWorkspaceVorgang,
} from "@/features/mail/unified-mail-source-service";
import {
  buildWorkspaceVorgangFromListe,
  getWorkspaceVorgang,
} from "@/features/workspace/services/workspace/workspace-engine";
import {
  getGmailListeVorgang,
  getGmailWorkspaceVorgang,
} from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { getOutlookListeVorgang, getOutlookWorkspaceVorgang } from "@/features/outlook/services/outlook-vorgaenge-store";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { getObjektPath } from "@/features/portfolio/services/object-navigation";
import {
  getDokumentePath,
  getKundenaktePath,
} from "@/features/workspace/services/navigation/entity-navigation";

export type WorkspacePanelOpenResult = {
  opened: boolean;
  fallbackHref?: string;
};

function resolvePanelContext(vorgangId: string): WorkspaceContext | null {
  const cached = peekWorkspaceContext(vorgangId);
  if (cached) return cached;

  const listeVorgang =
    getMailListeVorgang(vorgangId) ??
    getGmailListeVorgang(vorgangId) ??
    getOutlookListeVorgang(vorgangId);
  const vorgang =
    getMailWorkspaceVorgang(vorgangId) ??
    getGmailWorkspaceVorgang(vorgangId) ??
    getOutlookWorkspaceVorgang(vorgangId) ??
    (listeVorgang ? buildWorkspaceVorgangFromListe(listeVorgang) : null) ??
    getWorkspaceVorgang(vorgangId);

  if (!vorgang) return null;

  return buildWorkspaceContext(vorgang, listeVorgang ?? undefined);
}

export function openWorkspacePanelWithFallback(
  result: WorkspacePanelOpenResult,
  navigate: (href: string) => void
): void {
  if (result.opened) return;
  if (result.fallbackHref) navigate(result.fallbackHref);
}

export function openKundePanel(input: { vorgangId: string }): WorkspacePanelOpenResult {
  const fallbackHref = getKundenaktePath(input.vorgangId);
  const context = resolvePanelContext(input.vorgangId);
  if (!context) {
    return {
      opened: false,
      fallbackHref,
    };
  }

  const view = resolveKundePanelView(context);

  if (!view.canOpen) {
    return { opened: false, fallbackHref: view.fallbackHref ?? fallbackHref };
  }

  openWorkspacePanel({
    kind: "kunde",
    title: view.title,
    payload: {
      vorgangId: input.vorgangId,
      customerName: context.customer?.name,
      customerEmail: context.customer?.email,
    },
  });

  return { opened: true, fallbackHref: view.fallbackHref ?? fallbackHref };
}

export function openObjektPanel(input: { vorgangId: string }): WorkspacePanelOpenResult {
  const context = resolvePanelContext(input.vorgangId);
  const objectId =
    context?.object?.objectId ??
    peekRealEstateObjectByVorgangId(input.vorgangId)?.objectId ??
    null;

  const fallbackHref = objectId
    ? getObjektPath(objectId, {
        from: "vorgang",
        vorgangId: input.vorgangId,
      })
    : undefined;

  if (!context) {
    return { opened: false, fallbackHref };
  }

  const view = resolveObjektPanelView(context);

  if (!view.canOpen) {
    return {
      opened: false,
      fallbackHref: view.fallbackHref ?? fallbackHref,
    };
  }

  openWorkspacePanel({
    kind: "objekt",
    title: view.title,
    payload: {
      vorgangId: input.vorgangId,
      objectId: objectId ?? undefined,
      objectTitle: view.title,
    },
  });

  return { opened: true, fallbackHref: view.fallbackHref ?? fallbackHref };
}

export function openDokumentPanel(input: {
  vorgangId: string;
  documentId?: string;
  fileName?: string;
  messageId?: string;
  focus?: "expose" | "offerte" | "dokument";
}): WorkspacePanelOpenResult {
  const fallbackHref = getDokumentePath({
    vorgangId: input.vorgangId,
    documentId: input.documentId,
    focus: input.focus,
  });

  const context = resolvePanelContext(input.vorgangId);
  if (!context) {
    return {
      opened: false,
      fallbackHref,
    };
  }

  const view = resolveDokumentPanelView(context, {
    documentId: input.documentId,
    fileName: input.fileName,
    messageId: input.messageId,
    focus: input.focus,
  });

  if (!view.canOpen) {
    return {
      opened: false,
      fallbackHref: view.fallbackHref ?? fallbackHref,
    };
  }

  openWorkspacePanel({
    kind: "dokument",
    title: view.title,
    payload: {
      vorgangId: input.vorgangId,
      documentId: input.documentId,
      fileName: input.fileName,
      messageId: input.messageId,
      focus: input.focus,
    },
  });

  return { opened: true, fallbackHref: view.fallbackHref ?? fallbackHref };
}

export function openTerminPanel(input: { vorgangId: string }): WorkspacePanelOpenResult {
  const context = resolvePanelContext(input.vorgangId);
  if (!context) {
    return {
      opened: false,
      fallbackHref: `/kalender?vorgang=${encodeURIComponent(input.vorgangId)}&focus=besichtigung`,
    };
  }

  const view = resolveTerminPanelView(context);

  if (!view.canOpen) {
    return { opened: false, fallbackHref: view.fallbackHref };
  }

  openWorkspacePanel({
    kind: "termin",
    title: view.title,
    payload: {
      vorgangId: input.vorgangId,
      dateLabel: view.fields.find((field) => field.label.includes("Termin"))?.value,
    },
  });

  return { opened: true, fallbackHref: view.fallbackHref };
}

export function openAngebotPanel(input: {
  vorgangId: string;
  offerId?: string;
}): WorkspacePanelOpenResult {
  const fallbackHref = getDokumentePath({
    vorgangId: input.vorgangId,
    documentId: input.offerId,
    focus: "offerte",
  });

  const context = resolvePanelContext(input.vorgangId);
  if (!context) {
    return {
      opened: false,
      fallbackHref,
    };
  }

  const view = resolveAngebotPanelView(context, { offerId: input.offerId });

  if (!view.canOpen) {
    return {
      opened: false,
      fallbackHref: view.fallbackHref ?? fallbackHref,
    };
  }

  openWorkspacePanel({
    kind: "angebot",
    title: view.title,
    payload: {
      vorgangId: input.vorgangId,
      offerId: input.offerId,
      offerTitle: view.title,
    },
  });

  return { opened: true, fallbackHref: view.fallbackHref ?? fallbackHref };
}
