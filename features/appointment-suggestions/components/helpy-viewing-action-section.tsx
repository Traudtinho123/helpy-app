"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyAppointmentSuggestionWorkspaceCard } from "@/features/appointment-suggestions/components/helpy-appointment-suggestion-workspace-card";
import {
  confirmReplyAndAppointment,
  createReviewForReplyAndAppointment,
  VIEWING_COMBINED_ACTION_LABEL,
} from "@/features/appointment-suggestions/services/confirm-reply-and-appointment";
import {
  getAppointmentSuggestion,
  selectAppointmentSlot,
  subscribeAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { LinkedDocumentsSection } from "@/features/documents/components/linked-documents-section";
import {
  getOrEvaluateReplyDraft,
  getReplyDraft,
  subscribeReplyDraft,
} from "@/features/reply-drafts/services/reply-draft-engine";
import { HelpyReplyDraftWorkspaceCard } from "@/features/reply-drafts/components/helpy-reply-draft-workspace-card";
import { HelpyReviewModal } from "@/features/review/components";
import type { HelpyReview } from "@/features/review/services/types";
import { completeVorgang } from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import { useWorkspaceContext } from "@/features/workspace/context";
import {
  getKundenaktePath,
  getObjektPathFromVorgang,
} from "@/features/workspace/services/navigation/entity-navigation";
import {
  openKundePanel,
  openObjektPanel,
  openWorkspacePanelWithFallback,
} from "@/features/workspace/panels/workspace-panel-openers";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type HelpyViewingActionSectionProps = {
  onRegisterOpenReview?: (open: () => void) => void;
};

function readContextValue(
  lines: string[] | undefined,
  prefix: string
): string | null {
  if (!lines) return null;
  const line = lines.find((entry) => entry.startsWith(`${prefix}:`));
  if (!line) return null;
  const value = line.slice(prefix.length + 1).trim();
  return value || null;
}

export function HelpyViewingActionSection({
  onRegisterOpenReview,
}: HelpyViewingActionSectionProps) {
  const router = useRouter();
  const {
    workspaceId,
    listeVorgang,
    customer,
    object,
    documents,
  } = useWorkspaceContext();

  const suggestion = useExternalStore(
    subscribeAppointmentSuggestion,
    () => getAppointmentSuggestion(workspaceId),
    () => null
  );

  const replyDraft = useExternalStore(
    subscribeReplyDraft,
    () => {
      if (!listeVorgang) return getReplyDraft(workspaceId);
      return getOrEvaluateReplyDraft(listeVorgang);
    },
    () => null
  );

  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const detectedContext = listeVorgang?.detectedContext;
  const objectHint =
    object?.titel ||
    readContextValue(detectedContext, "Objekt") ||
    null;
  const wishDate = readContextValue(detectedContext, "Wunschtermin");
  const wishTime = readContextValue(detectedContext, "Zeitfenster");

  const objectHref = useMemo(() => {
    if (!object?.objectId) return null;
    return getObjektPathFromVorgang(object.objectId, workspaceId);
  }, [object?.objectId, workspaceId]);

  const customerHref = getKundenaktePath(workspaceId);

  const handleOpenObject = useCallback(() => {
    if (!object) return;
    const result = openObjektPanel({ vorgangId: workspaceId });
    if (!result.opened) {
      if (result.fallbackHref) {
        router.push(result.fallbackHref);
        return;
      }
      if (objectHref) {
        router.push(objectHref);
      }
    }
  }, [object, objectHref, router, workspaceId]);

  const handleOpenCustomer = useCallback(() => {
    const result = openKundePanel({ vorgangId: workspaceId });
    if (!result.opened) {
      openWorkspacePanelWithFallback(result, (href) => router.push(href));
    }
  }, [router, workspaceId]);

  const handleOpenCombinedReview = useCallback(() => {
    if (!listeVorgang) return;

    if (suggestion && !suggestion.selectedSlotId && suggestion.slots[0]) {
      selectAppointmentSlot(workspaceId, suggestion.slots[0].id);
    }

    const review = createReviewForReplyAndAppointment(listeVorgang);
    if (!review) {
      setFeedback(
        "Antwortentwurf und Terminvorschlag müssen zuerst bereitstehen."
      );
      return;
    }

    setActiveReview(review);
    setReviewOpen(true);
    setFeedback(null);
  }, [listeVorgang, suggestion, workspaceId]);

  const handleConfirmCombined = useCallback(async () => {
    if (!listeVorgang) return;
    setConfirmLoading(true);
    const result = await confirmReplyAndAppointment(listeVorgang);
    setConfirmLoading(false);

    if (!result.ok) {
      setFeedback(result.error);
      return;
    }

    setReviewOpen(false);
    setActiveReview(null);
    setFeedback(result.message);
  }, [listeVorgang]);

  const handleComplete = useCallback(async () => {
    if (!listeVorgang) return;
    setCompleting(true);
    const supabase = createClient();
    const session = supabase
      ? (await supabase.auth.getSession()).data.session
      : null;
    await completeVorgang(listeVorgang, session?.provider_token);
    setCompleting(false);
  }, [listeVorgang]);

  const hasReadyDraft =
    Boolean(replyDraft) &&
    (replyDraft?.status === "vorbereitet" ||
      replyDraft?.status === "bearbeitet");

  const hasReadySlots =
    suggestion?.status === "vorbereitet" && suggestion.slots.length > 0;

  const canCombine = Boolean(listeVorgang && hasReadyDraft && hasReadySlots);

  return (
    <div className="space-y-4">
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={workspaceId}
        confirmLoading={confirmLoading}
        onConfirm={() => {
          void handleConfirmCombined();
        }}
        onCancel={() => {
          if (!confirmLoading) {
            setReviewOpen(false);
            setActiveReview(null);
          }
        }}
      />

      <div className="rounded-[16px] border border-[#BFDBFE]/50 bg-gradient-to-br from-[#EFF6FF]/60 to-white/90 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-[#2563EB]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#0F172A]">
            Besichtigungstermin — Aktionsansicht
          </p>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#64748B]">
          Antwort und Terminvorschläge sind vorbereitet. Jede Aktion wird vor
          dem Ausführen bestätigt.
        </p>

        {(wishDate || wishTime || objectHint) && (
          <dl className="mt-3 grid gap-2 rounded-[12px] border border-[#BFDBFE]/40 bg-white/80 px-3 py-2.5 sm:grid-cols-3">
            {objectHint && (
              <div>
                <dt className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                  Objekt
                </dt>
                <dd className="mt-0.5 truncate text-[12px] font-medium text-[#0F172A]">
                  {objectHint}
                </dd>
              </div>
            )}
            {wishDate && (
              <div>
                <dt className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                  Wunschtermin
                </dt>
                <dd className="mt-0.5 text-[12px] font-medium text-[#0F172A]">
                  {wishDate}
                </dd>
              </div>
            )}
            {wishTime && (
              <div>
                <dt className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                  Zeitfenster
                </dt>
                <dd className="mt-0.5 text-[12px] font-medium text-[#0F172A]">
                  {wishTime}
                </dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {object && (
            <button
              type="button"
              onClick={handleOpenObject}
              className="inline-flex max-w-full items-center gap-2 rounded-[12px] border border-[#BFDBFE]/70 bg-[#EFF6FF]/80 px-3 py-2 text-left transition-colors hover:bg-[#DBEAFE]/80"
            >
              <Building2 className="size-3.5 shrink-0 text-[#2563EB]" />
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
                  Objekt
                </span>
                <span className="block truncate text-[12px] font-semibold text-[#0F172A]">
                  {object.titel}
                </span>
              </span>
            </button>
          )}
          {customer && (
            <button
              type="button"
              onClick={handleOpenCustomer}
              className="inline-flex max-w-full items-center gap-2 rounded-[12px] border border-[#E2E8F0]/80 bg-white/90 px-3 py-2 text-left transition-colors hover:bg-[#F8FAFC]"
            >
              <UserRound className="size-3.5 shrink-0 text-[#475569]" />
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
                  Interessent
                </span>
                <span className="block truncate text-[12px] font-semibold text-[#0F172A]">
                  {customer.name}
                </span>
              </span>
            </button>
          )}
          {objectHref && (
            <Link
              href={objectHref}
              className="inline-flex items-center rounded-[12px] border border-transparent px-2 text-[11px] font-medium text-[#2563EB] hover:underline"
            >
              Objektakte öffnen
            </Link>
          )}
          {customer && (
            <Link
              href={customerHref}
              className="inline-flex items-center rounded-[12px] border border-transparent px-2 text-[11px] font-medium text-[#2563EB] hover:underline"
            >
              Kundenakte öffnen
            </Link>
          )}
        </div>
      </div>

      <HelpyReplyDraftWorkspaceCard onRegisterOpenReview={onRegisterOpenReview} />

      <HelpyAppointmentSuggestionWorkspaceCard />

      {(documents.length > 0 || object?.objectId || customer?.email) && (
        <LinkedDocumentsSection
          objectId={object?.objectId ?? undefined}
          vorgangId={workspaceId}
          customerEmail={customer?.email}
        />
      )}

      <div className="space-y-2">
        <Button
          type="button"
          disabled={!canCombine || confirmLoading}
          onClick={handleOpenCombinedReview}
          className="h-10 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {confirmLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" />
              Wird ausgeführt…
            </span>
          ) : (
            VIEWING_COMBINED_ACTION_LABEL
          )}
        </Button>

        {!canCombine && !confirmLoading && (
          <p className="text-center text-[11px] text-[#94A3B8]">
            {!hasReadyDraft
              ? "Antwortentwurf wird vorbereitet…"
              : !hasReadySlots
                ? "Terminvorschläge werden geprüft…"
                : null}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={completing || !listeVorgang}
          onClick={() => void handleComplete()}
          className="h-9 w-full gap-2 rounded-[12px] border-[#CBD5E1]/60 bg-white/90 text-[12px] font-medium"
        >
          <CheckCircle2 className="size-3.5" />
          {completing ? "Wird markiert…" : "Als erledigt markieren"}
        </Button>
      </div>

      {feedback && (
        <p
          className={cn(
            "rounded-[10px] border px-3 py-2 text-[11px] leading-relaxed",
            feedback.includes("gesendet") || feedback.includes("bestätigt")
              ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/70 text-[#047857]"
              : "border-[#FECACA]/60 bg-[#FEF2F2]/70 text-[#B91C1C]"
          )}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
