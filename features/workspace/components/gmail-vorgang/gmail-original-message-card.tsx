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
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            {mail.betreff}
          </p>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            {mail.absender}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{mail.datum}</p>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--text-muted)] uppercase">
            Nachrichtenauszug
          </p>
          <p className="mt-1.5 whitespace-pre-line text-[12px] leading-[1.65] text-[var(--text-muted)]">
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
