"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DocumentPreviewModal } from "@/features/documents/components/document-preview-modal";
import { DocumentsOverview } from "@/features/documents/components/documents-overview";
import { HelpyDocumentsPanel } from "@/features/documents/components/helpy-documents-panel";
import {
  getDocumentById,
  getPreparedDocumentForVorgang,
  subscribeDocuments,
  upsertPreparedDocument,
  type PreparedDocument,
} from "@/features/documents/services";
import {
  getDocumentOverviewCategory,
  type DocumentOverviewFilter,
} from "@/features/documents/services/document-overview-utils";
import {
  getOverviewDocuments,
  getOverviewFilterCounts,
  hasRealOverviewDocuments,
} from "@/features/documents/services/documents-overview-engine";
import { prepareExposeFromVorgang } from "@/features/documents/services/vorgang-expose-engine";
import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import { getGmailListeVorgang } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { getVorgangPath } from "@/features/workspace/services/navigation/entity-navigation";

function mergeSelectedDocument(
  documents: PreparedDocument[],
  selectedDocument: PreparedDocument | null
): PreparedDocument[] {
  if (!selectedDocument) return documents;
  if (documents.some((document) => document.id === selectedDocument.id)) {
    return documents;
  }
  return [selectedDocument, ...documents];
}

export function DokumentePage() {
  const searchParams = useSearchParams();
  const focusVorgangId = searchParams.get("vorgang");
  const focusMode = searchParams.get("focus");
  const selectedDocumentId =
    searchParams.get("selected") ?? searchParams.get("doc");

  const [activeFilter, setActiveFilter] = useState<DocumentOverviewFilter>("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] =
    useState<PreparedDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [documentsRevision, setDocumentsRevision] = useState(0);

  useEffect(() => subscribeDocuments(() => {
    setDocumentsRevision((revision) => revision + 1);
  }), []);

  const focusDocument = useMemo(() => {
    if (!focusVorgangId || focusMode !== "expose") return null;

    const existing = getPreparedDocumentForVorgang(focusVorgangId);
    if (existing) return existing;

    const liste =
      getGmailListeVorgang(focusVorgangId) ??
      getBrainV2Vorgaenge().find((item) => item.id === focusVorgangId);

    if (!liste) return null;

    return upsertPreparedDocument(prepareExposeFromVorgang(liste));
  }, [focusMode, focusVorgangId, documentsRevision]);

  useEffect(() => {
    if (selectedDocumentId) {
      const document = getDocumentById(selectedDocumentId);
      if (document) {
        setSelectedDocument(document);
        setPreviewOpen(true);
        setActiveFilter(getDocumentOverviewCategory(document));
        setOpenError(null);
        return;
      }

      setSelectedDocument(null);
      setPreviewOpen(false);
      setOpenError("Dokument konnte nicht geöffnet werden.");
      return;
    }

    if (focusDocument) {
      setSelectedDocument(focusDocument);
      setPreviewOpen(true);
      setActiveFilter("expose");
      setOpenError(null);
      return;
    }

    setOpenError(null);
  }, [focusDocument, selectedDocumentId, documentsRevision]);

  const counts = useMemo(
    () => getOverviewFilterCounts(),
    [documentsRevision]
  );

  const showEmptyState = useMemo(
    () => !hasRealOverviewDocuments(),
    [documentsRevision]
  );

  const documents = useMemo(() => {
    const base = getOverviewDocuments(activeFilter, searchQuery);

    if (selectedDocumentId) {
      const selected = getDocumentById(selectedDocumentId);
      return mergeSelectedDocument(base, selected ?? null);
    }

    return base;
  }, [activeFilter, documentsRevision, searchQuery, selectedDocumentId]);

  const handleOpenDocument = useCallback((document: PreparedDocument) => {
    setSelectedDocument(document);
    setPreviewOpen(true);
    setOpenError(null);
  }, []);

  const handleOpenPreview = useCallback(() => {
    if (selectedDocument) setPreviewOpen(true);
  }, [selectedDocument]);

  return (
    <>
      <DocumentPreviewModal
        document={selectedDocument}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <DashboardShell
        activeHref="/dokumente"
        rightPanel={
          <HelpyDocumentsPanel
            selectedDocument={selectedDocument}
            onOpenPreview={handleOpenPreview}
          />
        }
      >
        {focusVorgangId && (
          <div className="border-b border-[#BFDBFE]/40 bg-gradient-to-br from-[#EFF6FF]/60 to-white/90 px-8 py-4 backdrop-blur-sm">
            <Link
              href={getVorgangPath(focusVorgangId)}
              className="inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#2563EB]"
            >
              <ArrowLeft className="size-3.5" />
              Zurück zum Vorgang
            </Link>
          </div>
        )}

        {openError && (
          <div className="border-b border-[#FECACA]/50 bg-[#FEF2F2]/80 px-8 py-3">
            <p className="text-[12px] font-medium text-[#B91C1C]">{openError}</p>
          </div>
        )}

        <DocumentsOverview
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          documents={documents}
          counts={counts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenDocument={handleOpenDocument}
          selectedDocumentId={selectedDocumentId}
          showEmptyState={showEmptyState}
        />
      </DashboardShell>
    </>
  );
}
