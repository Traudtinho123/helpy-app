"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Lightbulb,
  ListChecks,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import {
  getHelpyRecommendation,
  getQualityChecks,
  STEP_DELAY_MS,
  WORK_STEPS,
} from "@/features/offers/components/helpy-offers-shared";
import type { Offer } from "@/features/offers/mock/mock-offers";
import { OFFER_PREVIEW_HELPY_MESSAGE } from "@/features/offers/mock/offer-preview";
import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety";

type HelpyOffersPanelProps = {
  offer: Offer | null;
  previewOpen?: boolean;
  onOpenPreview?: () => void;
};

function HelpyWorkStatus({
  visibleSteps,
  isWorking,
}: {
  visibleSteps: number;
  isWorking: boolean;
}) {
  return (
    <div className="mt-3 space-y-2">
      {isWorking && (
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="helpy-pulse-dot size-1.5 rounded-full bg-[#2563EB]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        </div>
      )}
      <ul className="space-y-1.5">
        {WORK_STEPS.map((step, index) => {
          if (index >= visibleSteps) return null;

          return (
            <li
              key={step}
              className="helpy-fade-in flex items-center gap-2 text-[11px] text-[var(--text-muted)]"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function InsightSection({
  title,
  icon: Icon,
  items,
  emptyText,
  iconColor,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  emptyText: string;
  iconColor: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className={iconColor} size={16} strokeWidth={2} />
        <h3 className="text-[11px] font-semibold tracking-[0.04em] text-[var(--text-muted)] uppercase">
          {title}
        </h3>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--text-secondary)]"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-[var(--text-muted)]">{emptyText}</p>
      )}
    </div>
  );
}

export function HelpyOffersPanel({
  offer,
  previewOpen = false,
  onOpenPreview,
}: HelpyOffersPanelProps) {
  if (!offer) {
    return (
      <HelpyOffersPanelShell
        offer={null}
        previewOpen={previewOpen}
        onOpenPreview={onOpenPreview}
        visibleSteps={0}
        workComplete={false}
        isWorking={false}
      />
    );
  }

  return (
    <HelpyOffersPanelActive
      key={offer.id}
      offer={offer}
      previewOpen={previewOpen}
      onOpenPreview={onOpenPreview}
    />
  );
}

function HelpyOffersPanelActive({
  offer,
  previewOpen,
  onOpenPreview,
}: Required<Pick<HelpyOffersPanelProps, "offer">> &
  Pick<HelpyOffersPanelProps, "previewOpen" | "onOpenPreview">) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [workComplete, setWorkComplete] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    WORK_STEPS.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleSteps(index + 1);
          if (index === WORK_STEPS.length - 1) {
            timers.push(setTimeout(() => setWorkComplete(true), 300));
          }
        }, (index + 1) * STEP_DELAY_MS)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const isWorking = !workComplete;

  return (
    <HelpyOffersPanelShell
      offer={offer}
      previewOpen={previewOpen}
      onOpenPreview={onOpenPreview}
      visibleSteps={visibleSteps}
      workComplete={workComplete}
      isWorking={isWorking}
    />
  );
}

function HelpyOffersPanelShell({
  offer,
  previewOpen = false,
  onOpenPreview,
  visibleSteps,
  workComplete,
  isWorking,
}: HelpyOffersPanelProps & {
  visibleSteps: number;
  workComplete: boolean;
  isWorking: boolean;
}) {
  const qualityChecks = offer ? getQualityChecks(offer) : [];
  const allQualityOk = qualityChecks.every((c) => c.ok);

  return (
    <HelpyPanelShell
      variant="helpy"
      subtitle={
        offer
          ? isWorking
            ? "Ich arbeite gerade an deinem Angebot."
            : "Dein Angebot ist bereit."
          : "Dein KI-Bürokollege"
      }
    >
      {offer ? (
        <div className="px-1 pb-2">
          <HelpyWorkStatus visibleSteps={visibleSteps} isWorking={isWorking} />
        </div>
      ) : null}

      {!offer ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
          <HelpyCharacter size={88} pose="wave" animated showLabel={false} />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Wähle ein Angebot — ich helfe dir bei der Erstellung.
          </p>
        </div>
      ) : (
        <div className="space-y-5 px-1">
            <div className="helpy-fade-in">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                Hallo Viktor 👋
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {HELPY_PANEL_REVIEW_INTRO}
              </p>
            </div>

            {workComplete && (
              <div className="space-y-5">
                <div className="helpy-fade-in rounded-[16px] border border-[#FDE68A]/60 bg-[#FFFBEB]/80 p-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      className="size-4 text-[#D97706]"
                      strokeWidth={2}
                    />
                    <p className="text-[12px] font-semibold text-[#B45309]">
                      Meine Empfehlung
                    </p>
                  </div>
                  <p className="mt-2.5 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
                    {getHelpyRecommendation(offer)}
                  </p>
                </div>

                <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                      Ich habe Folgendes geprüft
                    </p>
                    <ul className="mt-3 space-y-2">
                      {qualityChecks.map(({ label, ok }) => (
                        <li
                          key={label}
                          className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]"
                        >
                          {ok ? (
                            <CheckCircle2
                              className="size-4 shrink-0 text-[#059669]"
                              strokeWidth={2}
                            />
                          ) : (
                            <AlertCircle
                              className="size-4 shrink-0 text-[#D97706]"
                              strokeWidth={2}
                            />
                          )}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
                  <CardContent className="space-y-5 p-5">
                    <InsightSection
                      title="Erkannte Positionen"
                      icon={ListChecks}
                      items={offer.helpy.detectedItems}
                      emptyText="Keine Positionen erkannt."
                      iconColor="text-[var(--accent)]"
                    />

                    {offer.helpy.missingInfo.length > 0 && (
                      <InsightSection
                        title="Fehlende Angaben"
                        icon={AlertCircle}
                        items={offer.helpy.missingInfo}
                        emptyText=""
                        iconColor="text-[#D97706]"
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <FileText
                        className="size-4 text-[var(--accent)]"
                        strokeWidth={2}
                      />
                      <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                        PDF
                      </p>
                    </div>
                    <p className="mt-3 text-[11px] font-medium text-[var(--text-secondary)]">
                      Status
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-[#047857]">
                      {previewOpen ? "Vorschau geöffnet" : "Bereit zum Export"}
                    </p>
                    <p className="mt-3 rounded-[12px] border border-[var(--border-accent)]/50 bg-[var(--accent-light)] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {OFFER_PREVIEW_HELPY_MESSAGE}
                    </p>
                    <Button
                      variant="outline"
                      onClick={onOpenPreview}
                      className="mt-3 h-9 w-full rounded-[12px] border-[var(--border)] text-[12px] font-medium"
                    >
                      PDF Vorschau öffnen
                    </Button>
                  </CardContent>
                </Card>

                <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-[var(--accent)]" strokeWidth={2} />
                      <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                        Versand
                      </p>
                    </div>
                    <p className="mt-3 text-[11px] font-medium text-[var(--text-secondary)]">
                      Status
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-[#047857]">
                      {allQualityOk
                        ? "Bereit zum Versenden"
                        : "Noch nicht bereit"}
                    </p>
                    <Button
                      className="mt-3 h-9 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
                      disabled={!allQualityOk}
                    >
                      Per E-Mail prüfen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
      )}
    </HelpyPanelShell>
  );
}
