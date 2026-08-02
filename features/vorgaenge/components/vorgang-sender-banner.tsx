"use client";

import { UserPlus, Link2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VorgangSenderIntelligence } from "@/lib/vorgaenge/sender-intelligence";

type VorgangSenderBannerProps = {
  intelligence: VorgangSenderIntelligence;
  onCreateKunde: () => void;
  onLinkObjekt: () => void;
  onMarkSpam: () => void;
};

export function VorgangSenderBanner({
  intelligence,
  onCreateKunde,
  onLinkObjekt,
  onMarkSpam,
}: VorgangSenderBannerProps) {
  if (
    intelligence.case === "known_customer_known_object" ||
    intelligence.case === "spam_or_newsletter"
  ) {
    return null;
  }

  if (intelligence.case === "known_customer_no_object") {
    return (
      <div className="rounded-[16px] border border-[var(--border-accent)] bg-[var(--accent-light)] px-4 py-4">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
          {intelligence.kundeName ?? intelligence.fromName}
        </p>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Kunde erkannt — Objekt bitte verknüpfen.
        </p>
        <Button type="button" size="sm" className="mt-3" onClick={onLinkObjekt}>
          <Link2 className="size-4" />
          Objekt verknüpfen
        </Button>
      </div>
    );
  }

  if (intelligence.case === "unknown_sender_known_object") {
    return (
      <div className="rounded-[16px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--text-primary)]">
          <UserPlus className="size-4 text-[#D97706]" />
          Neuer Interessent
        </p>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{intelligence.fromName}</p>
        {intelligence.fromEmail ? (
          <p className="text-[13px] text-[var(--text-secondary)]">{intelligence.fromEmail}</p>
        ) : null}
        {intelligence.objektTitel ? (
          <p className="mt-2 text-[13px] text-[var(--text-primary)]">
            Interesse an: {intelligence.objektTitel}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onCreateKunde}>
            + Als Kunde anlegen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4">
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">Neue Anfrage</p>
      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Von: {intelligence.fromName}</p>
      {intelligence.fromEmail ? (
        <p className="text-[13px] text-[var(--text-secondary)]">{intelligence.fromEmail}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onCreateKunde}>
          + Als Kunde anlegen
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onLinkObjekt}>
          Objekt verknüpfen
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onMarkSpam}>
          <Ban className="size-4" />
          Als Spam markieren
        </Button>
      </div>
    </div>
  );
}
