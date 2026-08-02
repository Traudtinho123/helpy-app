"use client";

import { useEffect, useRef } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/features/documents/components/document-card";
import {
  DOCUMENT_OVERVIEW_FILTER_LABELS,
  DOCUMENT_OVERVIEW_FILTER_ORDER,
  type DocumentOverviewFilter,
} from "@/features/documents/services/document-overview-utils";
import type { DocumentOverviewCounts } from "@/features/documents/services/documents-overview-engine";
import type { PreparedDocument } from "@/features/documents/services/types";
import { cn } from "@/lib/utils";

type DocumentsOverviewProps = {
  activeFilter: DocumentOverviewFilter;
  onFilterChange: (filter: DocumentOverviewFilter) => void;
  documents: PreparedDocument[];
  counts: DocumentOverviewCounts;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenDocument: (document: PreparedDocument) => void;
  selectedDocumentId?: string | null;
  showEmptyState: boolean;
};

export function DocumentsOverview({
  activeFilter,
  onFilterChange,
  documents,
  counts,
  searchQuery,
  onSearchChange,
  onOpenDocument,
  selectedDocumentId,
  showEmptyState,
}: DocumentsOverviewProps) {
  const selectedCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedDocumentId || !selectedCardRef.current) return;
    selectedCardRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedDocumentId, documents]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
              Dokumentenübersicht
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              Dokumente
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Erkannte Anhänge, PDFs, Bilder und von HELPY vorbereitete Dokumente
            </p>
          </div>
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] px-4 text-[12px] font-medium shadow-sm"
          >
            <Plus className="size-4" />
            Neues Dokument
          </Button>
        </div>

        <div className="relative mt-5 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Dokumente durchsuchen…"
            className="h-10 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] pl-10 text-[13px]"
          />
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DOCUMENT_OVERVIEW_FILTER_ORDER.map((filter) => {
            const isActive = activeFilter === filter;
            const count = counts[filter];

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-300",
                  isActive
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                )}
              >
                {DOCUMENT_OVERVIEW_FILTER_LABELS[filter]}
                <span className="ml-1.5 tabular-nums opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-8">
        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] py-16 text-center">
            <FileText className="size-10 text-[var(--text-muted)]" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Noch keine Dokumente erkannt.
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] py-16 text-center">
            <FileText className="size-10 text-[var(--text-muted)]" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Keine Dokumente in diesem Filter.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
            {documents.map((document) => {
              const isSelected = document.id === selectedDocumentId;

              return (
                <div
                  key={document.id}
                  id={`document-card-${document.id}`}
                  ref={isSelected ? selectedCardRef : undefined}
                  className="w-full"
                >
                  <DocumentCard
                    document={document}
                    onOpen={onOpenDocument}
                    isSelected={isSelected}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
