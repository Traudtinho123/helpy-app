"use client";

import { useEffect } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Send,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CompanyDocumentFooter,
  CompanyDocumentHeader,
  useCompanyProfile,
} from "@/components/company";
import {
  getDocumentAssignedToLabel,
  getDocumentCategoryLabel,
  getDocumentFileName,
  getDocumentSourceLabel,
} from "@/features/documents/services/document-overview-utils";
import {
  DOCUMENT_ENGINE_HELPY_MESSAGES,
  DOCUMENT_STATUS_STYLES,
  getDocumentDisplayStatus,
  type PreparedDocument,
} from "@/features/documents/services";
import { getSkillConfig, SKILL_EMOJI } from "@/features/workspace/services/workspace/skills";
import { cn } from "@/lib/utils";

type DocumentPreviewModalProps = {
  document: PreparedDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DocumentPreviewModal({
  document: doc,
  open,
  onOpenChange,
}: DocumentPreviewModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !doc) return null;

  const statusStyle = DOCUMENT_STATUS_STYLES[doc.status];

  return (
    <DocumentPreviewContent
      doc={doc}
      statusStyle={statusStyle}
      onOpenChange={onOpenChange}
    />
  );
}

function DocumentPreviewContent({
  doc,
  statusStyle,
  onOpenChange,
}: {
  doc: PreparedDocument;
  statusStyle: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile } = useCompanyProfile();
  const fileName = getDocumentFileName(doc);
  const category = getDocumentCategoryLabel(doc);
  const source = getDocumentSourceLabel(doc);
  const assignedTo = getDocumentAssignedToLabel(doc);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#0F172A]/40 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-[#CBD5E1]/40 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div>
          <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {fileName}
          </p>
          <p className="mt-0.5 text-[12px] text-[#64748B]">
            {category} · {source}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="hidden h-9 gap-2 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium sm:inline-flex"
          >
            <Download className="size-4" />
            Export vorbereiten
          </Button>
          <Button
            type="button"
            variant="outline"
            className="hidden h-9 gap-2 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium sm:inline-flex"
          >
            <CheckCircle2 className="size-4" />
            Prüfen
          </Button>
          <Button
            type="button"
            className="hidden h-9 gap-2 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm sm:inline-flex"
          >
            <Send className="size-4" />
            Senden
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-[10px] border-[#CBD5E1]/60"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <article className="mx-auto w-full max-w-[820px] bg-white px-10 py-12 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:px-14 sm:py-14">
          <CompanyDocumentHeader
            profile={profile}
            documentTitle={category}
            meta={[{ label: "Dateiname", value: fileName }]}
            customerBlock={{
              title: "Dokumentdetails",
              rows: [
                { label: "Kategorie", value: category },
                { label: "Zugeordnet zu", value: assignedTo },
                { label: "Quelle", value: source },
                { label: "Status", value: getDocumentDisplayStatus(doc) },
                { label: "Datum", value: doc.lastEdited },
              ],
            }}
          />

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-6 rounded-full px-2.5 text-[10px] font-semibold",
                statusStyle
              )}
            >
              {getDocumentDisplayStatus(doc)}
            </Badge>
            <Badge
              variant="outline"
              className="h-6 rounded-full border-[#CBD5E1]/60 bg-[#F8FAFC] px-2.5 text-[10px] font-semibold text-[#475569]"
            >
              {SKILL_EMOJI[doc.skill]}{" "}
              {getSkillConfig(doc.skill).label.replace(/^HELPY /, "")}
            </Badge>
          </div>

          <div className="mt-8 space-y-6">
            {doc.previewSections.map((section) => (
              <section key={section.heading ?? section.content.slice(0, 24)}>
                {section.heading && (
                  <h4
                    className="text-[11px] font-semibold tracking-[0.08em] uppercase"
                    style={{ color: profile.primaryColor }}
                  >
                    {section.heading}
                  </h4>
                )}
                <p className="mt-2 whitespace-pre-line text-[13px] leading-[1.85] text-[#334155]">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-10">
            <div
              className="rounded-[12px] border px-4 py-3.5"
              style={{
                borderColor: `${profile.primaryColor}30`,
                backgroundColor: `${profile.primaryColor}08`,
              }}
            >
              <div className="flex items-start gap-2">
                <FileText
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: profile.primaryColor }}
                />
                <div>
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: profile.primaryColor }}
                  >
                    Empfehlung von HELPY
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#334155]">
                    {doc.helpyHint}
                  </p>
                  <p className="mt-2 text-[11px] text-[#64748B]">
                    {DOCUMENT_ENGINE_HELPY_MESSAGES.trust}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CompanyDocumentFooter profile={profile} />
        </article>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#CBD5E1]/40 bg-white/95 px-5 py-4 backdrop-blur-xl sm:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-9 flex-1 gap-2 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium"
        >
          <CheckCircle2 className="size-4" />
          Prüfen
        </Button>
        <Button
          type="button"
          className="h-9 flex-1 gap-2 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white"
        >
          <Send className="size-4" />
          Senden
        </Button>
      </div>
    </div>
  );
}
