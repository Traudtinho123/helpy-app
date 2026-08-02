"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/Dropdown";
import { CreateKundeMiniModal } from "@/features/vorgaenge/components/create-kunde-mini-modal";
import { LinkObjektModal } from "@/features/vorgaenge/components/link-objekt-modal";
import { VorgangSenderBanner } from "@/features/vorgaenge/components/vorgang-sender-banner";
import {
  fetchVorgangIntelligence,
  linkRealEstateObjectToVorgang,
  patchVorgangLinks,
} from "@/features/vorgaenge/services/vorgang-link-service";
import { HelpyReplyDraftWorkspaceCard } from "@/features/reply-drafts/components/helpy-reply-draft-workspace-card";
import { HelpyAppointmentSuggestionWorkspaceCard } from "@/features/appointment-suggestions/components/helpy-appointment-suggestion-workspace-card";
import { GmailOriginalMessageCard } from "@/features/workspace/components/gmail-vorgang/gmail-original-message-card";
import { WorkspaceVorgangHideButton } from "@/features/workspace/components/workspace-vorgang-hide-button";
import { useWorkspaceContext } from "@/features/workspace/context";
import { completeVorgang } from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import { resolveVorgangSender } from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";
import {
  getStableRealEstateObjectSnapshot,
} from "@/features/real-estate/object/object-service";
import { subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { hideVorgang } from "@/features/workspace/services/vorgang-visibility-store";
import { useRouter } from "next/navigation";
import type { VorgangSenderIntelligence } from "@/lib/vorgaenge/sender-intelligence";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { getObjektPath } from "@/features/portfolio/services/object-navigation";

type VorgangSimplifiedWorkspaceProps = {
  vorgangId: string;
};

export function VorgangSimplifiedWorkspace({ vorgangId }: VorgangSimplifiedWorkspaceProps) {
  const router = useRouter();
  const context = useWorkspaceContext();
  const { vorgang, listeVorgang } = context;

  const sender = useMemo(
    () => resolveVorgangSender(listeVorgang ?? { kunde: vorgang.kunde.firmenname, titel: vorgang.aufgabe.titel }),
    [listeVorgang, vorgang]
  );

  const linkedObject = useExternalStore(
    subscribeRealEstateObjects,
    () => getStableRealEstateObjectSnapshot(vorgangId),
    () => null
  );

  const [intelligence, setIntelligence] = useState<VorgangSenderIntelligence | null>(null);
  const [showKundeModal, setShowKundeModal] = useState(false);
  const [showObjektModal, setShowObjektModal] = useState(false);
  const [linkedKundeId, setLinkedKundeId] = useState<string | null>(
    context.customer?.id ?? null
  );

  useEffect(() => {
    void fetchVorgangIntelligence({
      fromEmail: sender.email,
      fromName: sender.name,
      subject: listeVorgang?.titel ?? vorgang.aufgabe.titel,
      body: listeVorgang?.summary ?? listeVorgang?.snippet ?? context.mail.inhalt ?? "",
      isSpam: listeVorgang?.intent === "spam_newsletter",
    }).then(setIntelligence);
  }, [sender.email, sender.name, listeVorgang, vorgang, context.mail.inhalt]);

  useEffect(() => {
    if (intelligence?.objektId && !linkedObject) {
      linkRealEstateObjectToVorgang(intelligence.objektId, vorgangId);
    }
  }, [intelligence?.objektId, linkedObject, vorgangId]);

  const intentLabel =
    listeVorgang?.intentLabel ??
    (listeVorgang?.intent?.includes("besichtigung") ? "Besichtigungsanfrage" : "Anfrage");

  const handleComplete = () => {
    if (listeVorgang) completeVorgang(listeVorgang);
    router.push("/vorgaenge");
  };

  const handleMarkSpam = () => {
    hideVorgang(vorgangId);
    router.push("/vorgaenge");
  };

  const menuItems = [
    {
      label: "Ausblenden",
      onClick: () => {
        hideVorgang(vorgangId);
        router.push("/vorgaenge");
      },
    },
  ];

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col">
      <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white/95 px-4 py-4 backdrop-blur-md lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/vorgaenge"
              className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              <ArrowLeft className="size-4" />
              Zurück
            </Link>
            <h1 className="truncate text-[1.25rem] font-semibold text-[#0F172A]">
              {sender.name}
            </h1>
            {sender.email ? (
              <p className="truncate text-[13px] text-[#64748B]">{sender.email}</p>
            ) : null}
            <p className="mt-1 text-[12px] text-[#94A3B8]">
              {listeVorgang?.receivedLabel ?? "—"}
              {linkedObject ? ` · ${linkedObject.titel}` : ""}
            </p>
          </div>
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                aria-label="Mehr"
              >
                <MoreHorizontal className="size-4" />
              </button>
            }
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full rounded-[10px] px-3 py-2 text-left text-[13px] text-[#0F172A] hover:bg-[#F8FAFC]"
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ))}
          </Dropdown>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-8">
        <div className="min-w-0 flex-1 space-y-4">
          {intelligence ? (
            <VorgangSenderBanner
              intelligence={{
                ...intelligence,
                kundeId: linkedKundeId ?? intelligence.kundeId,
              }}
              onCreateKunde={() => setShowKundeModal(true)}
              onLinkObjekt={() => setShowObjektModal(true)}
              onMarkSpam={handleMarkSpam}
            />
          ) : null}
          <GmailOriginalMessageCard />
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-[360px]">
          <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
              HELPY
            </p>

            <section className="mt-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                Absender
              </p>
              <p className="text-[14px] font-medium text-[#0F172A]">{sender.name}</p>
              {sender.email ? (
                <p className="text-[13px] text-[#64748B]">{sender.email}</p>
              ) : null}
              {linkedKundeId ? (
                <Link
                  href={`/kunden?focus=${linkedKundeId}`}
                  className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Kundenprofil öffnen →
                </Link>
              ) : null}
            </section>

            <section className="mt-5 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                Objekt
              </p>
              {linkedObject ? (
                <>
                  <p className="text-[14px] font-medium text-[#0F172A]">
                    {linkedObject.titel}
                  </p>
                  <p className="text-[13px] text-[#64748B]">
                    {linkedObject.adresse}, {linkedObject.ort}
                  </p>
                  {linkedObject.zimmer || linkedObject.preis ? (
                    <p className="text-[13px] text-[#64748B]">
                      {[linkedObject.zimmer ? `${linkedObject.zimmer} Zi` : null, linkedObject.preis]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                  <Link
                    href={getObjektPath(linkedObject.objectId)}
                    className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Objekt öffnen →
                  </Link>
                </>
              ) : intelligence?.objektTitel ? (
                <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[13px] text-[#0F172A]">{intelligence.objektTitel}</p>
                  <p className="mt-1 text-[12px] text-[#64748B]">KI-erkannt aus Mailinhalt</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (intelligence.objektId) {
                          linkRealEstateObjectToVorgang(intelligence.objektId, vorgangId);
                          void patchVorgangLinks({
                            vorgangId,
                            objektId: intelligence.objektId,
                          });
                        }
                      }}
                    >
                      Bestätigen ✓
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowObjektModal(true)}
                    >
                      Anderes wählen
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-[#64748B]">Nicht erkannt</p>
                  <Button type="button" size="sm" onClick={() => setShowObjektModal(true)}>
                    + Objekt verknüpfen
                  </Button>
                </>
              )}
            </section>

            <section className="mt-5 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                Anliegen (KI-erkannt)
              </p>
              <p className="text-[14px] text-[#0F172A]">🏠 {intentLabel}</p>
            </section>

            <div className="mt-5 space-y-3">
              <HelpyReplyDraftWorkspaceCard />
              <HelpyAppointmentSuggestionWorkspaceCard />
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant="success"
                className="w-full justify-center"
                onClick={handleComplete}
              >
                <Check className="size-4" />
                Erledigen
              </Button>
            </div>
          </div>

          <WorkspaceVorgangHideButton vorgangId={vorgangId} />
        </aside>
      </div>

      <CreateKundeMiniModal
        open={showKundeModal}
        onClose={() => setShowKundeModal(false)}
        vorgangId={vorgangId}
        defaultName={sender.name}
        defaultEmail={sender.email ?? ""}
        defaultNote={intelligence?.objektTitel ? `Interesse an ${intelligence.objektTitel}` : ""}
        onSaved={(customerId) => {
          setLinkedKundeId(customerId);
          setIntelligence((prev) =>
            prev ? { ...prev, kundeId: customerId, case: "known_customer_no_object" } : prev
          );
        }}
      />

      <LinkObjektModal
        open={showObjektModal}
        onClose={() => setShowObjektModal(false)}
        vorgangId={vorgangId}
        kundeId={linkedKundeId}
        onLinked={() => {
          setIntelligence((prev) =>
            prev
              ? {
                  ...prev,
                  case: prev.kundeId ? "known_customer_known_object" : prev.case,
                }
              : prev
          );
        }}
      />
    </div>
  );
}
