"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Download, Paperclip } from "lucide-react";
import { AttachmentTypeIcon } from "@/features/mail/components/attachment-type-icon";
import {
  attachmentDirectionLabel,
  formatAttachmentSize,
  getMailAttachmentDownloadUrl,
} from "@/features/mail/services/mail-attachments-client";
import { findMatchingMailAttachment } from "@/features/mail/services/mail-attachment-resolver";
import {
  openDokumentPanel,
  openObjektPanel,
  openWorkspacePanelWithFallback,
} from "@/features/workspace/panels/workspace-panel-openers";
import { recordReviewOpened } from "@/features/workspace/services/status";
import { useWorkspaceContext } from "@/features/workspace/context";
import type { HelpyRecognizedDocument } from "@/features/documents/intelligence/document-types";
import { cn } from "@/lib/utils";

function formatReceivedAt(value?: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString("de-CH");
}

export function HelpyRecognizedDocumentsCard() {
  const router = useRouter();
  const { workspaceId, recognizedDocuments, mailAttachments } =
    useWorkspaceContext();

  const documents = useMemo(() => {
    const seen = new Set<string>();
    return recognizedDocuments.filter((document) => {
      const key = `${document.fileName.trim().toLowerCase()}::${document.sizeBytes ?? 0}::${document.mimeType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [recognizedDocuments]);

  const handleOpenDocument = (document: HelpyRecognizedDocument) => {
    openWorkspacePanelWithFallback(
      openDokumentPanel({
        vorgangId: workspaceId,
        documentId: document.preparedDocumentId,
        fileName: document.fileName,
        messageId: document.messageId,
      }),
      (href) => router.push(href)
    );
  };

  const handleReviewAssignment = () => {
    recordReviewOpened(workspaceId);
    openWorkspacePanelWithFallback(
      openObjektPanel({ vorgangId: workspaceId }),
      (href) => router.push(href)
    );
  };

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[16px] border border-[#CBD5E1]/50 bg-white/90 px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2">
        <Paperclip className="size-4 text-[#2563EB]" strokeWidth={2} />
        <p className="text-[12px] font-semibold text-[#0F172A]">
          Dokumente von HELPY erkannt
        </p>
      </div>

      <div className="mt-3 space-y-2.5">
        {documents.map((document) => {
          const mailAttachment = findMatchingMailAttachment(
            mailAttachments,
            document
          );
          const direction =
            document.direction ?? mailAttachment?.direction ?? null;
          const sizeLabel =
            document.sizeLabel ??
            (document.sizeBytes
              ? formatAttachmentSize(document.sizeBytes)
              : mailAttachment
                ? formatAttachmentSize(mailAttachment.size)
                : null);
          const receivedAt = formatReceivedAt(
            document.messageReceivedAt ?? mailAttachment?.messageReceivedAt
          );
          const downloadUrl = mailAttachment
            ? getMailAttachmentDownloadUrl(mailAttachment)
            : null;

          return (
            <div
              key={document.id}
              className="rounded-[12px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 px-3 py-2.5"
            >
              <div className="flex items-start gap-2">
                <AttachmentTypeIcon
                  mimeType={document.mimeType}
                  fileName={document.fileName}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    {document.fileName}
                  </p>
                  <p className="mt-1 text-[11px] text-[#64748B]">
                    {document.categoryLabel}
                    {direction ? (
                      <>
                        {" · "}
                        <span className="font-medium text-[#2563EB]">
                          {attachmentDirectionLabel(direction)}
                        </span>
                      </>
                    ) : null}
                  </p>
                  {(sizeLabel || receivedAt) && (
                    <p className="mt-0.5 text-[10px] text-[#94A3B8]">
                      {[sizeLabel, receivedAt].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {(document.messageSubject ?? mailAttachment?.messageSubject) && (
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-[#64748B]">
                      {document.messageSubject ?? mailAttachment?.messageSubject}
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-1.5 text-[11px] leading-relaxed text-[#475569]">
                {document.recommendation}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDocument(document)}
                  className="inline-flex h-8 items-center rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Öffnen
                </button>
                {downloadUrl ? (
                  <a
                    href={downloadUrl}
                    download={document.fileName}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3",
                      "text-[11px] font-medium text-[#334155] transition-colors hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]"
                    )}
                  >
                    <Download className="size-3.5" />
                    Herunterladen
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleReviewAssignment()}
                  className="inline-flex h-8 items-center rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-medium text-[#334155] transition-colors hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]"
                >
                  Zuordnung prüfen
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
