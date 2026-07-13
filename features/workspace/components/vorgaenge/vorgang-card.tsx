"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  Reply,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VorgangStatusBadge } from "@/features/workspace/components/vorgaenge/vorgang-status-badge";
import { VorgangMiniReplyPanel } from "@/features/workspace/components/vorgaenge/vorgang-mini-reply-panel";
import { VorgangMiniAppointmentPanel } from "@/features/workspace/components/vorgaenge/vorgang-mini-appointment-panel";
import { isHelpyPhoneVorgang } from "@/features/voice/services/helpy-phone-detector";
import {
  completeVorgang,
  undoCompleteVorgang,
} from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import {
  applyPriorityOverride,
  subscribePriorityOverrides,
} from "@/features/workspace/services/vorgaenge/vorgaenge-priority-override-store";
import {
  CARD_BORDER_STYLES,
  getCardBorderAccent,
} from "@/features/workspace/services/vorgaenge/vorgaenge-smart-filter";
import {
  setVorgangSelected,
  subscribeVorgaengeSelection,
  isVorgangSelected,
} from "@/features/workspace/services/vorgaenge/vorgaenge-selection-store";
import { snoozeVorgang } from "@/features/workspace/services/vorgaenge/vorgaenge-snooze-store";
import { useVorgangStatus } from "@/features/workspace/services/status/use-vorgang-status";
import {
  VORGANG_PRIORITY_LABELS,
  type Vorgang,
} from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { triggerHapticFeedback } from "@/lib/mobile/haptics";
import { cn } from "@/lib/utils";

type ActivePanel = "none" | "reply" | "appointment";

type VorgangCardProps = {
  vorgang: Vorgang;
  compact?: boolean;
  focused?: boolean;
  selectedDetailId?: string | null;
  onOpen?: (id: string) => void;
  onCompleted?: (message: string, helpyPanelMessage: string) => void;
  onRequestReply?: (id: string) => void;
  onRequestAppointment?: (id: string) => void;
  externalPanel?: ActivePanel;
  onExternalPanelChange?: (panel: ActivePanel) => void;
};

const priorityStyles = {
  kritisch: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
  hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  niedrig: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
} as const;

const UNDO_MS = 5000;

