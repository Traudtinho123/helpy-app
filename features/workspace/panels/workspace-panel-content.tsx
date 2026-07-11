"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateKundenakteFields } from "@/features/kundenakte/services/kundenakte-engine";
import { resolveDocumentMailAttachment } from "@/features/mail/services/mail-attachment-resolver";
import { findWorkspaceDocument } from "@/features/workspace/context/workspace-context-service";
import { useWorkspaceContext } from "@/features/workspace/context/workspace-context-provider";
import { useWorkspaceMailAttachments } from "@/features/workspace/hooks/use-workspace-mail-attachments";
import {
  resolveAngebotPanelView,
  resolveDokumentPanelView,
  resolveKundePanelView,
  resolveObjektPanelView,
  resolveTerminPanelView,
} from "@/features/workspace/panels/workspace-panel-resolvers";
import {
  WorkspaceDocumentPreview,
  WorkspaceDocumentPreviewUnavailable,
} from "@/features/workspace/panels/workspace-document-preview";
import { WorkspaceObjectAssignmentSection } from "@/features/workspace/panels/workspace-object-assignment-section";
import type {
  AnyWorkspacePanel,
} from "@/features/workspace/panels/workspace-panel-types";
import type { WorkspaceContext } from "@/features/workspace/context/workspace-context";
import type { WorkspacePanelViewModel } from "@/features/workspace/panels/workspace-panel-view";
import { getObjektPathFromVorgang } from "@/features/workspace/services/navigation/entity-navigation";
import { cn } from "@/lib/utils";

type WorkspacePanelContentProps = {
  panel: AnyWorkspacePanel;
  onClose: () => void;
};

function resolvePanelViewModel(
  panel: AnyWorkspacePanel,
  context: WorkspaceContext
): WorkspacePanelViewModel {
  switch (panel.kind) {
    case "kunde":
      return resolveKundePanelView(context);
    case "objekt":
      return resolveObjektPanelView(context);
    case "dokument":
      return resolveDokumentPanelView(context, {
        documentId: panel.payload.documentId,
        fileName: panel.payload.fileName,
        messageId: panel.payload.messageId,
        focus: panel.payload.focus,
      });
    case "termin":
      return resolveTerminPanelView(context);
    case "angebot":
      return resolveAngebotPanelView(context, {
        offerId: panel.payload.offerId,
      });
  }
}

const KUNDE_FIELD_MAP: Record<string, "name" | "firma" | "email" | "telefon" | "adresse"> = {
  Name: "name",
  Firma: "firma",
  "E-Mail": "email",
  Telefon: "telefon",
  Adresse: "adresse",
};

export function WorkspacePanelContent({ panel, onClose }: WorkspacePanelContentProps) {
  const context = useWorkspaceContext();
  const { attachments: liveAttachments, loading: attachmentsLoading } =
    useWorkspaceMailAttachments(context.workspaceId);
  const view = useMemo(
    () => resolvePanelViewModel(panel, context),
    [context, panel]
  );

  const dokumentAttachment = useMemo(() => {
    if (panel.kind !== "dokument") return view.mailAttachment ?? null;

    const document = findWorkspaceDocument(context, {
      documentId: panel.payload.documentId,
      focus: panel.payload.focus,
    });
    const recognized = panel.payload.documentId
      ? context.recognizedDocuments.find(
          (entry) => entry.preparedDocumentId === panel.payload.documentId
        )
      : context.recognizedDocuments.find(
          (entry) =>
            (panel.payload.fileName && entry.fileName === panel.payload.fileName) ||
            (panel.payload.messageId && entry.messageId === panel.payload.messageId)
        );

    return (
      resolveDocumentMailAttachment(liveAttachments, document, recognized) ??
      view.mailAttachment ??
      null
    );
  }, [context, liveAttachments, panel, view.mailAttachment]);
  const [editing, setEditing] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const startEditing = useCallback(() => {
    const initial: Record<string, string> = {};
    for (const field of view.fields) {
      initial[field.label] = field.value;
    }
    setDraftValues(initial);
    setEditing(true);
  }, [view.fields]);

  const handleSave = useCallback(() => {
    if (panel.kind === "kunde") {
      const kundenakteStatus = context.customer?.status;
      if (context.customer && kundenakteStatus !== "bestaetigt") {
        const fields: Partial<
          Record<"name" | "firma" | "email" | "telefon" | "adresse", string>
        > = {};

        for (const [label, value] of Object.entries(draftValues)) {
          const key = KUNDE_FIELD_MAP[label];
          if (key) fields[key] = value;
        }

        if (Object.keys(fields).length > 0) {
          updateKundenakteFields(panel.payload.vorgangId, fields);
        }
      }
    }

    setEditing(false);
  }, [context.customer, draftValues, panel]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-3 py-1 text-[11px] font-semibold text-[#2563EB]">
            {view.status}
          </span>
        </div>

        {panel.kind === "dokument" || panel.kind === "objekt" ? (
          <WorkspaceObjectAssignmentSection
            vorgangId={panel.payload.vorgangId}
            compact={panel.kind === "dokument"}
          />
        ) : null}

        {panel.kind === "dokument" ? (
          dokumentAttachment ? (
            <WorkspaceDocumentPreview
              attachment={dokumentAttachment}
              loading={attachmentsLoading}
            />
          ) : (
            <WorkspaceDocumentPreviewUnavailable
              fileName={panel.payload.fileName ?? view.title}
              loading={attachmentsLoading}
            />
          )
        ) : null}

        {view.fields.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-[#64748B]">
            Keine Informationen verfügbar.
          </p>
        ) : (
          <dl className="space-y-3">
            {view.fields.map((field) => (
              <div
                key={field.label}
                className="rounded-[12px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 px-3.5 py-3"
              >
                <dt className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                  {field.label}
                </dt>
                <dd className="mt-1 break-words text-[13px] font-medium text-[#0F172A]">
                  {editing ? (
                    <input
                      value={draftValues[field.label] ?? field.value}
                      onChange={(event) =>
                        setDraftValues((current) => ({
                          ...current,
                          [field.label]: event.target.value,
                        }))
                      }
                      className="w-full rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[12px] font-normal text-[#0F172A] outline-none focus:border-[#BFDBFE]"
                    />
                  ) : (
                    <span className={cn(field.highlight && "font-semibold text-[#2563EB]")}>
                      {field.value}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {view.helpyHint && (
          <div className="mt-5 rounded-[12px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3.5 py-3">
            <p className="text-[11px] font-semibold text-[#2563EB]">Hinweis von HELPY</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
              {view.helpyHint}
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#CBD5E1]/40 px-6 py-4">
        {!editing ? (
          <Button
            type="button"
            variant="outline"
            onClick={startEditing}
            disabled={view.fields.length === 0}
            className="h-9 rounded-[10px] border-[#CBD5E1]/60 px-4 text-[12px] font-medium"
          >
            Bearbeiten
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSave}
            className="h-9 rounded-[10px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Speichern
          </Button>
        )}
        {panel.kind === "objekt" && panel.payload.objectId ? (
          <Link
            href={getObjektPathFromVorgang(
              panel.payload.objectId,
              panel.payload.vorgangId
            )}
            className="inline-flex h-9 items-center justify-center rounded-[10px] border border-[#CBD5E1]/60 bg-white px-4 text-[12px] font-medium text-[#334155] transition-colors hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]"
          >
            Objektakte öffnen
          </Link>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-9 rounded-[10px] border-[#CBD5E1]/60 px-4 text-[12px] font-medium"
        >
          Schließen
        </Button>
      </div>
    </div>
  );
}
