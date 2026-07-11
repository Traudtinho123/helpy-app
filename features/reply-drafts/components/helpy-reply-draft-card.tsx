"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordCrmGmailReplySent } from "@/features/crm/services/crm-sync";
import { HelpyReviewModal } from "@/features/review/components";
import {
  GMAIL_RETRY_BUTTON_LABEL,
  GMAIL_SEND_ERROR_MESSAGE,
  GMAIL_SEND_LOADING_MESSAGE,
  GMAIL_SEND_SUCCESS_MESSAGE,
  GMAIL_WAITING_FOR_REPLY_STATUS,
  sendGmailMessage,
} from "@/features/gmail/services/gmail-drafts";
import {
  OUTLOOK_RETRY_BUTTON_LABEL,
  OUTLOOK_SEND_ERROR_MESSAGE,
  OUTLOOK_SEND_LOADING_MESSAGE,
  OUTLOOK_SEND_SUCCESS_MESSAGE,
  OUTLOOK_WAITING_FOR_REPLY_STATUS,
} from "@/features/outlook/services/outlook-drafts";
import { sendOutlookMessageFromApi } from "@/features/outlook/services/outlook-sync-service";
import { isOutlookVorgang } from "@/features/decision/services/decision-engine";
import {
  isBlockedOwnEmailRecipient,
  RECIPIENT_UNKNOWN_MESSAGE,
} from "@/features/gmail/services/extract-email-address";
import { notifyGmailSent } from "@/features/notifications/services/notification-emitter";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { startFollowUpFromGmailSend } from "@/features/followup/services/followup-engine";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import {
  confirmReplyDraft,
  createReviewForReplyDraft,
  getOrEvaluateReplyDraft,
  subscribeReplyDraft,
  updateReplyDraftText,
} from "@/features/reply-drafts/services/reply-draft-engine";
import type { ReplyDraft } from "@/features/reply-drafts/types/reply-draft-types";
import type { HelpyReview } from "@/features/review/services/types";
import {
  HELPY_BUTTON_BEARBEITEN,
  HELPY_BUTTON_PRUEFEN,
} from "@/features/review/services/safety";
import {
  recordGmailReplySent,
  recordReviewConfirmed,
  recordReviewOpened,
} from "@/features/workspace/services/status";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type HelpyReplyDraftCardProps = {
  vorgang: Vorgang;
  className?: string;
  onRegisterOpenReview?: (open: () => void) => void;
};

function useReplyDraft(vorgang: Vorgang): ReplyDraft | null {
  return useExternalStore(
    subscribeReplyDraft,
    () => getOrEvaluateReplyDraft(vorgang),
    () => getOrEvaluateReplyDraft(vorgang)
  );
}

const statusLabels: Record<ReplyDraft["status"], string | null> = {
  vorbereitet: null,
  bearbeitet: "Bearbeitet",
  bestaetigt: "Bestätigt",
  uebernommen: "Übernommen",
};

