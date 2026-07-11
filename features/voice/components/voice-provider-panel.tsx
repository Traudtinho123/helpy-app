"use client";

import { listVoiceProviders, getActiveVoiceProvider } from "@/features/voice/voice-provider";

export function VoiceProviderPanel() {
  const active = getActiveVoiceProvider();
  const providers = listVoiceProviders();

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#64748B]">
        Telefonanbieter sind austauschbar. Der Voice Core bleibt unverändert — nur der
        Provider wird gewechselt.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <article
            key={provider.id}
            className="rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-[#0F172A]">{provider.label}</h3>
              {provider.id === active.id && (
                <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">
                  Aktiv
                </span>
              )}
            </div>
            <p className="mt-2 text-[12px] text-[#64748B]">
              {provider.id === "mock"
                ? "Entwicklung und Tests ohne echten Telefonanschluss."
                : "Anbindung folgt über den Provider Layer — nicht im Voice Core."}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[12px] text-[#64748B]">
        Geplant: Microsoft Teams, SIP, Swisscom, Placetel, Sipgate — jeweils als eigener
        Provider ohne Änderung am Core.
      </div>
    </div>
  );
}
