"use client";

import { useCallback, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  completeVorgang,
  VORGANG_ERLEDIGT_SUCCESS,
} from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import {
  getOrEvaluateReplyDraft,
  subscribeReplyDraft,
} from "@/features/reply-drafts/services/reply-draft-engine";
import { sendPreparedReplyDraft } from "@/features/reply-drafts/services/send-reply-draft";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type VorgangMiniReplyPanelProps = {
  vorgang: Vorgang;
  onDone: (message: string, helpyPanelMessage: string) => void;
  onClose: () => void;
  className?: string;
};

export function VorgangMiniReplyPanel({
  vorgang,
  onDone,
  onClose,
  className,
}: VorgangMiniReplyPanelProps) {
  const draft = useExternalStore(
    subscribeReplyDraft,
    () => getOrEvaluateReplyDraft(vorgang),
    () => getOrEvaluateReplyDraft(vorgang)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendAndComplete = useCallback(async () => {
    setLoading(true);
    setError(null);

    const sendResult = await sendPreparedReplyDraft(vorgang);
    if (!sendResult.ok) {
      setLoading(false);
      setError(sendResult.error);
      return;
    }

    const supabase = createClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const completeResult = await completeVorgang(vorgang, session?.provider_token);
    setLoading(false);

    if (!completeResult.ok) {
      setError(completeResult.message);
      return;
    }

    onDone(
      sendResult.message || VORGANG_ERLEDIGT_SUCCESS,
      completeResult.helpyPanelMessage
    );
  }, [onDone, vorgang]);

  if (!draft) {
    return (
      <div className={cn("rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-3", className)}>
        <p className="text-[12px] text-[#64748B]">HELPY bereitet die Antwort vor…</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-[11px] font-medium text-[#2563EB]"
        >
          Schliessen
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 p-3",
        className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-[10px] font-semibold tracking-[0.05em] text-[#2563EB] uppercase">
        Vorbereitete Antwort
      </p>
      <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-[#334155]">
        {draft.draftText}
      </p>
      {error ? (
        <p className="mt-2 text-[11px] text-[#DC2626]">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading || !draft.recipientValid}
          onClick={() => {
            void handleSendAndComplete();
          }}
          className="h-8 gap-1.5 rounded-[10px] text-[11px]"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          Senden & Erledigen
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 rounded-[10px] text-[11px]"
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
