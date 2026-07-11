"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyReviewModal } from "@/features/review/components";
import {
  confirmKundenakte,
  createReviewForKundenakte,
  getKundenakteConfirmMessage,
  HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN,
  HELPY_BUTTON_KUNDENAKTE_PRUEFEN,
  HELPY_KNOWN_CUSTOMER_LABEL,
  prepareKundenakteFromWorkspace,
  updateKundenakteFields,
} from "@/features/kundenakte/services/kundenakte-engine";
import { useKundenakte } from "@/features/kundenakte/hooks/use-kundenakte";
import { KundenakteOpenTasksSection } from "@/features/kundenakte/components/kundenakte-open-tasks-section";
import { KundenakteWidgetGrid } from "@/features/kundenakte/components/kundenakte-widget-grid";
import { HelpyNextRecommendation } from "@/features/crm/pipeline/components/helpy-next-recommendation";
import {
  HELPY_BUTTON_BEARBEITEN,
} from "@/features/review/services/safety";
import {
  recordReviewConfirmed,
  recordReviewOpened,
} from "@/features/workspace/services/status";
import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import { getGmailListeVorgang } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { getWorkspaceVorgang } from "@/features/workspace/services/workspace";
import { getVorgangPath } from "@/features/workspace/services/navigation/entity-navigation";
import type { HelpyReview } from "@/features/review/services/types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import { LeadScoreIndicator } from "@/features/lead-scoring/components/lead-score-indicator";
import {
  customerRefFromCustomer,
  refreshLeadScoresForCustomers,
} from "@/features/lead-scoring/services/lead-score-refresh";
import { getLeadScoreRecord } from "@/features/lead-scoring/services/lead-score-store";
import { cn } from "@/lib/utils";

type KundenakteFocusViewProps = {
  vorgangId: string;
};

function resolveListeVorgang(vorgangId: string): ListeVorgang | null {
  return (
    getGmailListeVorgang(vorgangId) ??
    getBrainV2Vorgaenge().find((item) => item.id === vorgangId) ??
    null
  );
}

