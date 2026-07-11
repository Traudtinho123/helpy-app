"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyReviewModal } from "@/features/review/components";
import {
  confirmKundenakte,
  createReviewForKundenakte,
  getKundenakteConfirmMessage,
  HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN,
  HELPY_BUTTON_KUNDENAKTE_PRUEFEN,
  HELPY_KNOWN_CUSTOMER_LABEL,
  HELPY_KUNDENAKTE_CARD_TITLE,
  HELPY_KUNDENAKTE_HINT,
  prepareKundenakteFromWorkspace,
  updateKundenakteFields,
} from "@/features/kundenakte/services/kundenakte-engine";
import { useKundenakte } from "@/features/kundenakte/hooks/use-kundenakte";
import { FieldGrid, SectionCard } from "@/features/workspace/components/workspace-sections";
import { shouldPrepareArchiveForWorkspace } from "@/features/spam-handling/services/archive-handling-engine";
import {
  HELPY_BUTTON_BEARBEITEN,
} from "@/features/review/services/safety";
import {
  recordReviewConfirmed,
  recordReviewOpened,
} from "@/features/workspace/services/status";
import type { HelpyReview } from "@/features/review/services/types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import { CustomerKnowledgeBox } from "@/features/intelligence/components/customer-knowledge-box";
import { HelpyNextRecommendation } from "@/features/crm/pipeline/components/helpy-next-recommendation";
import { LinkedDocumentsSection } from "@/features/documents/components/linked-documents-section";
import { getCustomerMemoryByEmail } from "@/features/intelligence/memory-engine/memory-engine";
import { subscribeCustomerIntelligenceMemory } from "@/features/intelligence";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { cn } from "@/lib/utils";

type KundenakteWorkspaceCardProps = {
  vorgang: WorkspaceVorgang;
  listeVorgang?: ListeVorgang;
};

export function KundenakteWorkspaceCard({
  vorgang,
  listeVorgang,
}: KundenakteWorkspaceCardProps) {
  const kundenakte = useKundenakte(vorgang.id);
  const initializedRef = useRef<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFirma, setEditFirma] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefon, setEditTelefon] = useState("");
  const [editAdresse, setEditAdresse] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (shouldPrepareArchiveForWorkspace(vorgang, listeVorgang)) return;
    if (initializedRef.current === vorgang.id) return;
    initializedRef.current = vorgang.id;
    prepareKundenakteFromWorkspace(vorgang, listeVorgang);
  }, [listeVorgang, vorgang]);

  const handleStartEdit = useCallback(() => {
    if (!kundenakte) return;
    setEditName(kundenakte.name);
    setEditFirma(kundenakte.firma);
    setEditEmail(kundenakte.email);
    setEditTelefon(kundenakte.telefon);
    setEditAdresse(kundenakte.adresse);
    setEditing(true);
  }, [kundenakte]);

  const handleSaveEdit = useCallback(() => {
    updateKundenakteFields(vorgang.id, {
      name: editName,
      firma: editFirma,
      email: editEmail,
      telefon: editTelefon,
      adresse: editAdresse,
    });
    setEditing(false);
    setFeedback(null);
  }, [editAdresse, editEmail, editFirma, editName, editTelefon, vorgang.id]);

  const handleOpenReview = useCallback(() => {
    if (!kundenakte) return;
    recordReviewOpened(vorgang.id);
    setActiveReview(createReviewForKundenakte(kundenakte));
    setReviewOpen(true);
  }, [kundenakte, vorgang.id]);

  const handleConfirmReview = useCallback(() => {
    confirmKundenakte(vorgang.id);
    recordReviewConfirmed(vorgang.id);
    setFeedback(getKundenakteConfirmMessage());
    setReviewOpen(false);
    setActiveReview(null);
  }, [vorgang.id]);

  const handleDirectConfirm = useCallback(() => {
    confirmKundenakte(vorgang.id);
    recordReviewConfirmed(vorgang.id);
    setFeedback(getKundenakteConfirmMessage());
  }, [vorgang.id]);

  const memoryRevision = useStoreRevision(subscribeCustomerIntelligenceMemory);

  const memorySummary = useMemo(
    () => getCustomerMemoryByEmail(kundenakte?.email ?? "")?.memorySummary ?? null,
    [kundenakte?.email, memoryRevision]
  );

  if (shouldPrepareArchiveForWorkspace(vorgang, listeVorgang) || !kundenakte) {
    return null;
  }

  const isConfirmed = kundenakte.status === "bestaetigt";

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgang.id}
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

      <SectionCard title={HELPY_KUNDENAKTE_CARD_TITLE} icon={UserRound}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
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

          {editing ? (
            <div className="space-y-3">
              <EditField label="Name" value={editName} onChange={setEditName} />
              <EditField label="Firma" value={editFirma} onChange={setEditFirma} />
              <EditField label="E-Mail" value={editEmail} onChange={setEditEmail} />
              <EditField label="Telefon" value={editTelefon} onChange={setEditTelefon} />
              <EditField label="Adresse" value={editAdresse} onChange={setEditAdresse} />
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
            <FieldGrid
              fields={[
                { label: "Name", value: kundenakte.name },
                { label: "Firma", value: kundenakte.firma },
                { label: "E-Mail", value: kundenakte.email, highlight: true },
                { label: "Telefon", value: kundenakte.telefon },
                { label: "Adresse", value: kundenakte.adresse },
                { label: "Quelle", value: kundenakte.quelle },
                { label: "Skill", value: kundenakte.skillLabel },
                { label: "Letzter Kontakt", value: kundenakte.letzterKontaktLabel },
                { label: "Betreff", value: kundenakte.betreff },
              ]}
            />
          )}

          <CustomerKnowledgeBox memorySummary={memorySummary} />

          <HelpyNextRecommendation
            vorgangId={vorgang.id}
            listeVorgang={listeVorgang}
          />

          <LinkedDocumentsSection
            vorgangId={vorgang.id}
            customerEmail={kundenakte.email}
          />

          <div className="rounded-[12px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3.5 py-3">
            <p className="text-[11px] font-semibold text-[#2563EB]">Hinweis von HELPY</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
              {kundenakte.helpyHint || HELPY_KUNDENAKTE_HINT}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
              {kundenakte.zusammenfassung}
            </p>
          </div>

          {feedback && (
            <p className="rounded-[10px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3 py-2 text-[11px] leading-relaxed text-[#047857]">
              {feedback}
            </p>
          )}

          {!isConfirmed && (
            <div className="flex flex-wrap gap-2">
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
                {HELPY_BUTTON_KUNDENAKTE_PRUEFEN}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDirectConfirm}
                className="h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px] font-medium"
              >
                {HELPY_BUTTON_KUNDENAKTE_BESTAETIGEN}
              </Button>
            </div>
          )}
        </div>
      </SectionCard>
    </>
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
