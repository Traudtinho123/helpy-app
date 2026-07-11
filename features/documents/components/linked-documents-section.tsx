"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import {
  getDocumentsForCustomer,
  getDocumentsForObject,
  subscribeDocuments,
} from "@/features/documents/services/document-engine";
import {
  DOCUMENT_STATUS_LABELS,
  type PreparedDocument,
} from "@/features/documents/services/types";
import {
  openAngebotPanel,
  openDokumentPanel,
  openWorkspacePanelWithFallback,
} from "@/features/workspace/panels/workspace-panel-openers";
import { getDokumentePath } from "@/features/workspace/services/navigation/entity-navigation";
import { SectionCard } from "@/features/workspace/components/workspace-sections";
import { useOptionalWorkspaceContext } from "@/features/workspace/context";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";

type LinkedDocumentsSectionProps = {
  objectId?: string;
  vorgangId?: string;
  customerEmail?: string;
};

function buildDocumentHref(
  document: PreparedDocument,
  fallbackVorgangId?: string
): string {
  const vorgangId = document.vorgangId ?? fallbackVorgangId ?? null;

  if (document.attachmentMeta) {
    return getDokumentePath({
      vorgangId,
      selected: document.id,
    });
  }

  if (!vorgangId) {
    return getDokumentePath({ selected: document.id });
  }

  if (document.typeId === "expose") {
    return getDokumentePath({
      vorgangId,
      documentId: document.id,
      focus: "expose",
    });
  }

  if (document.typeId === "offerte" || document.typeId === "angebot") {
    return getDokumentePath({
      vorgangId,
      documentId: document.id,
      focus: "offerte",
    });
  }

  return getDokumentePath({
    vorgangId,
    selected: document.id,
  });
}

export function LinkedDocumentsSection({
  objectId,
  vorgangId,
  customerEmail,
}: LinkedDocumentsSectionProps) {
  const router = useRouter();
  const workspaceContext = useOptionalWorkspaceContext();
  const revision = useStoreRevision(subscribeDocuments);

  const storeDocuments = useMemo((): readonly PreparedDocument[] => {
    if (objectId) {
      return getDocumentsForObject(objectId);
    }
    return getDocumentsForCustomer({ vorgangId, email: customerEmail });
  }, [customerEmail, objectId, revision, vorgangId]);

  const documents = workspaceContext?.documents ?? storeDocuments;

  const handleOpenDocument = (document: PreparedDocument) => {
    const resolvedVorgangId = document.vorgangId ?? vorgangId;
    if (!resolvedVorgangId) {
      router.push(buildDocumentHref(document, vorgangId));
      return;
    }

    if (document.typeId === "offerte" || document.typeId === "angebot") {
      openWorkspacePanelWithFallback(
        openAngebotPanel({
          vorgangId: resolvedVorgangId,
          offerId: document.id,
        }),
        (href) => router.push(href)
      );
      return;
    }

    openWorkspacePanelWithFallback(
      openDokumentPanel({
        vorgangId: resolvedVorgangId,
        documentId: document.id,
        focus: document.typeId === "expose" ? "expose" : "dokument",
      }),
      (href) => router.push(href)
    );
  };

  if (documents.length === 0) return null;

  return (
    <SectionCard title="Dokumente" icon={FileText}>
      <ul className="space-y-2">
        {documents.map((document) => (
          <li
            key={document.id}
            className="rounded-[12px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 px-3.5 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  {document.title}
                </p>
                <p className="mt-1 text-[11px] text-[#64748B]">
                  {document.typeLabel} · {DOCUMENT_STATUS_LABELS[document.status]}
                </p>
                {document.links?.objectTitle && (
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    Objekt: {document.links.objectTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleOpenDocument(document)}
                className="shrink-0 text-[11px] font-semibold text-[#2563EB] hover:underline"
              >
                Öffnen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
