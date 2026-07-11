"use client";

import { Bot, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import {
  DOCUMENT_ENGINE_HELPY_MESSAGES,
  getDocumentCounts,
  getHelpyPreparedCount,
  type PreparedDocument,
} from "@/features/documents/services";
import { SKILL_EMOJI } from "@/features/workspace/services/workspace/skills";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";

type HelpyDocumentsPanelProps = {
  selectedDocument: PreparedDocument | null;
  onOpenPreview?: () => void;
};

export function HelpyDocumentsPanel({
  selectedDocument,
  onOpenPreview,
}: HelpyDocumentsPanelProps) {
  const { activeSkill } = useActiveSkill();
  const counts = getDocumentCounts(activeSkill);
  const helpyCount = getHelpyPreparedCount(activeSkill);

  return (
    <Panel variant="helpy" className="flex w-[380px]">
      <PanelHeader className="h-auto items-start py-5">
        <div className="flex items-start gap-3">
          <HelpyAvatar />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-[#2563EB]" strokeWidth={2} />
              <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
                HELPY
              </h2>
            </div>
            <p className="mt-1 text-[12px] font-medium text-[#334155]">
              Dokumenten-Assistent
            </p>
          </div>
        </div>
      </PanelHeader>

      <PanelBody>
        <div className="helpy-fade-in">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            Hallo Viktor 👋
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
            {DOCUMENT_ENGINE_HELPY_MESSAGES.intro}
          </p>
        </div>

        <div className="helpy-fade-in mt-5 rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/60 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#2563EB]">
              Vor dem Versand
            </p>
          </div>
          <p className="mt-2.5 text-[12px] leading-[1.65] text-[#334155]">
            {DOCUMENT_ENGINE_HELPY_MESSAGES.disclaimer}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
            {DOCUMENT_ENGINE_HELPY_MESSAGES.trust}
          </p>
        </div>

        <Card className="helpy-fade-in mt-5 rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#2563EB]" strokeWidth={2} />
              <p className="text-[12px] font-semibold text-[#0F172A]">
                Übersicht · {SKILL_EMOJI[activeSkill]}
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              <li className="flex justify-between text-[12px] text-[#334155]">
                <span>Von HELPY vorbereitet</span>
                <span className="font-semibold text-[#2563EB]">{helpyCount}</span>
              </li>
              <li className="flex justify-between text-[12px] text-[#334155]">
                <span>Entwürfe</span>
                <span className="font-semibold">{counts.entwuerfe}</span>
              </li>
              <li className="flex justify-between text-[12px] text-[#334155]">
                <span>Fertige Dokumente</span>
                <span className="font-semibold">{counts.fertige}</span>
              </li>
              <li className="flex justify-between text-[12px] text-[#334155]">
                <span>Vorlagen</span>
                <span className="font-semibold">{counts.vorlagen}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {selectedDocument && (
          <Card className="helpy-fade-in mt-5 rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-[12px] font-semibold text-[#0F172A]">
                Ausgewähltes Dokument
              </p>
              <p className="mt-2 text-[13px] font-medium text-[#0F172A]">
                {selectedDocument.title}
              </p>
              <p className="mt-1 text-[12px] text-[#64748B]">
                {selectedDocument.customer}
              </p>
              <p className="mt-3 rounded-[12px] border border-[#BFDBFE]/40 bg-[#EFF6FF]/40 px-3 py-2.5 text-[11px] leading-relaxed text-[#334155]">
                {selectedDocument.helpyHint}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onOpenPreview}
                className="mt-3 h-9 w-full rounded-[12px] border-[#CBD5E1]/60 text-[12px] font-medium"
              >
                Dokumentvorschau öffnen
              </Button>
            </CardContent>
          </Card>
        )}
      </PanelBody>
    </Panel>
  );
}
