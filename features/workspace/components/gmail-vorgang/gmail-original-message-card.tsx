"use client";

import { Mail } from "lucide-react";
import { SectionCard, FieldGrid } from "@/features/workspace/components/workspace-sections";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { useWorkspaceContext } from "@/features/workspace/context";

export function GmailOriginalMessageCard() {
  const { mail } = useWorkspaceContext();
  const isPlatformInquiry = isPlatformRealEstateQuelle(mail.quelle);

  return (
    <SectionCard title={isPlatformInquiry ? "Original-Anfrage" : "Original-Nachricht"} icon={Mail}>
      <div className="space-y-4">
        <div>
          <p className="text-[15px] font-semibold text-[#0F172A]">
            {mail.betreff}
          </p>
          <p className="mt-1 text-[12px] text-[#64748B]">
            {mail.absender}
          </p>
          <p className="mt-0.5 text-[11px] text-[#94A3B8]">{mail.datum}</p>
        </div>

        <div className="rounded-[14px] border border-[#CBD5E1]/40 bg-[#F8FAFC] px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
            Nachrichtenauszug
          </p>
          <p className="mt-1.5 whitespace-pre-line text-[12px] leading-[1.65] text-[#475569]">
            {mail.inhalt || "—"}
          </p>
        </div>

        <FieldGrid
          fields={[{ label: "Quelle", value: mail.quelle }]}
        />
      </div>
    </SectionCard>
  );
}
