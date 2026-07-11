"use client";

import { useEffect, useRef } from "react";
import { ClipboardList } from "lucide-react";
import { HelpyArchiveWorkspaceCard } from "@/features/spam-handling/components/helpy-archive-workspace-card";
import { HelpyReplyDraftWorkspaceCard } from "@/features/reply-drafts/components/helpy-reply-draft-workspace-card";
import { HelpyAppointmentSuggestionWorkspaceCard } from "@/features/appointment-suggestions/components/helpy-appointment-suggestion-workspace-card";
import { HelpyViewingActionSection } from "@/features/appointment-suggestions/components/helpy-viewing-action-section";
import { HelpyViewingConfirmedCard } from "@/features/appointment-suggestions/components/helpy-viewing-confirmed-card";
import { HelpyObjectWorkspaceCard } from "@/features/real-estate/object/components/helpy-object-workspace-card";
import { useGmailWorkspaceActions } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-actions-context";
import { SectionCard } from "@/features/workspace/components/workspace-sections";
import { useWorkspaceContext } from "@/features/workspace/context";

function isViewingActionVorgang(
  intent?: string | null,
  intentLabel?: string | null,
  typ?: string | null
) {
  const haystack = `${intent ?? ""} ${intentLabel ?? ""} ${typ ?? ""}`.toLowerCase();
  return (
    haystack.includes("besichtigung") ||
    intent === "besichtigung"
  );
}

export function GmailPreparedSection() {
  const context = useWorkspaceContext();
  const actions = useGmailWorkspaceActions();
  const replyOpenRef = useRef<(() => void) | null>(null);
  const archiveOpenRef = useRef<(() => void) | null>(null);
  const appointmentOpenRef = useRef<(() => void) | null>(null);

  const { vorgang, listeVorgang, currentWorkflow, appointment } = context;
  const isArchive = currentWorkflow.isArchive;
  const isViewingAction =
    !isArchive &&
    isViewingActionVorgang(
      listeVorgang?.intent,
      listeVorgang?.intentLabel,
      listeVorgang?.typ
    );

  useEffect(() => {
    if (!actions) return;
    return actions.registerReviewHandlers({
      openReplyReview: () => replyOpenRef.current?.(),
      openArchiveReview: () => archiveOpenRef.current?.(),
      openAppointmentReview: () => appointmentOpenRef.current?.(),
    });
  }, [actions]);

  return (
    <div className="space-y-5">
      <SectionCard title="Von HELPY vorbereitet" icon={ClipboardList}>
        <div className="space-y-4">
          {isArchive ? (
            <HelpyArchiveWorkspaceCard
              vorgang={vorgang}
              onRegisterOpenReview={(open) => {
                archiveOpenRef.current = open;
              }}
            />
          ) : isViewingAction ? (
            <>
              <HelpyViewingActionSection
                onRegisterOpenReview={(open) => {
                  replyOpenRef.current = open;
                }}
              />
              {appointment.showViewingConfirmed && listeVorgang && (
                <HelpyViewingConfirmedCard vorgang={listeVorgang} />
              )}
            </>
          ) : (
            <>
              <HelpyObjectWorkspaceCard />
              <HelpyReplyDraftWorkspaceCard
                onRegisterOpenReview={(open) => {
                  replyOpenRef.current = open;
                }}
              />
              {appointment.showSuggestions && (
                <HelpyAppointmentSuggestionWorkspaceCard
                  onRegisterOpenReview={(open) => {
                    appointmentOpenRef.current = open;
                  }}
                />
              )}
              {appointment.showViewingConfirmed && listeVorgang && (
                <HelpyViewingConfirmedCard vorgang={listeVorgang} />
              )}
            </>
          )}

          {!isViewingAction && (
            <div className="rounded-[14px] border border-[#FDE68A]/50 bg-[#FFFBEB]/50 px-3.5 py-3">
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#B45309] uppercase">
                Nächster Schritt
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
                {currentWorkflow.nextBestStep}
              </p>
            </div>
          )}

          {!isViewingAction && currentWorkflow.preparedItems.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                Vorbereitete Aktionen
              </p>
              <ul className="mt-2 space-y-1">
                {currentWorkflow.preparedItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[11px] leading-relaxed text-[#64748B]"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#2563EB]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