export function VorgangCard({
  vorgang: rawVorgang,
  compact = true,
  focused = false,
  selectedDetailId = null,
  onOpen,
  onCompleted,
  onRequestReply,
  onRequestAppointment,
  externalPanel,
  onExternalPanelChange,
}: VorgangCardProps) {
  useExternalStore(subscribePriorityOverrides, () => null, () => null);
  const vorgang = applyPriorityOverride(rawVorgang);
  const { currentStatus } = useVorgangStatus(vorgang);
  const isHelpyPhone = isHelpyPhoneVorgang(vorgang);
  const isSelected = useExternalStore(
    subscribeVorgaengeSelection,
    () => isVorgangSelected(vorgang.id),
    () => false
  );
  const isDetailOpen = selectedDetailId === vorgang.id;

  const [internalPanel, setInternalPanel] = useState<ActivePanel>("none");
  const activePanel = externalPanel ?? internalPanel;
  const setActivePanel = onExternalPanelChange ?? setInternalPanel;

  const [completing, setCompleting] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const touchStartX = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  const borderAccent = getCardBorderAccent(vorgang);
  const isErledigt = currentStatus === "erledigt";

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearUndoTimer, [clearUndoTimer]);

  useEffect(() => {
    if (externalPanel !== undefined) {
      setInternalPanel(externalPanel);
    }
  }, [externalPanel]);

  const handleComplete = useCallback(async () => {
    if (completing || isErledigt) return;
    setCompleting(true);
    const supabase = createClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const result = await completeVorgang(vorgang, session?.provider_token);
    setCompleting(false);

    if (!result.ok) return;

    setExiting(true);
    setUndoVisible(true);
    triggerHapticFeedback(50);
    onCompleted?.(result.message, result.helpyPanelMessage);

    clearUndoTimer();
    undoTimerRef.current = setTimeout(() => {
      setUndoVisible(false);
      setExiting(false);
    }, UNDO_MS);
  }, [clearUndoTimer, completing, isErledigt, onCompleted, vorgang]);

  const handleUndo = useCallback(() => {
    clearUndoTimer();
    undoCompleteVorgang(vorgang);
    setUndoVisible(false);
    setExiting(false);
    onCompleted?.("Rückgängig gemacht.", "Der Vorgang ist wieder offen.");
  }, [clearUndoTimer, onCompleted, vorgang]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
    setSwiping(true);
    longPressTimer.current = setTimeout(() => {
      triggerHapticFeedback(30);
      setContextMenuOpen(true);
    }, 500);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    clearLongPress();
    if (!swiping) return;
    const delta = (event.touches[0]?.clientX ?? 0) - touchStartX.current;
    setSwipeX(Math.max(-120, Math.min(120, delta)));
  };

  const handleTouchEnd = () => {
    clearLongPress();
    setSwiping(false);
    if (swipeX < -80) {
      void handleComplete();
    } else if (swipeX > 80) {
      triggerHapticFeedback(30);
      snoozeVorgang(vorgang.id, "1h");
      setExiting(true);
      setTimeout(() => setExiting(false), 400);
      onCompleted?.("Später — für 1 Stunde ausgeblendet.", "Du siehst den Vorgang in einer Stunde wieder.");
    }
    setSwipeX(0);
  };

  const intentTag = vorgang.intentLabel ?? vorgang.typ;

  if (exiting && !undoVisible) {
    return null;
  }

  return (
    <article
      ref={cardRef}
      data-vorgang-id={vorgang.id}
      className={cn(
        "group relative overflow-hidden rounded-[16px] border border-[#CBD5E1]/40 border-l-4 bg-white/90 shadow-sm backdrop-blur-xl transition-all duration-300",
        CARD_BORDER_STYLES[borderAccent],
        compact ? "p-3.5" : "p-5",
        focused && "ring-2 ring-[#2563EB]/40",
        isDetailOpen && "border-[#2563EB]/50 bg-[#EFF6FF]/30",
        exiting && "pointer-events-none -translate-x-full opacity-0",
        "hover:border-[#BFDBFE]/70 hover:shadow-md"
      )}
      style={{
        transform: swiping ? `translateX(${swipeX}px)` : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onOpen?.(vorgang.id)}
    >
      {Math.abs(swipeX) > 20 ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 flex w-24 items-center justify-center text-[11px] font-semibold text-white",
            swipeX < 0 ? "left-0 bg-[#DC2626]" : "right-0 bg-[#2563EB]"
          )}
        >
          {swipeX < 0 ? "Erledigt" : "Später"}
        </div>
      ) : null}

      <div className="flex items-start gap-2.5">
        <label
          className={cn(
            "mt-0.5 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border border-[#CBD5E1] bg-white transition-opacity sm:size-5 lg:opacity-0 lg:group-hover:opacity-100",
            isSelected && "opacity-100"
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            className="sr-only"
            onChange={() => setVorgangSelected(vorgang.id, !isSelected)}
          />
          {isSelected ? (
            <Check className="size-3 text-[#2563EB]" strokeWidth={3} />
          ) : null}
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-5 rounded-full px-2 text-[9px] font-semibold",
                priorityStyles[vorgang.prioritaet]
              )}
            >
              {VORGANG_PRIORITY_LABELS[vorgang.prioritaet]}
            </Badge>
            <span className="truncate text-[13px] font-semibold text-[#0F172A]">
              {vorgang.kunde}
            </span>
            <span className="hidden text-[#CBD5E1] sm:inline">·</span>
            <span className="min-w-0 truncate text-[13px] text-[#334155]">
              {vorgang.titel}
            </span>
          </div>

          {vorgang.summary ? (
            <p className="mt-1 line-clamp-1 text-[12px] text-[#64748B]">
              {vorgang.summary}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#94A3B8]">
            <span>{vorgang.receivedLabel}</span>
            {isHelpyPhone ? (
              <Phone className="size-3 text-[#047857]" />
            ) : (
              <Mail className="size-3 text-[#2563EB]" />
            )}
            <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
              {intentTag}
            </span>
            {vorgang.skillLabel ? (
              <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">
                {vorgang.skillLabel}
              </span>
            ) : null}
            {!compact ? <VorgangStatusBadge status={currentStatus} /> : null}
          </div>

          {activePanel === "reply" ? (
            <VorgangMiniReplyPanel
              vorgang={vorgang}
              className="mt-3"
              onClose={() => setActivePanel("none")}
              onDone={(message, helpyMessage) => {
                setActivePanel("none");
                setExiting(true);
                onCompleted?.(message, helpyMessage);
              }}
            />
          ) : null}

          {activePanel === "appointment" ? (
            <VorgangMiniAppointmentPanel
              vorgang={vorgang}
              className="mt-3"
              onClose={() => setActivePanel("none")}
              onDone={(message, helpyMessage) => {
                setActivePanel("none");
                setExiting(true);
                onCompleted?.(message, helpyMessage);
              }}
            />
          ) : null}
        </div>

        {!isErledigt ? (
          <div
            className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-sm:hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              title="Erledigt"
              disabled={completing}
              onClick={() => {
                void handleComplete();
              }}
              className="flex size-8 items-center justify-center rounded-[10px] border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] transition-colors hover:bg-[#D1FAE5]"
            >
              <CheckCircle2 className="size-4" />
            </button>
            <button
              type="button"
              title="Antworten"
              onClick={() => {
                setActivePanel("reply");
                onRequestReply?.(vorgang.id);
              }}
              className="flex size-8 items-center justify-center rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
            >
              <Reply className="size-4" />
            </button>
            <button
              type="button"
              title="Termin"
              onClick={() => {
                setActivePanel("appointment");
                onRequestAppointment?.(vorgang.id);
              }}
              className="flex size-8 items-center justify-center rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
            >
              <CalendarDays className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      {undoVisible ? (
        <div
          className="mt-3 flex items-center justify-between rounded-[10px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/80 px-3 py-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="text-[11px] text-[#047857]">Als erledigt markiert</span>
          <button
            type="button"
            onClick={handleUndo}
            className="min-h-[44px] px-2 text-[11px] font-semibold text-[#2563EB] hover:underline"
          >
            Rückgängig
          </button>
        </div>
      ) : null}

      {contextMenuOpen ? (
        <div
          className="absolute inset-x-0 bottom-0 z-10 rounded-b-[16px] border-t border-[#E2E8F0] bg-white p-2 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#FEF2F2] text-[12px] font-semibold text-[#DC2626]"
              onClick={() => {
                setContextMenuOpen(false);
                void handleComplete();
              }}
            >
              Erledigen
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#EFF6FF] text-[12px] font-semibold text-[#2563EB]"
              onClick={() => {
                setContextMenuOpen(false);
                setActivePanel("reply");
              }}
            >
              Antworten
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#FFFBEB] text-[12px] font-semibold text-[#B45309]"
              onClick={() => {
                setContextMenuOpen(false);
                snoozeVorgang(vorgang.id, "1d");
                onCompleted?.("Für 1 Tag ausgeblendet.", "Vorgang wird morgen wieder sichtbar.");
              }}
            >
              Später
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-[10px] bg-[#F8FAFC] text-[12px] font-semibold text-[#64748B]"
              onClick={() => setContextMenuOpen(false)}
            >
              Schliessen
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
