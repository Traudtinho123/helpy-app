"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Maximize2, X } from "lucide-react";
import { OfficeDocumentHtmlPreview } from "@/features/documents/components/office-document-html-preview";
import {
  canPreviewOfficeAttachment,
} from "@/features/documents/preview/office-document-preview-service";
import { useOfficeDocumentPreview } from "@/features/documents/preview/use-office-document-preview";
import {
  isOfficeAttachment,
  isPreviewableImageMimeType,
  isPdfMimeType,
  resolveAttachmentContentType,
} from "@/features/gmail/services/gmail/attachment-parser";
import {
  AttachmentTypeIcon,
  attachmentTypeLabel,
} from "@/features/mail/components/attachment-type-icon";
import {
  formatAttachmentSize,
  getMailAttachmentDownloadUrl,
  getMailAttachmentOpenUrl,
} from "@/features/mail/services/mail-attachments-client";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkspaceDocumentPreviewProps = {
  attachment: UnifiedMailAttachment;
  loading?: boolean;
};

export function WorkspaceDocumentPreview({
  attachment,
  loading = false,
}: WorkspaceDocumentPreviewProps) {
  const openUrl = getMailAttachmentOpenUrl(attachment);
  const downloadUrl = getMailAttachmentDownloadUrl(attachment);
  const resolvedContentType = resolveAttachmentContentType(
    attachment.name,
    attachment.contentType
  );
  const isPdf = isPdfMimeType(resolvedContentType);
  const isImage = isPreviewableImageMimeType(resolvedContentType);
  const isOffice = isOfficeAttachment(attachment.name, attachment.contentType);
  const canPreviewOffice = canPreviewOfficeAttachment(
    attachment.name,
    attachment.contentType
  );
  const officePreview = useOfficeDocumentPreview(
    openUrl,
    attachment.name,
    attachment.contentType,
    canPreviewOffice
  );
  const typeLabel = attachmentTypeLabel(resolvedContentType, attachment.name);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(isImage);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isImage) return;

    let revoked = false;
    let objectUrl: string | null = null;
    setImageLoading(true);

    void fetch(openUrl)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .finally(() => {
        if (!revoked) setImageLoading(false);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isImage, openUrl]);

  return (
    <>
      <section className="mb-5 rounded-[14px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-semibold text-[#0F172A]">{attachment.name}</p>
            <p className="mt-0.5 text-[10px] text-[#94A3B8]">
              {formatAttachmentSize(attachment.size)} · {resolvedContentType}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={downloadUrl}
              download={attachment.name}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[11px] font-semibold transition-colors",
                isOffice
                  ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  : "border border-[#CBD5E1]/60 bg-white font-medium text-[#334155] hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]"
              )}
            >
              <Download className="size-3.5" />
              Herunterladen
            </a>
          </div>
        </div>

        {loading || imageLoading || officePreview.status === "loading" ? (
          <div className="flex h-40 items-center justify-center rounded-[12px] border border-dashed border-[#CBD5E1]/60 bg-white/70">
            <Loader2 className="size-5 animate-spin text-[#64748B]" />
          </div>
        ) : isPdf ? (
          <iframe
            title={attachment.name}
            src={openUrl}
            className="h-[min(420px,50vh)] w-full rounded-[12px] border border-[#E2E8F0] bg-white"
          />
        ) : isImage && imageUrl ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className={cn(
              "group relative block w-full overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
            )}
          >
            <img
              src={imageUrl}
              alt={attachment.name}
              className="max-h-[min(320px,40vh)] w-full object-contain"
            />
            <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-[8px] bg-[#0F172A]/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="size-3" />
              Vergrößern
            </span>
          </button>
        ) : officePreview.status === "ready" ? (
          <OfficeDocumentHtmlPreview
            html={officePreview.html}
            note={officePreview.note}
          />
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#CBD5E1]/60 bg-white/70 px-4 py-6 text-center">
            <AttachmentTypeIcon
              mimeType={attachment.contentType}
              fileName={attachment.name}
              className="mx-auto size-8"
            />
            <p className="mt-2 text-[12px] font-medium text-[#334155]">
              {officePreview.status === "error"
                ? "Vorschau konnte nicht geladen werden"
                : isOffice
                  ? `${typeLabel}-Datei — keine Vorschau verfügbar`
                  : "Keine Inline-Vorschau für diesen Dateityp"}
            </p>
            <p className="mt-1 text-[11px] text-[#64748B]">
              {officePreview.status === "error"
                ? officePreview.message
                : officePreview.status === "unsupported"
                  ? officePreview.message
                  : isOffice
                    ? `Lade die Datei herunter und öffne sie in ${typeLabel}.`
                    : "Nutze „Herunterladen“, um die Datei anzuzeigen."}
            </p>
          </div>
        )}
      </section>

      {lightboxOpen && imageUrl ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0F172A]/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          role="presentation"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 h-9 rounded-[10px] border-white/20 bg-white/10 px-3 text-white hover:bg-white/20"
          >
            <X className="size-4" />
          </Button>
          <img
            src={imageUrl}
            alt={attachment.name}
            className="max-h-[90vh] max-w-[92vw] rounded-[12px] object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

export function WorkspaceDocumentPreviewUnavailable({
  fileName,
  loading,
}: {
  fileName?: string;
  loading?: boolean;
}) {
  return (
    <section className="mb-5 rounded-[14px] border border-dashed border-[#CBD5E1]/60 bg-[#F8FAFC]/60 px-4 py-5 text-center">
      {loading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-[#64748B]" />
      ) : (
        <AttachmentTypeIcon className="mx-auto size-7 text-[#94A3B8]" />
      )}
      <p className="mt-2 text-[12px] font-medium text-[#334155]">
        {loading
          ? "Anhang wird geladen …"
          : "Datei noch nicht verfügbar"}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
        {fileName ? (
          <>
            <span className="font-medium text-[#475569]">{fileName}</span>
            {" · "}
          </>
        ) : null}
        {loading
          ? "HELPY lädt die Gmail-Anhänge für diesen Vorgang."
          : "Bitte Gmail erneut synchronisieren oder den Vorgang neu öffnen."}
      </p>
    </section>
  );
}
