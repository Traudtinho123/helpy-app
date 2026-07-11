import {
  getDocumentCategoryLabel,
  getDocumentDisplayStatus,
  getDocumentFileName,
  getDocumentSourceLabel,
} from "@/features/documents/services";
import { resolveDocumentMailAttachment } from "@/features/mail/services/mail-attachment-resolver";
import { getObjektPath } from "@/features/portfolio/services/object-navigation";
import type { WorkspaceContext } from "@/features/workspace/context/workspace-context";
import { findWorkspaceDocument } from "@/features/workspace/context/workspace-context-service";
import type { WorkspacePanelViewModel } from "@/features/workspace/panels/workspace-panel-view";
import {
  getDokumentePath,
  getKundenaktePath,
} from "@/features/workspace/services/navigation/entity-navigation";

function field(label: string, value?: string | null, highlight?: boolean): {
  label: string;
  value: string;
  highlight?: boolean;
} | null {
  if (!value || value === "—") return null;
  return { label, value, highlight };
}

export function resolveKundePanelView(context: WorkspaceContext): WorkspacePanelViewModel {
  const { workspaceId, customer, vorgang } = context;
  const fallbackHref = getKundenaktePath(workspaceId);

  if (!customer) {
    return {
      title: "Kunde",
      status: "Nicht verfügbar",
      fields: [],
      canOpen: false,
      fallbackHref,
    };
  }

  const fields = [
    field("Name", customer.name, true),
    field("Firma", customer.firma),
    field("E-Mail", customer.email, true),
    field("Telefon", customer.telefon),
    field("Adresse", customer.adresse),
    field("Quelle", customer.quelle),
    field("Skill", customer.skillLabel),
    field("Betreff", customer.betreff),
  ].filter(Boolean) as WorkspacePanelViewModel["fields"];

  return {
    title: customer.name || "Kunde",
    status: customer.statusLabel || customer.status || "Vorbereitet",
    fields: fields.map((item) => ({ ...item, editable: true, editKey: item.label })),
    helpyHint: customer.helpyHint || vorgang.helpy.empfehlung,
    canOpen: fields.length > 0,
    fallbackHref,
  };
}

export function resolveObjektPanelView(context: WorkspaceContext): WorkspacePanelViewModel {
  const { workspaceId, object, mail } = context;
  const fallbackHref = object?.objectId
    ? getObjektPath(object.objectId, {
        from: "vorgang",
        vorgangId: workspaceId,
      })
    : undefined;

  if (!object) {
    return {
      title: "Objekt",
      status: "Nicht verfügbar",
      fields: [],
      canOpen: false,
      fallbackHref,
    };
  }

  const platform = object.platform;
  const fields =
    object.source === "object-memory"
      ? [
          field("Titel", object.titel, true),
          field("Adresse", object.adresse),
          field("Quelle", object.quelle),
          field("Preis", object.preis),
          field("Status", object.status),
        ]
      : [
          field("Objekt", platform?.objekt ?? object.titel, true),
          field("Adresse", platform?.adresse ?? object.adresse),
          field("Link", platform?.link, true),
          field("Besichtigung", platform?.besichtigung),
        ];

  const resolvedFields = fields.filter(Boolean) as WorkspacePanelViewModel["fields"];

  return {
    title: object.titel,
    status: object.status,
    fields: resolvedFields,
    helpyHint: mail.summary ?? mail.snippet,
    canOpen: resolvedFields.length > 0,
    fallbackHref,
  };
}

export function resolveDokumentPanelView(
  context: WorkspaceContext,
  input: {
    documentId?: string;
    fileName?: string;
    messageId?: string;
    focus?: "expose" | "offerte" | "dokument";
  }
): WorkspacePanelViewModel {
  const { workspaceId, vorgang, mailAttachments, recognizedDocuments } = context;
  const { documentId, focus, fileName, messageId } = input;
  const fallbackHref = getDokumentePath({
    vorgangId: workspaceId,
    documentId,
    focus: focus ?? (documentId ? null : "dokument"),
  });

  const document = findWorkspaceDocument(context, { documentId, focus });
  const recognized = documentId
    ? recognizedDocuments.find((entry) => entry.preparedDocumentId === documentId)
    : recognizedDocuments.find(
        (entry) =>
          (fileName && entry.fileName === fileName) ||
          (messageId && entry.messageId === messageId)
      );

  const mailAttachment = resolveDocumentMailAttachment(
    mailAttachments,
    document,
    recognized ??
      (fileName || messageId
        ? {
            fileName: fileName ?? document?.title ?? "",
            messageId,
            mimeType: document?.attachmentMeta?.mimeType ?? "",
          }
        : null)
  );

  if (!document) {
    const attachmentOnly = resolveDocumentMailAttachment(
      mailAttachments,
      null,
      fileName || messageId
        ? {
            fileName: fileName ?? "",
            messageId,
            mimeType: recognized?.mimeType ?? "",
          }
        : null
    );

    const workspaceDocs = vorgang.dokumente ?? [];
    if (workspaceDocs.length > 0) {
      const first = workspaceDocs[0];
      return {
        title: first.name,
        status: first.typ,
        fields: [
          field("Dateiname", first.name, true),
          field("Typ", first.typ),
          field("Datum", first.datum),
        ].filter(Boolean) as WorkspacePanelViewModel["fields"],
        canOpen: true,
        fallbackHref,
        mailAttachment: attachmentOnly,
      };
    }

    if (fileName || recognized) {
      return {
        title: fileName ?? recognized?.fileName ?? "Dokument",
        status: recognized?.status ?? "Von HELPY erkannt",
        fields: [
          field("Dateiname", fileName ?? recognized?.fileName, true),
          field("Kategorie", recognized?.categoryLabel),
          field("Quelle", recognized?.source),
        ].filter(Boolean) as WorkspacePanelViewModel["fields"],
        helpyHint: recognized?.recommendation,
        canOpen: true,
        fallbackHref,
        mailAttachment: attachmentOnly,
        assignedToLabel: recognized?.assignedToLabel ?? null,
        relatedObjectId: recognized?.relatedObjectId ?? null,
        relatedObjectTitle: context.object?.titel ?? null,
      };
    }

    return {
      title: "Dokument",
      status: "Nicht verfügbar",
      fields: [],
      canOpen: false,
      fallbackHref,
    };
  }

  return {
    title: getDocumentFileName(document),
    status: getDocumentDisplayStatus(document),
    fields: [
      field("Dateiname", getDocumentFileName(document), true),
      field("Kategorie", getDocumentCategoryLabel(document)),
      field("Quelle", getDocumentSourceLabel(document)),
      field("Kunde", document.customer),
      field("Objekt / Vorgang", document.links?.objectTitle ?? document.vorgangTitle),
      field("Datum", document.lastEdited),
    ].filter(Boolean) as WorkspacePanelViewModel["fields"],
    helpyHint: document.helpyHint,
    canOpen: true,
    fallbackHref,
    mailAttachment,
    assignedToLabel: recognized?.assignedToLabel ?? null,
    relatedObjectId: recognized?.relatedObjectId ?? document.links?.objectId ?? document.objectId ?? null,
    relatedObjectTitle:
      document.links?.objectTitle ??
      context.object?.titel ??
      null,
  };
}