export function KundenakteFocusView({ vorgangId }: KundenakteFocusViewProps) {
  const workspace = useMemo(() => getWorkspaceVorgang(vorgangId), [vorgangId]);
  const listeVorgang = useMemo(() => resolveListeVorgang(vorgangId), [vorgangId]);
  const kundenakte = useKundenakte(vorgangId);
  const initializedRef = useRef<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefon, setEditTelefon] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) return;
    if (initializedRef.current === vorgangId) return;
    initializedRef.current = vorgangId;
    prepareKundenakteFromWorkspace(workspace, listeVorgang ?? undefined);
  }, [listeVorgang, vorgangId, workspace]);

  const handleStartEdit = useCallback(() => {
    if (!kundenakte) return;
    setEditName(kundenakte.name);
    setEditEmail(kundenakte.email);
    setEditTelefon(kundenakte.telefon);
    setEditing(true);
  }, [kundenakte]);

  const handleSaveEdit = useCallback(() => {
    updateKundenakteFields(vorgangId, {
      name: editName,
      email: editEmail,
      telefon: editTelefon,
    });
    setEditing(false);
    setFeedback(null);
  }, [editEmail, editName, editTelefon, vorgangId]);

  const handleOpenReview = useCallback(() => {
    if (!kundenakte) return;
    recordReviewOpened(vorgangId);
    setActiveReview(createReviewForKundenakte(kundenakte));
    setReviewOpen(true);
  }, [kundenakte, vorgangId]);

  const handleConfirmReview = useCallback(() => {
    confirmKundenakte(vorgangId);
    recordReviewConfirmed(vorgangId);
    setFeedback(getKundenakteConfirmMessage());
    setReviewOpen(false);
    setActiveReview(null);
  }, [vorgangId]);

  const handleDirectConfirm = useCallback(() => {
    confirmKundenakte(vorgangId);
    recordReviewConfirmed(vorgangId);
    setFeedback(getKundenakteConfirmMessage());
  }, [vorgangId]);

  useEffect(() => {
    if (!kundenakte) return;
    refreshLeadScoresForCustomers([
      customerRefFromCustomer({
        id: kundenakte.id,
        email: kundenakte.email,
        company: kundenakte.firma,
        contactPerson: kundenakte.name,
        lastActivity: kundenakte.letzterKontakt,
      }),
    ]);
  }, [kundenakte]);

  const leadScore =
    (kundenakte ? getLeadScoreRecord(kundenakte.id)?.score : null) ?? 5;

  if (!workspace || !kundenakte) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-8 py-16 text-center backdrop-blur-xl">
        <p className="text-sm font-medium text-[#64748B]">
          Kundenakte konnte nicht geladen werden.
        </p>
        <Link
          href={getVorgangPath(vorgangId)}
          className="mt-4 inline-flex text-[12px] font-semibold text-[#2563EB]"
        >
          Zurück zum Vorgang
        </Link>
      </div>
    );
  }

  const isConfirmed = kundenakte.status === "bestaetigt";

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgangId}
        onConfirm={handleConfirmReview}
        onCancel={() => {
          setReviewOpen(false);
          setActiveReview(null);
        }}
        onEdit={() => {
          setReviewOpen(false);
          handleStartEdit();
        }}
      />

      <div className="mx-auto max-w-4xl px-8 py-12 lg:px-12 lg:py-14">
        <Link
          href={getVorgangPath(vorgangId)}
          className="mb-6 inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B] transition-colors hover:text-[#2563EB]"
        >
          <ArrowLeft className="size-3.5" />
          Zurück zum Vorgang
        </Link>

        <header className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
            Kundenakte
          </p>

          {editing ? (
            <div className="mt-4 space-y-3">
              <EditField label="Name" value={editName} onChange={setEditName} />
              <EditField label="E-Mail" value={editEmail} onChange={setEditEmail} />
              <EditField
                label="Telefon"
                value={editTelefon}
                onChange={setEditTelefon}
              />
              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-[#0F172A]">
                  {kundenakte.name}
                </h1>
                <LeadScoreIndicator score={leadScore} />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                <ContactLine icon={Mail} value={kundenakte.email} />
                <ContactLine icon={Phone} value={kundenakte.telefon} />
              </div>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {kundenakte.isKnownCustomer && (
              <span className="rounded-full border border-[#E9D5FF]/70 bg-[#FAF5FF]/80 px-3 py-1 text-[11px] font-semibold text-[#6D28D9]">
                {HELPY_KNOWN_CUSTOMER_LABEL}
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                isConfirmed
                  ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/70 text-[#047857]"
                  : "border-[#BFDBFE]/60 bg-[#EFF6FF]/80 text-[#2563EB]"
              )}
            >
              {isConfirmed && <BadgeCheck className="size-3" strokeWidth={2.5} />}
              {kundenakte.statusLabel}
            </span>
          </div>

          {!editing && !isConfirmed && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleStartEdit}
                className="h-9 rounded-[12px] border-[#CBD5E1]/60 px-4 text-[12px] font-medium"
              >
                {HELPY_BUTTON_BEARBEITEN}
              </Button>
              <Button
                type="button"
                onClick={handleOpenReview}
                className="h-9 rounded-[12px] bg-[#2563EB] px-4 text-[12px] font-semibold text-white"
              >
                {HELPY_BUTTON_KUNDENAKTE_PRUEFEN}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDirectConfirm}
                className="h-9 rounded-[12px] border-[#CBD5E1]/60 px-4 text-[12px] font-medium"
              >
                {HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN}
              </Button>
            </div>
          )}

          {feedback && (
            <p className="mt-4 rounded-[10px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3 py-2 text-[11px] leading-relaxed text-[#047857]">
              {feedback}
            </p>
          )}
        </header>

        <div className="space-y-6">
          <KundenakteWidgetGrid
            vorgangId={vorgangId}
            customerEmail={kundenakte.email}
          />

          <KundenakteOpenTasksSection
            vorgangId={vorgangId}
            kundenakte={kundenakte}
          />

          <HelpyNextRecommendation
            vorgangId={vorgangId}
            listeVorgang={listeVorgang ?? undefined}
          />
        </div>
      </div>
    </>
  );
}

function ContactLine({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[14px] text-[#334155]">
      <Icon className="size-4 shrink-0 text-[#64748B]" strokeWidth={2} />
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        {label}
      </p>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-[10px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[12px] text-[#0F172A] outline-none focus:border-[#BFDBFE]"
      />
    </div>
  );
}
