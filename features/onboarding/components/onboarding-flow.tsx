"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, Shield } from "lucide-react";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { Input } from "@/components/ui/input";
import { AppleCalendarConnectModal } from "@/features/apple-calendar/components/apple-calendar-connect-modal";
import { connectAppleCalendar } from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  OnboardingField,
  OnboardingHeadline,
  OnboardingPrimaryButton,
  OnboardingShell,
  OnboardingSubtext,
} from "@/features/onboarding/components/onboarding-shell";
import {
  fetchOAuthConnections,
} from "@/features/oauth/services/oauth-connections-client";
import {
  buildDefaultGreeting,
  ONBOARDING_SKIPPABLE_STEPS,
  onboardingStepPath,
  REPLY_STYLE_OPTIONS,
  type ReplyStyleChoice,
} from "@/lib/onboarding/constants";
import {
  getConnectedCalendarPlatform,
  reconcileCalendarPlatformState,
} from "@/features/calendar/services/calendar-platform";
import { isAppleCalendarConnected } from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  getCompanyProfileSnapshot,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import { cn } from "@/lib/utils";

type OnboardingFlowProps = {
  step: number;
  vorname: string | null;
  companyName: string;
};

async function saveOnboardingProgress(input: {
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  companyName?: string;
}) {
  await fetch("/api/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function OnboardingFlow({
  step,
  vorname,
  companyName: initialCompanyName,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [phone, setPhone] = useState(getCompanyProfileSnapshot().phone ?? "");
  const [website, setWebsite] = useState(getCompanyProfileSnapshot().website ?? "");
  const [address, setAddress] = useState(getCompanyProfileSnapshot().address ?? "");
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLabel, setCalendarLabel] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(buildDefaultGreeting(initialCompanyName));
  const [replyStyle, setReplyStyle] = useState<ReplyStyleChoice>("friendly");
  const [appleModalOpen, setAppleModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = vorname ?? "du";

  const refreshConnections = useCallback(async () => {
    const oauth = await fetchOAuthConnections("google");
    const googleMail = oauth?.connections.find(
      (item) => item.provider === "google" && item.status === "active"
    );
    setGmailConnected(Boolean(googleMail));
    setGmailEmail(googleMail?.accountEmail ?? null);

    reconcileCalendarPlatformState();
    const platform = getConnectedCalendarPlatform();
    const appleOk = isAppleCalendarConnected();
    setCalendarConnected(Boolean(platform) || appleOk);
    setCalendarLabel(
      platform === "apple" || appleOk
        ? "Apple Kalender"
        : platform === "google"
          ? "Google Kalender"
          : null
    );
  }, []);

  useEffect(() => {
    void refreshConnections();
  }, [refreshConnections, step]);

  const goToStep = useCallback(
    (nextStep: number) => {
      router.push(onboardingStepPath(nextStep));
    },
    [router]
  );

  const completeStep = useCallback(
    async (completedStep: number, nextStep?: number) => {
      setLoading(true);
      setError(null);
      try {
        await saveOnboardingProgress({ onboardingStep: completedStep });
        if (nextStep) goToStep(nextStep);
      } catch {
        setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      } finally {
        setLoading(false);
      }
    },
    [goToStep]
  );

  const handleFinish = useCallback(async () => {
    setLoading(true);
    updateLoadedCompanyProfile({
      companyName: companyName.trim(),
      phone: phone.trim(),
      website: website.trim(),
      address: address.trim(),
      companySignature: greeting.trim(),
    });
    await saveOnboardingProgress({
      onboardingStep: 6,
      onboardingCompleted: true,
      companyName: companyName.trim(),
    });
    router.push("/");
    router.refresh();
  }, [address, companyName, greeting, phone, router, website]);

  const footer = useMemo(() => {
    if (step === 1) {
      return (
        <OnboardingPrimaryButton
          disabled={loading}
          onClick={() => void completeStep(1, 2)}
        >
          Los geht&apos;s →
        </OnboardingPrimaryButton>
      );
    }
    if (step === 2) {
      return (
        <OnboardingPrimaryButton
          disabled={loading || !companyName.trim()}
          onClick={() => {
            updateLoadedCompanyProfile({
              companyName: companyName.trim(),
              phone: phone.trim(),
              website: website.trim(),
              address: address.trim(),
            });
            void completeStep(2, 3);
          }}
        >
          Weiter →
        </OnboardingPrimaryButton>
      );
    }
    if (step === 3) {
      return (
        <OnboardingPrimaryButton
          disabled={loading || !gmailConnected}
          onClick={() => void completeStep(3, 4)}
        >
          {gmailConnected ? "Weiter →" : "Gmail zuerst verbinden"}
        </OnboardingPrimaryButton>
      );
    }
    if (step === 4) {
      return (
        <OnboardingPrimaryButton
          disabled={loading}
          onClick={() => void completeStep(4, 5)}
        >
          Weiter →
        </OnboardingPrimaryButton>
      );
    }
    if (step === 5) {
      return (
        <OnboardingPrimaryButton
          disabled={loading}
          onClick={() => void completeStep(5, 6)}
        >
          Weiter →
        </OnboardingPrimaryButton>
      );
    }
    return (
      <OnboardingPrimaryButton disabled={loading} onClick={() => void handleFinish()}>
        Zum Dashboard →
      </OnboardingPrimaryButton>
    );
  }, [
    calendarConnected,
    companyName,
    completeStep,
    gmailConnected,
    handleFinish,
    loading,
    step,
  ]);

  return (
    <>
      <AppleCalendarConnectModal
        open={appleModalOpen}
        onClose={() => setAppleModalOpen(false)}
        onConnect={async (input) => {
          const result = await connectAppleCalendar(input);
          if (result.success) {
            void refreshConnections();
          }
          return result;
        }}
      />

      <OnboardingShell
        step={step}
        showSkip={ONBOARDING_SKIPPABLE_STEPS.has(step)}
        onBack={
          step > 1 ? () => goToStep(step - 1) : undefined
        }
        onSkip={
          ONBOARDING_SKIPPABLE_STEPS.has(step)
            ? () => void completeStep(step, step + 1)
            : undefined
        }
        footer={footer}
      >
        {step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <HelpyCharacter size={160} pose="wave" animated className="sm:hidden" />
            <HelpyCharacter size={200} pose="wave" animated className="hidden sm:block" />
            <OnboardingHeadline className="mt-8">
              Hallo {firstName}!
              <br />
              Ich bin HELPY.
            </OnboardingHeadline>
            <OnboardingSubtext>
              Ich bin dein KI-Büroassistent. In den nächsten 5 Minuten richte ich mich
              auf dein Unternehmen ein.
            </OnboardingSubtext>
            <ul className="mt-8 space-y-3 text-[14px] text-[#475569]">
              <li>⏱ Dauert nur 5 Minuten</li>
              <li>🔒 Deine Daten bleiben privat</li>
              <li>✓ Jederzeit anpassbar</li>
            </ul>
          </div>
        )}

        {step === 2 && (
          <div className="py-6">
            <div className="mb-6 flex items-start gap-3">
              <HelpyCharacter size={80} pose="wave" animated variant="head" />
              <div className="rounded-[16px] rounded-tl-sm border border-[#E7E5E4] bg-white px-4 py-3 text-[14px] text-[#475569] shadow-sm">
                Erzähl mir von dir!
              </div>
            </div>
            <OnboardingHeadline className="text-left sm:text-center">
              Wie heisst dein Unternehmen?
            </OnboardingHeadline>
            <div className="mt-8 space-y-5">
              <OnboardingField label="Firmenname *">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-14 rounded-[14px] border-[#E7E5E4] bg-white text-center text-[18px] font-medium"
                />
              </OnboardingField>
              <OnboardingField label="Telefon">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
                />
              </OnboardingField>
              <OnboardingField label="Website (optional)">
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
                />
              </OnboardingField>
              <OnboardingField label="Adresse">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Strasse, PLZ, Ort"
                  className="h-12 rounded-[14px] border-[#E7E5E4] bg-white"
                />
              </OnboardingField>
            </div>
            <p className="mt-6 text-center text-[12px] text-[#94A3B8]">
              Diese Infos erscheinen in deinen automatischen Antworten und Dokumenten.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#EEF2FF]">
              <Mail className="size-9 text-[#4F46E5]" />
            </div>
            <OnboardingHeadline>E-Mails verbinden.</OnboardingHeadline>
            <OnboardingSubtext>
              Das ist das Herzstück von HELPY. Ich lese deine eingehenden Mails, erkenne
              Anfragen und bereite Antworten vor.
            </OnboardingSubtext>

            {gmailConnected ? (
              <div className="mt-8 rounded-[16px] border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-4 text-[14px] font-medium text-[#047857]">
                <CheckCircle2 className="mr-2 inline size-4" />
                {gmailEmail ?? "Gmail"} verbunden
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/api/oauth/google/start?returnTo=${encodeURIComponent("/onboarding/schritt-3")}`;
                }}
                className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-[14px] border border-[#E7E5E4] bg-white text-[15px] font-semibold shadow-sm transition-colors hover:bg-[#FAFAF9]"
              >
                <span className="text-lg">G</span>
                Gmail verbinden
              </button>
            )}

            <div className="mt-6 space-y-2 text-[13px] text-[#64748B]">
              <p className="flex items-center justify-center gap-2">
                <Shield className="size-4" />
                Wir lesen nur – du bestätigst jede Aktion selbst
              </p>
              <p>🇪🇺 Deine Daten bleiben in der EU</p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = `/api/oauth/microsoft/start?returnTo=${encodeURIComponent("/onboarding/schritt-3")}`;
              }}
              className="mt-4 text-[13px] font-medium text-[#4F46E5] hover:underline"
            >
              Outlook / Microsoft 365 verbinden →
            </button>

            {error ? (
              <p className="mt-4 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#B91C1C]">
                {error}
              </p>
            ) : null}
          </div>
        )}

        {step === 4 && (
          <div className="py-6">
            <OnboardingHeadline>Kalender verbinden.</OnboardingHeadline>
            <OnboardingSubtext>
              Ich prüfe deine freien Zeiten und schlage automatisch Termine vor — ohne
              doppelte Buchungen.
            </OnboardingSubtext>

            {calendarConnected ? (
              <div className="mt-8 rounded-[16px] border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-4 text-center text-[14px] font-medium text-[#047857]">
                <CheckCircle2 className="mr-2 inline size-4" />
                {calendarLabel} verbunden
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAppleModalOpen(true)}
                  className="rounded-[16px] border border-[#E7E5E4] bg-white p-5 text-left shadow-sm transition-colors hover:border-[#C7D2FE]"
                >
                  <div className="text-2xl">🍎</div>
                  <p className="mt-3 text-[15px] font-semibold">Apple Kalender</p>
                  <p className="mt-1 text-[13px] text-[#64748B]">CalDAV verbinden</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/api/oauth/google/start?returnTo=${encodeURIComponent("/onboarding/schritt-4")}`;
                  }}
                  className="rounded-[16px] border border-[#E7E5E4] bg-white p-5 text-left shadow-sm transition-colors hover:border-[#C7D2FE]"
                >
                  <div className="text-2xl">📅</div>
                  <p className="mt-3 text-[15px] font-semibold">Google Calendar</p>
                  <p className="mt-1 text-[13px] text-[#64748B]">Mit Google verbinden</p>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="py-6">
            <OnboardingHeadline>Wie soll ich mich vorstellen?</OnboardingHeadline>
            <OnboardingSubtext>
              Das ist das Erste, was jemand hört wenn er anruft oder was ich schreibe.
            </OnboardingSubtext>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={5}
              className="mt-8 w-full rounded-[16px] border border-[#E7E5E4] bg-white p-4 text-[15px] leading-relaxed text-[#334155] shadow-sm outline-none focus:border-[#4F46E5]"
            />
            <div className="mt-6 space-y-3">
              {REPLY_STYLE_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[14px] border px-4 py-3 transition-colors",
                    replyStyle === option.id
                      ? "border-[#4F46E5]/40 bg-[#EEF2FF]"
                      : "border-[#E7E5E4] bg-white"
                  )}
                >
                  <input
                    type="radio"
                    name="reply-style"
                    checked={replyStyle === option.id}
                    onChange={() => setReplyStyle(option.id)}
                    className="mt-1 accent-[#4F46E5]"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-[#1E1B4B]">
                      {option.label}
                    </span>
                    <span className="block text-[12px] text-[#64748B]">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <StepSixFinish
            gmailConnected={gmailConnected}
            calendarConnected={calendarConnected}
            loading={loading}
          />
        )}

        {loading && step !== 6 ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-[#64748B]">
            <Loader2 className="size-4 animate-spin" />
            Wird gespeichert…
          </div>
        ) : null}
      </OnboardingShell>
    </>
  );
}

function StepSixFinish({
  gmailConnected,
  calendarConnected,
  loading,
}: {
  gmailConnected: boolean;
  calendarConnected: boolean;
  loading: boolean;
}) {
  useEffect(() => {
    void import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#4F46E5", "#6366F1", "#A5B4FC", "#F7F6F2"],
      });
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <HelpyCharacter size={160} pose="wave" animated />
      <OnboardingHeadline className="mt-6">HELPY ist bereit!</OnboardingHeadline>
      <OnboardingSubtext>
        Ich habe alles eingerichtet. Ab sofort verarbeite ich deine Mails, erkenne
        Anfragen und bereite Antworten vor.
      </OnboardingSubtext>
      <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
        {[
          { ok: gmailConnected, label: "Gmail verbunden" },
          { ok: calendarConnected, label: "Kalender synchronisiert" },
          { ok: true, label: "Firmenprofil gespeichert" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[14px] border border-[#E7E5E4] bg-white px-4 py-3 text-[13px] font-medium text-[#334155]"
          >
            {item.ok ? "✅" : "○"} {item.label}
          </div>
        ))}
      </div>
      {loading ? (
        <p className="mt-6 text-[13px] text-[#64748B]">Dashboard wird geöffnet…</p>
      ) : (
        <p className="mt-6 text-[12px] text-[#94A3B8]">
          Du kannst alle Einstellungen jederzeit unter Einstellungen anpassen.
        </p>
      )}
    </div>
  );
}