export function resolveTerminPanelView(context: WorkspaceContext): WorkspacePanelViewModel {
  const { workspaceId, appointment } = context;
  const fallbackHref = `/kalender?vorgang=${encodeURIComponent(workspaceId)}&focus=besichtigung`;
  const appointmentSuggestion = appointment.suggestion;

  if (appointmentSuggestion) {
    const selectedSlot = appointmentSuggestion.slots.find(
      (slot) => slot.id === appointmentSuggestion.selectedSlotId
    );

    return {
      title: appointmentSuggestion.objekt ?? "Termin",
      status: appointmentSuggestion.status ?? "Vorbereitet",
      fields: [
        field("Objekt", appointmentSuggestion.objekt, true),
        field("Interessent", appointmentSuggestion.customer),
        field("Terminwunsch", appointment.terminwunsch),
        field(
          "Ausgewählter Termin",
          selectedSlot
            ? `${selectedSlot.dateLabel} · ${selectedSlot.label}`
            : appointmentSuggestion.viewingConfirmation?.dateLabel
        ),
      ].filter(Boolean) as WorkspacePanelViewModel["fields"],
      canOpen: true,
      fallbackHref,
    };
  }

  const termin = appointment.fallbackTermin;
  if (termin) {
    return {
      title: termin.titel,
      status: "Geplant",
      fields: [
        field("Termin", termin.titel, true),
        field("Datum", termin.datum),
        field("Ort", termin.ort),
      ].filter(Boolean) as WorkspacePanelViewModel["fields"],
      canOpen: true,
      fallbackHref,
    };
  }

  if (appointment.terminwunsch) {
    return {
      title: "Termin",
      status: "Terminwunsch erkannt",
      fields: [
        field("Terminwunsch", appointment.terminwunsch, true),
      ].filter(Boolean) as WorkspacePanelViewModel["fields"],
      canOpen: true,
      fallbackHref,
    };
  }

  return {
    title: "Termin",
    status: "Nicht verfügbar",
    fields: [],
    canOpen: false,
    fallbackHref,
  };
}

export function resolveAngebotPanelView(
  context: WorkspaceContext,
  input: { offerId?: string }
): WorkspacePanelViewModel {
  const { workspaceId, vorgang } = context;
  const { offerId } = input;
  const fallbackHref = getDokumentePath({
    vorgangId: workspaceId,
    documentId: offerId,
    focus: "offerte",
  });

  const document = offerId
    ? context.documents.find((entry) => entry.id === offerId)
    : findWorkspaceDocument(context, { focus: "offerte" });
  const angebot = vorgang.angebot;

  if (document) {
    return {
      title: document.title,
      status: getDocumentDisplayStatus(document),
      fields: [
        field("Angebot", document.title, true),
        field("Typ", document.typeLabel),
        field("Kunde", document.customer),
        field("Status", getDocumentDisplayStatus(document)),
        field("Datum", document.lastEdited),
      ].filter(Boolean) as WorkspacePanelViewModel["fields"],
      helpyHint: document.helpyHint,
      canOpen: true,
      fallbackHref,
    };
  }

  if (angebot) {
    const netto = angebot.positionen.reduce(
      (sum, position) => sum + position.menge * position.einzelpreis,
      0
    );

    return {
      title: angebot.angebotNr,
      status: angebot.status,
      fields: [
        field("Angebotsnummer", angebot.angebotNr, true),
        field("Status", angebot.status),
        field("Positionen", String(angebot.positionen.length)),
        field(
          "Netto",
          new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
          }).format(netto)
        ),
        field("Frist", angebot.deadline),
      ].filter(Boolean) as WorkspacePanelViewModel["fields"],
      canOpen: true,
      fallbackHref,
    };
  }

  return {
    title: "Angebot",
    status: "Nicht verfügbar",
    fields: [],
    canOpen: false,
    fallbackHref,
  };
}
