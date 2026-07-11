"use client";

import {
  CheckCircle2,
  Download,
  Eye,
  FileImage,
  FileText,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDocumentCategoryLabel,
  getDocumentFileName,
  getDocumentObjectOrVorgangLabel,
  getDocumentSourceLabel,
} from "@/features/documents/services/document-overview-utils";
import {
  DOCUMENT_STATUS_STYLES,
  getDocumentDisplayStatus,
  type PreparedDocument,
} from "@/features/documents/services";
import { cn } from "@/lib/utils";

type DocumentCardProps = {
  document: PreparedDocument;
  onOpen: (document: PreparedDocument) => void;
  isSelected?: boolean;
};

function DocumentTypeIcon({ document }: { document: PreparedDocument }) {
  const mimeType = document.attachmentMeta?.mimeType ?? "";
  const isImage = mimeType.startsWith("image/");

  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EFF6FF] text-[#2563EB]">
      {isImage ? (
        <FileImage className="size-5" strokeWidth={2} />
      ) : (
        <FileText className="size-5" strokeWidth={2} />
      )}
    </div>
  );
}

export function DocumentCard({
  document,
  onOpen,
  isSelected = false,
}: DocumentCardProps) {
  const statusStyle = DOCUMENT_STATUS_STYLES[document.status];
  const fileName = getDocumentFileName(document);
  const category = getDocumentCategoryLabel(document);
  const source = getDocumentSourceLabel(document);
  const objectOrVorgang = getDocumentObjectOrVorgangLabel(document);

  return (
    <article
      className={cn(
        "group flex w-full flex-col gap-5 rounded-[20px] border bg-white/90 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)] lg:flex-row lg:items-start lg:gap-6 lg:p-6",
        isSelected
          ? "border-[#2563EB]/50 ring-2 ring-[#BFDBFE]/70"
          : "border-[#CBD5E1]/40"
      )}
    >
      <div className="flex shrink-0 items-start gap-3 lg:w-40 lg:flex-col lg:gap-3">
        <DocumentTypeIcon document={document} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 lg:flex-col lg:items-start">
          <Badge
            variant="outline"
            className="h-6 rounded-full border-[#CBD5E1]/60 bg-[#F8FAFC] px-2.5 text-[10px] font-semibold text-[#475569]"
          >
            {category}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] font-semibold",
              statusStyle
            )}
          >
            {getDocumentDisplayStatus(document)}
          </Badge>
          {document.preparedByHelpy && (
            <Badge
              variant="outline"
              className="h-6 rounded-full border-[#BFDBFE] bg-[#EFF6FF] px-2.5 text-[10px] font-semibold text-[#2563EB]"
            >
              HELPY
            </Badge>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="break-words text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#0F172A]">
          {fileName}
        </h3>

        <div className="mt-3 grid gap-1.5 text-[12px] leading-relaxed text-[#64748B] sm:grid-cols-2">
          <p className="min-w-0 break-words">
            <span className="text-[#94A3B8]">Quelle: </span>
            {source}
          </p>
          <p className="min-w-0 break-words">
            <span className="text-[#94A3B8]">Kunde: </span>
            {document.customer}
          </p>
          <p className="min-w-0 break-words sm:col-span-2">
            <span className="text-[#94A3B8]">Objekt / Vorgang: </span>
            {objectOrVorgang}
          </p>
          <p className="min-w-0 break-words">
            <span className="text-[#94A3B8]">Datum: </span>
            {document.lastEdited}
          </p>
        </div>

        <p className="mt-3 break-words text-[12px] leading-relaxed text-[#475569]">
          <span className="font-semibold text-[#2563EB]">HELPY:</span>{" "}
          {document.helpyHint}
        </p>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-44">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpen(document)}
          className="h-9 w-full justify-center gap-1.5 rounded-[10px] border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-semibold text-[#334155] hover:border-[#2563EB]/30 hover:bg-[#EFF6FF] hover:text-[#2563EB]"
        >
          <Eye className="size-3.5" />
          Öffnen
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-center gap-1.5 rounded-[10px] border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-semibold text-[#334155]"
        >
          <CheckCircle2 className="size-3.5" />
          Prüfen
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-center gap-1.5 rounded-[10px] border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-semibold text-[#334155]"
        >
          <Send className="size-3.5" />
          Senden
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpen(document)}
          className="h-9 w-full justify-center gap-1.5 rounded-[10px] border-[#CBD5E1]/60 bg-white px-3 text-[11px] font-semibold text-[#334155]"
        >
          <Download className="size-3.5" />
          PDF öffnen
        </Button>
      </div>
    </article>
  );
}
