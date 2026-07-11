import { prepareKundenakteFromVoiceCall } from "@/features/voice/services/voice-kundenakte";
import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import { resolveHelpyStatus } from "@/features/voice/services/voice-appointment-proposal";
import type {
  VoiceAppointmentProposal,
  VoiceCallRecord,
  VoiceProcessedCall,
} from "@/features/voice/types/voice-types";
import { seedHelpyDecisionsFromListeVorgaenge } from "@/features/decision/services/decision-engine";
import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import {
  deduplicateVorgaenge,
  sortDeduplicatedVorgaenge,
} from "@/features/workspace/services/vorgaenge/vorgang-deduplication";
import { applyCompletedDisplayState } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { initStatusForVorgaenge } from "@/features/workspace/services/status";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { readPersistentJson, writePersistentJson } from "@/lib/store/persistent-client-storage";

const STORAGE_KEY = "helpy-voice-vorgaenge";

const storageOptions = {
  storageKey: STORAGE_KEY,
} as const;

type VoiceVorgaengeCache = {
  vorgaenge: ListeVorgang[];
  workspaces: Record<string, WorkspaceVorgang>;
  calls: VoiceCallRecord[];
  appointmentProposals: Record<
    string,
    import("@/features/voice/types/voice-types").VoiceAppointmentProposal
  >;
  loadedAt: string;
};

const listeners = new Set<() => void>();
let cache: VoiceVorgaengeCache | null = null;

function notify(): void {
  invalidateVorgaengeSummaryCaches();
  listeners.forEach((listener) => listener());
}

function hydrateFromStorage(): void {
  if (typeof window === "undefined" || cache) return;
  const parsed = readPersistentJson<VoiceVorgaengeCache>(storageOptions);
  if (!parsed) return;
  const { vorgaenge } = deduplicateVorgaenge(parsed.vorgaenge);
  cache = {
    ...parsed,
    vorgaenge,
    appointmentProposals: parsed.appointmentProposals ?? {},
  };
  initStatusForVorgaenge(vorgaenge);
}

function persist(): void {
  if (typeof window === "undefined" || !cache) return;
  writePersistentJson(storageOptions, cache);
}

function ensureCache(): VoiceVorgaengeCache {
  hydrateFromStorage();
  if (!cache) {
    cache = {
      vorgaenge: [],
      workspaces: {},
      calls: [],
      appointmentProposals: {},
      loadedAt: new Date().toISOString(),
    };
  }
  return cache;
}

export function subscribeVoiceVorgaenge(listener: () => void): () => void {
  ensureCache();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVoiceVorgaenge(): ListeVorgang[] {
  const { vorgaenge } = deduplicateVorgaenge(ensureCache().vorgaenge);
  return sortDeduplicatedVorgaenge(
    vorgaenge.map((item) => applyCompletedDisplayState(item))
  );
}

export function getVoiceListeVorgang(id: string): ListeVorgang | null {
  return getVoiceVorgaenge().find((item) => item.id === id) ?? null;
}

export function getVoiceWorkspaceVorgang(id: string): WorkspaceVorgang | null {
  ensureCache();
  return cache?.workspaces[id] ?? null;
}

export function getVoiceCalls(): VoiceCallRecord[] {
  return [...ensureCache().calls].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)
  );
}

export function getVoiceAppointmentProposal(
  vorgangId: string
): VoiceAppointmentProposal | null {
  return ensureCache().appointmentProposals[vorgangId] ?? null;
}

