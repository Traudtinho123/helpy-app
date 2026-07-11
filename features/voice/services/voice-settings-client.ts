import type {
  VoiceProcessedCall,
  VoiceSettings,
  VoiceSimulateRequest,
} from "@/features/voice/types/voice-types";
import type { VoiceStandardResponse } from "@/features/voice/types/voice-standard-response-types";

export async function fetchVoiceSettings(): Promise<VoiceSettings | null> {
  const response = await fetch("/api/voice/settings", { cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { settings?: VoiceSettings };
  return payload.settings ?? null;
}

export type VoiceSettingsUpdateClientResult =
  | { ok: true; settings: VoiceSettings }
  | { ok: false; error: string };

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
): Promise<VoiceSettingsUpdateClientResult> {
  const response = await fetch("/api/voice/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  const payload = (await response.json()) as {
    settings?: VoiceSettings;
    error?: string;
  };

  if (!response.ok || !payload.settings) {
    return {
      ok: false,
      error: payload.error ?? "Voice-Einstellungen konnten nicht gespeichert werden.",
    };
  }

  return { ok: true, settings: payload.settings };
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
  openAiConfigured?: boolean;
  twilioConfigured?: boolean;
  voiceEnabled?: boolean;
  provider?: VoiceSettings["provider"];
  companyId: string;
  phoneNumber: string | null;
  webhooks: {
    incoming: string;
    gather: string;
    status: string;
  };
  businessHoursSummary: string;
};

export type VoiceCallWorkflowStatus = "erledigt" | "vorgang_vorbereitet" | "offen";

export type VoiceCallListItem = VoiceCallRecord & {
  callerPhoneMasked?: string;
  intentLabel?: string | null;
  classificationLabel?: string | null;
  workflowStatus?: VoiceCallWorkflowStatus;
};

type VoiceCallRecord = VoiceProcessedCall["call"];

export type VoiceCallsDashboardPayload = {
  connection: {
    twilioConfigured: boolean;
    openAiConfigured: boolean;
    voiceEnabled: boolean;
    provider: VoiceSettings["provider"];
    phoneNumber: string | null;
    ready: boolean;
  };
  stats: {
    today: number;
    thisWeek: number;
    total: number;
  };
  calls: VoiceCallListItem[];
};

export async function fetchVoiceCallsDashboard(): Promise<VoiceCallsDashboardPayload | null> {
  const response = await fetch("/api/voice/calls", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as VoiceCallsDashboardPayload;
}

export async function generateVoiceCallSummary(
  callId: string
): Promise<{ summary: string } | { error: string }> {
  const response = await fetch(`/api/voice/calls/${callId}/summary`, {
    method: "POST",
  });

  const payload = (await response.json()) as { summary?: string; error?: string };

  if (!response.ok) {
    return { error: payload.error ?? "Zusammenfassung fehlgeschlagen." };
  }

  if (!payload.summary?.trim()) {
    return { error: "Zusammenfassung fehlgeschlagen." };
  }

  return { summary: payload.summary.trim() };
}

export async function fetchTwilioSetup(): Promise<TwilioSetupInfo | null> {
  const response = await fetch("/api/voice/twilio/setup", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as TwilioSetupInfo;
}

export type VoiceOverviewPayload = {
  companyName: string;
  connection: {
    twilioConfigured: boolean;
    openAiConfigured: boolean;
    voiceEnabled: boolean;
    provider: VoiceSettings["provider"];
    phoneNumber: string | null;
    phoneNumberDisplay: string;
    ready: boolean;
    connectedSince: string;
  };
  numbers: Array<{
    phoneNumber: string;
    phoneNumberDisplay: string;
    provider: VoiceSettings["provider"];
    providerLabel: string;
    active: boolean;
    companyName: string;
    connectedSince: string;
    stats: { today: number; thisWeek: number; total: number };
  }>;
  stats: {
    today: number;
    thisWeek: number;
    total: number;
    avgDurationSeconds: number;
  };
  intentStats: Array<{ intent: string; label: string; count: number }>;
};

export async function fetchVoiceOverview(): Promise<VoiceOverviewPayload | null> {
  const response = await fetch("/api/voice/overview", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as VoiceOverviewPayload;
}

export async function fetchVoiceStandardResponses(): Promise<VoiceStandardResponse[]> {
  const response = await fetch("/api/voice/standard-responses", { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { responses?: VoiceStandardResponse[] };
  return payload.responses ?? [];
}

export async function saveVoiceStandardResponse(input: {
  id?: string;
  triggerText: string;
  responseText: string;
  category: VoiceStandardResponse["category"];
  enabled: boolean;
}): Promise<VoiceStandardResponse | null> {
  const response = await fetch("/api/voice/standard-responses", {
    method: input.id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { response?: VoiceStandardResponse };
  return payload.response ?? null;
}

export async function deleteVoiceStandardResponse(id: string): Promise<boolean> {
  const response = await fetch(`/api/voice/standard-responses?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return response.ok;
}

export async function syncVoicePortfolioObjects(
  objects: Array<{
    objectId: string;
    titel: string;
    adresse: string;
    ort: string;
    zimmer: string | null;
    preis: string | null;
    status: string;
  }>
): Promise<boolean> {
  const response = await fetch("/api/voice/portfolio/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objects }),
  });
  return response.ok;
}