export function HelpyReplyDraftCard({
  vorgang,
  className,
  onRegisterOpenReview,
}: HelpyReplyDraftCardProps) {
  const draft = useReplyDraft(vorgang);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sendState, setSendState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [ownEmail, setOwnEmail] = useState<string | null>(null);

  const getOwnEmail = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return null;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.user?.email ?? null;
  }, []);

  useEffect(() => {
    void getOwnEmail().then(setOwnEmail);
  }, [getOwnEmail]);

  const handleStartEdit = useCallback(() => {
    if (!draft) return;
    setEditText(draft.draftText);
    setEditSubject(draft.subject);
    setEditing(true);
  }, [draft]);

  const handleSaveEdit = useCallback(() => {
    if (!draft) return;
    updateReplyDraftText(vorgang.id, editText, editSubject);
    setEditing(false);
    setFeedback(null);
  }, [draft, editSubject, editText, vorgang.id]);

  const isOutlook = isOutlookVorgang(vorgang);
  const sendLoadingMessage = isOutlook
    ? OUTLOOK_SEND_LOADING_MESSAGE
    : GMAIL_SEND_LOADING_MESSAGE;
  const sendSuccessMessage = isOutlook
    ? OUTLOOK_SEND_SUCCESS_MESSAGE
    : GMAIL_SEND_SUCCESS_MESSAGE;
  const sendErrorMessage = isOutlook
    ? OUTLOOK_SEND_ERROR_MESSAGE
    : GMAIL_SEND_ERROR_MESSAGE;
  const retryButtonLabel = isOutlook
    ? OUTLOOK_RETRY_BUTTON_LABEL
    : GMAIL_RETRY_BUTTON_LABEL;
  const waitingForReplyStatus = isOutlook
    ? OUTLOOK_WAITING_FOR_REPLY_STATUS
    : GMAIL_WAITING_FOR_REPLY_STATUS;

  const handleOpenReview = useCallback(() => {
    if (!draft) return;
    recordReviewOpened(vorgang.id);
    setActiveReview(
      createReviewForReplyDraft(draft, {
        mailProvider: isOutlook ? "outlook" : "gmail",
      })
    );
    setReviewOpen(true);
  }, [draft, isOutlook, vorgang.id]);

  useEffect(() => {
    if (!onRegisterOpenReview || !draft) return;
    onRegisterOpenReview(handleOpenReview);
  }, [draft, handleOpenReview, onRegisterOpenReview]);

  const getGoogleAccessToken = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return null;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.provider_token ?? null;
  }, []);

  const canSendDraft = useCallback(
    (currentDraft: ReplyDraft, ownEmail: string | null) => {
      if (!currentDraft.recipientValid || !currentDraft.recipientEmail) {
        return false;
      }

      return !isBlockedOwnEmailRecipient(
        currentDraft.recipientEmail,
        ownEmail,
        currentDraft.originalFrom
      );
    },
    []
  );

  const sendViaMailProvider = useCallback(async () => {
    if (!draft) return false;

    const ownEmail = await getOwnEmail();

    if (!canSendDraft(draft, ownEmail)) {
      setSendState("error");
      setSendError(RECIPIENT_UNKNOWN_MESSAGE);
      setFeedback(null);
      return false;
    }

    setSendState("loading");
    setSendError(null);
    setFeedback(sendLoadingMessage);

    const result = isOutlook
      ? await sendOutlookMessageFromApi({
          to: draft.recipientEmail!,
          subject: draft.subject,
          body: draft.draftText,
        })
      : await (async () => {
          const accessToken = await getGoogleAccessToken();
          if (!accessToken) {
            return { ok: false as const, error: sendErrorMessage };
          }

          return sendGmailMessage({
            accessToken,
            to: draft.recipientEmail!,
            subject: draft.subject,
            body: draft.draftText,
            threadId: vorgang.threadId,
          });
        })();

    if (result.ok) {
      confirmReplyDraft(vorgang.id);
      recordReviewConfirmed(vorgang.id);
      recordGmailReplySent(vorgang.id);
      recordCrmGmailReplySent(vorgang.id, draft.subject);
      processBackgroundMemoryEvent({
        type: "antwort-gesendet",
        vorgangId: vorgang.id,
        email: draft.recipientEmail!,
        text: draft.draftText,
        objectId: peekRealEstateObjectByVorgangId(vorgang.id)?.objectId ?? null,
      });
      startFollowUpFromGmailSend(vorgang);
      notifyGmailSent(vorgang);
      setSendState("success");
      setSendError(null);
      setReviewOpen(false);
      setActiveReview(null);
      setFeedback(sendSuccessMessage);
      return true;
    }

    setSendState("error");
    setSendError(result.error);
    setFeedback(null);
    return false;
  }, [
    canSendDraft,
    draft,
    getGoogleAccessToken,
    getOwnEmail,
    isOutlook,
    sendErrorMessage,
    sendLoadingMessage,
    sendSuccessMessage,
    vorgang,
    vorgang.id,
    vorgang.threadId,
  ]);

  const handleConfirmReview = useCallback(() => {
    void sendViaMailProvider();
  }, [sendViaMailProvider]);

  const handleRetrySend = useCallback(() => {
    void sendViaMailProvider();
  }, [sendViaMailProvider]);

  if (!draft || shouldPrepareArchive(vorgang)) return null;

  const statusLabel = statusLabels[draft.status];
  const isSent = sendState === "success";
  const statusBadge = isSent
    ? waitingForReplyStatus
    : statusLabel;
  const sendDisabled =
    !draft.recipientValid ||
    !draft.recipientEmail ||
    isBlockedOwnEmailRecipient(
      draft.recipientEmail ?? "",
      ownEmail,
      draft.originalFrom
    );

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgang.id}
        confirmLoading={sendState === "loading"}
        confirmDisabled={sendDisabled}
        confirmDisabledReason={
          sendDisabled ? RECIPIENT_UNKNOWN_MESSAGE : null
        }
        onConfirm={handleConfirmReview}
        onCancel={() => {
          if (sendState !== "loading") {
            setReviewOpen(false);
            setActiveReview(null);
            setSendError(null);
          }
        }}
        onEdit={() => {
          setReviewOpen(false);
          handleStartEdit();
        }}
      />

      <div
        className={cn(
          "rounded-[18px] border border-[#CBD5E1]/45 bg-gradient-to-br from-white/95 to-[#F8FAFC]/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              Antwort von HELPY vorbereitet
            </p>
          </div>
          {statusBadge && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                isSent
                  ? "border-[#FECACA]/60 bg-[#FEF2F2]/70 text-[#DC2626]"
                  : "border-[#A7F3D0]/60 bg-[#ECFDF5]/70 text-[#047857]"
              )}
            >
              <BadgeCheck className="size-3" strokeWidth={2.5} />
              {statusBadge}
            </span>
          )}
        </div>

        <div className="space-y-3">
          <Field
            label="Empfänger"
            value={draft.recipient}
            error={sendDisabled ? RECIPIENT_UNKNOWN_MESSAGE : null}
          />
          {editing ? (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                Betreff
              </p>
              <input
                value={editSubject}
                onChange={(event) => setEditSubject(event.target.value)}
                className="mt-1 w-full rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[12px] text-[#0F172A] outline-none focus:border-[#BFDBFE]"
              />
            </div>
          ) : (
            <Field label="Betreff" value={draft.subject} />
          )}

          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Antworttext
            </p>
            {editing ? (
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                rows={8}
                className="mt-1.5 w-full resize-y rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3.5 py-3 text-[12px] leading-relaxed text-[#334155] outline-none focus:border-[#BFDBFE]"
              />
            ) : (
              <p className="mt-1.5 whitespace-pre-line rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC]/80 px-3.5 py-3 text-[12px] leading-relaxed text-[#334155]">
                {draft.draftText}
              </p>
            )}
          </div>

          {draft.missingInfo.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                Fehlende Angaben
              </p>
              <ul className="mt-2 space-y-1">
                {draft.missingInfo.map((item) => (
                  <li key={item} className="text-[11px] text-[#B45309]">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {feedback && (
          <p
            className={cn(
              "mt-3 rounded-[10px] border px-3 py-2 text-[11px] leading-relaxed",
              sendState === "loading"
                ? "border-[#BFDBFE]/60 bg-[#EFF6FF]/60 text-[#2563EB]"
                : sendState === "success"
                  ? "border-[#BFDBFE]/60 bg-[#EFF6FF]/60 text-[#2563EB]"
                  : "border-[#A7F3D0]/50 bg-[#ECFDF5]/60 text-[#047857]"
            )}
          >
            {sendState === "loading" && (
              <Loader2 className="mr-1.5 inline size-3 animate-spin" />
            )}
            {feedback}
          </p>
        )}

        {sendError && (
          <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
            {sendError}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                onClick={handleSaveEdit}
                className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white"
              >
                Speichern
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                className="h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px] font-medium"
              >
                Abbrechen
              </Button>
            </>
          ) : (
            <>
              {!isSent && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStartEdit}
                    className="h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px] font-medium"
                  >
                    {HELPY_BUTTON_BEARBEITEN}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleOpenReview}
                    className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white"
                  >
                    {HELPY_BUTTON_PRUEFEN}
                  </Button>
                </>
              )}
              {sendState === "error" && (
                <Button
                  type="button"
                  onClick={handleRetrySend}
                  className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white"
                >
                  {retryButtonLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  error = null,
}: {
  label: string;
  value: string;
  error?: string | null;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-medium text-[#0F172A]">{value}</p>
      {error && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  );
}
