"use client";

import { HelpyPreparedActions } from "@/features/review/components/actions";
import { HelpyEmpfiehltBox } from "@/features/decision/components/helpy-empfiehlt-box";
import { isConnectedMailVorgang } from "@/features/decision/services/decision-engine";
import { isHelpyPhoneVorgang } from "@/features/voice/services/helpy-phone-detector";
import { isPlatformRealEstateVorgang } from "@/features/brain/services/platform-email-detector";
import { HelpyReplyDraftCard } from "@/features/reply-drafts/components/helpy-reply-draft-card";
import { HelpyArchiveCard } from "@/features/spam-handling/components/helpy-archive-card";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import Link from "next/link";
import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VorgangStatusBadge } from "@/features/workspace/components/vorgaenge/vorgang-status-badge";
import { completeVorgang } from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import { getWorkspacePath } from "@/features/workspace/services/workspace";
import { resolveVorgangOpenPath } from "@/features/workspace/services/vorgaenge/gmail-workspace-resolver";
import { useVorgangStatus } from "@/features/workspace/services/status/use-vorgang-status";
import { VORGANG_PRIORITY_LABELS, type Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type VorgangCardProps = {
  vorgang: Vorgang;
  onCompleted?: (message: string, helpyPanelMessage: string) => void;
};

const priorityStyles = {
  kritisch: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
  hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  niedrig: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
} as const;

export function VorgangCard({ vorgang, onCompleted }: VorgangCardProps) {
  const intentLabel = vorgang.intentLabel ?? vorgang.typ;
  const workspacePath = resolveVorgangOpenPath(vorgang, getWorkspacePath);
  const { currentStatus } = useVorgangStatus(vorgang);
  const isConnectedMail = isConnectedMailVorgang(vorgang);
  const isHelpyPhone = isHelpyPhoneVorgang(vorgang);
  const isPlatformInquiry = isPlatformRealEstateVorgang(vorgang);
  const isArchiveCandidate = isConnectedMail && shouldPrepareArchive(vorgang);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleComplete = async () => {
    setCompleting(true);
    const supabase = createClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const result = await completeVorgang(vorgang, session?.provider_token);
    setCompleting(false);

    if (!result.ok) {
      setFeedback(result.message);
      return;
    }

    setFeedback(result.message);
    onCompleted?.(result.message, result.helpyPanelMessage);
  };

  return (
    <article
      className={cn(
        "group rounded-[24px] border border-[#CBD5E1]/40 bg-white/90 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BFDBFE]/60 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)]"
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <VorgangStatusBadge status={currentStatus} />
        <Badge
          variant="outline"
          className={cn(
            "h-6 rounded-full px-2.5 text-[10px] font-semibold",
            priorityStyles[vorgang.prioritaet]
          )}
        >
          {VORGANG_PRIORITY_LABELS[vorgang.prioritaet]}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F8FAFC] text-xl transition-transform duration-300 group-hover:scale-105">
            {vorgang.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
              {intentLabel}
            </p>
            <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
              {vorgang.titel}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#64748B]">
              <span>{vorgang.kunde}</span>
              <span className="text-[#CBD5E1]">·</span>
              {isHelpyPhone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">
                  📞 Via Telefon
                </span>
              ) : (
                <span className="text-[#94A3B8]">{vorgang.quelle}</span>
              )}
              {vorgang.skillLabel && (
                <>
                  <span className="text-[#CBD5E1]">·</span>
                  <span className="font-medium text-[#2563EB]">
                    {vorgang.skillLabel}
                  </span>
                </>
              )}
              <span className="text-[#CBD5E1]">·</span>
              <span>{vorgang.receivedLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {vorgang.summary && (
        <p className="mt-4 text-[12px] leading-relaxed text-[#475569]">
          {vorgang.summary}
        </p>
      )}

      {vorgang.detectedContext && vorgang.detectedContext.length > 0 && (
        <div className="mt-3 rounded-[14px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/80 px-4 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
            Kontext
          </p>
          <ul className="mt-2 space-y-1">
            {vorgang.detectedContext.map((line) => (
              <li
                key={line}
                className="flex gap-2 text-[11px] leading-relaxed text-[#64748B]"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#94A3B8]" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isArchiveCandidate ? (
        <HelpyArchiveCard vorgang={vorgang} className="mt-4" />
      ) : isPlatformInquiry ? (
        <>
          <div className="mt-4 rounded-[16px] border border-[#FDE68A]/50 bg-[#FFFBEB]/50 px-4 py-3.5 backdrop-blur-sm">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#D97706]" strokeWidth={2} />
              <div>
                <p className="text-[10px] font-semibold text-[#B45309]">
                  HELPY Empfehlung
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#334155]">
                  {vorgang.helpyEmpfehlung}
                </p>
              </div>
            </div>
          </div>
          <HelpyReplyDraftCard vorgang={vorgang} className="mt-4" />
        </>
      ) : isConnectedMail ? (
        <>
          <div className="mt-4">
            <HelpyEmpfiehltBox vorgang={vorgang} />
          </div>
          <HelpyReplyDraftCard vorgang={vorgang} className="mt-4" />
        </>
      ) : (
        <div className="mt-4 rounded-[16px] border border-[#FDE68A]/50 bg-[#FFFBEB]/50 px-4 py-3.5 backdrop-blur-sm">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#D97706]" strokeWidth={2} />
            <div>
              <p className="text-[10px] font-semibold text-[#B45309]">
                HELPY Empfehlung
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#334155]">
                {vorgang.helpyEmpfehlung}
              </p>
            </div>
          </div>
        </div>
      )}

      {(isPlatformInquiry || !isConnectedMail) && <HelpyPreparedActions vorgang={vorgang} />}

      {feedback && (
        <p className="mt-4 rounded-[10px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3 py-2 text-[11px] leading-relaxed text-[#047857]">
          {feedback}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={workspacePath}
          className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 text-[12px] font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <ExternalLink className="size-3.5" />
          Vorgang öffnen
        </Link>
        <Button
          type="button"
          variant="outline"
          disabled={completing || currentStatus === "erledigt"}
          onClick={() => {
            void handleComplete();
          }}
          className="h-9 gap-2 rounded-[12px] border-[#CBD5E1]/60 bg-white/90 text-[12px] font-medium"
        >
          <CheckCircle2 className="size-3.5" />
          {completing ? "Wird markiert…" : "Als erledigt markieren"}
        </Button>
      </div>
    </article>
  );
}
