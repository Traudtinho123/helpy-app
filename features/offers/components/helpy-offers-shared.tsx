"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { HelpyIconBadge } from "@/components/helpy/helpy-icon-badge";
import type { Offer } from "@/features/offers/mock/mock-offers";

const IMPROVE_STEPS = [
  "Positionen prüfen…",
  "Layout optimieren…",
  "Einleitung verbessern…",
  "Rechtschreibung prüfen…",
  "Fast fertig…",
] as const;

type HelpyImproveOverlayProps = {
  visible: boolean;
  onComplete: () => void;
};

function HelpyImproveOverlayActive({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, IMPROVE_STEPS.length - 1));
    }, 400);

    const completeTimer = setTimeout(onComplete, 2000);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/20 backdrop-blur-[2px]">
      <div className="mx-6 w-full max-w-sm rounded-[20px] border border-[#CBD5E1]/40 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <HelpyIconBadge size={28} pose="typing" />
          <p className="text-[14px] font-semibold text-[#0F172A]">
            HELPY verbessert dein Angebot…
          </p>
          <Loader2 className="size-6 animate-spin text-[#2563EB]" />
          <ul className="w-full space-y-2 text-left">
            {IMPROVE_STEPS.map((step, index) => {
              const isVisible = index <= activeStep;
              if (!isVisible) return null;

              return (
                <li
                  key={step}
                  className="helpy-fade-in flex items-center gap-2.5 text-[12px] text-[#334155]"
                >
                  <Check className="size-3.5 text-[#059669]" strokeWidth={2.5} />
                  {step}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function HelpyImproveOverlay({
  visible,
  onComplete,
}: HelpyImproveOverlayProps) {
  if (!visible) return null;
  return <HelpyImproveOverlayActive onComplete={onComplete} />;
}

export function getHelpyRecommendation(offer: Offer): string {
  if (offer.helpy.missingInfo.length > 0) {
    return `Fast fertig — es fehlen noch ${offer.helpy.missingInfo.length} Angabe(n). Ergänze diese, bevor du das Angebot bestätigst.`;
  }

  return "Dieses Angebot ist vollständig. Bitte prüfen und bestätigen, bevor du es versendest.";
}

export function getQualityChecks(offer: Offer) {
  const hasCustomer =
    offer.customer.company &&
    offer.customer.contact &&
    offer.customer.email &&
    offer.customer.address;
  const hasItems = offer.lineItems.length > 0;
  const hasPrices = offer.lineItems.every((i) => i.unitPrice > 0);
  const hasVat = offer.vatRate > 0;
  const hasContact = !!offer.customer.contact;

  return [
    { label: "Kundendaten vollständig", ok: !!hasCustomer },
    { label: "Positionen vorhanden", ok: hasItems },
    { label: "Preise vorhanden", ok: hasPrices },
    { label: "MwSt. berechnet", ok: hasVat },
    { label: "Ansprechpartner vorhanden", ok: hasContact },
  ];
}

const WORK_STEPS = [
  "Kundendaten übernommen",
  "Positionen erkannt",
  "Preise berechnet",
  "PDF wird vorbereitet",
  "Versand wird vorbereitet",
] as const;

const STEP_DELAY_MS = 450;

export { WORK_STEPS, STEP_DELAY_MS };