function applyProposalToListe(
  liste: ListeVorgang,
  proposal: VoiceAppointmentProposal
): ListeVorgang {
  const helpyStatus = resolveHelpyStatus(proposal);
  const terminLabel =
    proposal.terminDatum && proposal.terminUhrzeit
      ? `${proposal.terminDatum} ${proposal.terminUhrzeit}`
      : null;

  const detectedContext = [
    ...(liste.detectedContext ?? []),
    proposal.objekt ? `Objekt: ${proposal.objekt}` : null,
    terminLabel ? `Terminwunsch: ${terminLabel}` : null,
    `Status: ${helpyStatus}`,
  ].filter(Boolean) as string[];

  return {
    ...liste,
    helpyStatus,
    intentLabel:
      proposal.calendarStatus === "confirmed" ||
      (proposal.terminDatum && proposal.terminUhrzeit)
        ? "Termin vereinbart"
        : liste.intentLabel,
    detectedContext,
    recommendedNextStep:
      proposal.terminDatum && proposal.terminUhrzeit
        ? "Termin im Apple Kalender eintragen."
        : "Datum erfragen und manuell eintragen.",
    preparedActions:
      proposal.terminDatum && proposal.terminUhrzeit
        ? ["Termin im Kalender eintragen", "Anrufer zurückrufen"]
        : ["Datum beim Anrufer erfragen", "Anrufer zurückrufen"],
  };
}

export function updateVoiceAppointmentProposal(
  proposal: VoiceAppointmentProposal
): void {
  const store = ensureCache();
  store.appointmentProposals[proposal.vorgangId] = proposal;

  const index = store.vorgaenge.findIndex((item) => item.id === proposal.vorgangId);
  if (index >= 0) {
    store.vorgaenge[index] = applyProposalToListe(store.vorgaenge[index], proposal);
  }

  const workspace = store.workspaces[proposal.vorgangId];
  if (workspace) {
    store.workspaces[proposal.vorgangId] = {
      ...workspace,
      helpy: {
        ...workspace.helpy,
        naechsterSchritt:
          proposal.terminDatum && proposal.terminUhrzeit
            ? "Termin im Apple Kalender eintragen."
            : "Datum erfragen und manuell eintragen.",
      },
    };
  }

  store.loadedAt = new Date().toISOString();
  persist();
  notify();
}

/** Nimmt ein verarbeitetes Gespräch in den Client-Store auf. */
export function ingestVoiceProcessedCall(result: VoiceProcessedCall): VoiceProcessedCall {
  const store = ensureCache();
  const withoutDuplicate = store.vorgaenge.filter(
    (item) => item.id !== result.liste.id
  );
  store.vorgaenge = [result.liste, ...withoutDuplicate];
  store.workspaces[result.vorgangId] = result.workspace;
  if (result.appointmentProposal) {
    store.appointmentProposals[result.vorgangId] = result.appointmentProposal;
  }
  store.calls = [
    result.call,
    ...store.calls.filter((item) => item.id !== result.call.id),
  ].slice(0, 50);
  store.loadedAt = new Date().toISOString();
  persist();

  initStatusForVorgaenge([result.liste]);
  seedHelpyDecisionsFromListeVorgaenge([result.liste]);

  let kundenakteId = result.kundenakteId;
  if (!kundenakteId) {
    const kundenakte = prepareKundenakteFromVoiceCall({
      vorgangId: result.vorgangId,
      callerName: result.call.callerName,
      callerPhone: result.call.callerPhone,
      summary: result.call.summary ?? result.liste.summary ?? "",
      titel: result.liste.titel,
      skill: result.workspace.skill,
      receivedAt: result.liste.receivedAt,
      receivedLabel: result.liste.receivedLabel,
    });
    kundenakteId = kundenakte?.id ?? null;
  }

  notify();

  return {
    ...result,
    kundenakteId,
  };
}

/** Verarbeitet Transkript lokal (Offline-Test ohne API). */
export function processAndIngestVoiceCall(input: {
  call: VoiceCallRecord;
  transcript: string;
}): VoiceProcessedCall {
  const result = processVoiceCall(input);
  return ingestVoiceProcessedCall(result);
}

export function getVoiceCallsTodayCount(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getVoiceCalls().filter(
    (call) => Date.parse(call.startedAt) >= today.getTime()
  ).length;
}
