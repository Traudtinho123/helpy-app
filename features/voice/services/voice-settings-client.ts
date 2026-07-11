import type {
  VoiceProcessedCall,
  VoiceSettings,
  VoiceSimulateRequest,
} from "@/features/voice/types/voice-types";

export async function fetchVoiceSettings(): Promise<VoiceSettings | null> {
  const response = await fetch("/api/voice/settings", { cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { settings?: VoiceSettings };
  return payload.settings ?? null;
}

export async function updateVoiceSettingsClient(
  patch: Partial<
    Pick<
      VoiceSettings,
      | "enabled"
      | "provider"
      | "phoneNumber"
      | "greetingText"
      | "disclosureText"
      | "businessHours"
    >
  >
): Promise<VoiceSettings | null> {
  const response = await fetch("/api/voice/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { settings?: VoiceSettings };
  return payload.settings ?? null;
}

export async function simulateVoiceCall(
  input: VoiceSimulateRequest
): Promise<{ ok: true; result: VoiceProcessedCall } | { ok: false; error: string }> {
  const response = await fetch("/api/voice/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    result?: VoiceProcessedCall;
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.result) {
    return { ok: false, error: payload.error ?? "Simulation fehlgeschlagen." };
  }

  return { ok: true, result: payload.result };
}

export async function fetchVoiceCalls(): Promise<VoiceProcessedCall["call"][]> {
  const response = await fetch("/api/voice/calls", { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { calls?: VoiceProcessedCall["call"][] };
  return payload.calls ?? [];
}

export type VoicePendingIntakePayload = {
  callId: string;
  processed: VoiceProcessedCall;
};

export async function fetchPendingVoiceIntakes(): Promise<VoicePendingIntakePayload[]> {
  const response = await fetch("/api/voice/intake/pending", { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { intakes?: VoicePendingIntakePayload[] };
  return payload.intakes ?? [];
}

export async function ackVoiceIntakes(callIds: string[]): Promise<boolean> {
  const response = await fetch("/api/voice/intake/ack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callIds }),
  });
  return response.ok;
}

export type TwilioSetupInfo = {
  configured: boolean;
  companyId: string;
  phoneNumber: string | null;
  webhooks: {
    incoming: string;
    gather: string;
    status: string;
  };
  businessHoursSummary: string;
};

export async function fetchTwilioSetup(): Promise<TwilioSetupInfo | null> {
  const response = await fetch("/api/voice/twilio/setup", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as TwilioSetupInfo;
}
