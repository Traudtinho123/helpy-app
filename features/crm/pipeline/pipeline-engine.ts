import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { getPreparedDocumentForVorgang } from "@/features/documents/services/document-engine";
import {
  getAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  CRM_PIPELINE_NEXT_STEP,
  CRM_PIPELINE_STAGE_LABELS,
  CRM_PIPELINE_STAGES,
  CRM_PIPELINE_TRIGGER_STAGE,
  type CrmPipelineOverviewItem,
  type CrmPipelineRecord,
  type CrmPipelineStage,
  type CrmPipelineTrigger,
} from "@/features/crm/pipeline/pipeline-types";
import {
  getAllCrmPipelineRecords,
  getCrmPipelineRecord,
  upsertCrmPipelineRecord,
} from "@/features/crm/pipeline/pipeline-store";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export function getPipelineStageIndex(stage: CrmPipelineStage): number {
  return CRM_PIPELINE_STAGES.indexOf(stage);
}

function maxPipelineStage(
  a: CrmPipelineStage,
  b: CrmPipelineStage
): CrmPipelineStage {
  return getPipelineStageIndex(a) >= getPipelineStageIndex(b) ? a : b;
}

function getNextPipelineStage(stage: CrmPipelineStage): CrmPipelineStage | null {
  const index = getPipelineStageIndex(stage);
  if (index < 0 || index >= CRM_PIPELINE_STAGES.length - 1) return null;
  return CRM_PIPELINE_STAGES[index + 1];
}

export function buildPipelineRecommendationText(
  currentStage: CrmPipelineStage,
  recommendedStage: CrmPipelineStage
): string {
  const target =
    getPipelineStageIndex(recommendedStage) > getPipelineStageIndex(currentStage)
      ? recommendedStage
      : getNextPipelineStage(currentStage);

  if (!target) {
    return "Alle Schritte sind erledigt.";
  }

  return `Ich empfehle als nächsten Schritt: ${CRM_PIPELINE_NEXT_STEP[target]}.`;
}

function createPipelineRecord(
  vorgangId: string,
  stage: CrmPipelineStage
): CrmPipelineRecord {
  const recommendationText = buildPipelineRecommendationText(stage, stage);
  return {
    vorgangId,
    currentStage: stage,
    recommendedStage: stage,
    recommendationText,
    manuallySet: false,
    updatedAt: new Date().toISOString(),
  };
}

function shouldTrackPipeline(liste?: ListeVorgang, workspace?: WorkspaceVorgang): boolean {
  if (liste && shouldPrepareArchive(liste)) return false;
  if (liste?.typ === "anfrage") return true;
  if (liste?.quelle && isPlatformRealEstateQuelle(liste.quelle)) return true;
  if (workspace?.skill === "real-estate") return true;
  return false;
}

export function recommendPipelineStageFromTrigger(
  trigger: CrmPipelineTrigger
): CrmPipelineStage {
  return CRM_PIPELINE_TRIGGER_STAGE[trigger];
}

export function applyPipelineTrigger(
  vorgangId: string,
  trigger: CrmPipelineTrigger
): CrmPipelineRecord | null {
  const suggested = recommendPipelineStageFromTrigger(trigger);
  const existing = getCrmPipelineRecord(vorgangId);

  if (!existing) {
    const created = createPipelineRecord(vorgangId, suggested);
    return upsertCrmPipelineRecord(created);
  }

  const recommendedStage = maxPipelineStage(existing.recommendedStage, suggested);
  const currentStage =
    !existing.manuallySet &&
    getPipelineStageIndex(suggested) > getPipelineStageIndex(existing.currentStage)
      ? suggested
      : existing.currentStage;

  const updated: CrmPipelineRecord = {
    ...existing,
    currentStage,
    recommendedStage,
    recommendationText: buildPipelineRecommendationText(
      currentStage,
      recommendedStage
    ),
    updatedAt: new Date().toISOString(),
  };

  return upsertCrmPipelineRecord(updated);
}

export function setPipelineStage(
  vorgangId: string,
  stage: CrmPipelineStage
): CrmPipelineRecord {
  const existing =
    getCrmPipelineRecord(vorgangId) ?? createPipelineRecord(vorgangId, stage);

  const recommendedStage = maxPipelineStage(existing.recommendedStage, stage);
  const updated: CrmPipelineRecord = {
    ...existing,
    currentStage: stage,
    recommendedStage,
    recommendationText: buildPipelineRecommendationText(stage, recommendedStage),
    manuallySet: true,
    updatedAt: new Date().toISOString(),
  };

  return upsertCrmPipelineRecord(updated);
}

export function ensurePipelineForVorgang(
  vorgangId: string,
  liste?: ListeVorgang,
  workspace?: WorkspaceVorgang
): CrmPipelineRecord | null {
  if (!shouldTrackPipeline(liste, workspace)) return null;

  const existing = getCrmPipelineRecord(vorgangId);
  if (existing) return existing;

  return applyPipelineTrigger(vorgangId, "neue-anfrage");
}

export function preparePipelineFromGmailBundle(
  bundle: GmailVorgangBundle
): CrmPipelineRecord | null {
  if (!shouldTrackPipeline(bundle.liste, bundle.workspace)) return null;
  return ensurePipelineForVorgang(
    bundle.liste.id,
    bundle.liste,
    bundle.workspace
  );
}

export function seedPipelineFromGmailBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    preparePipelineFromGmailBundle(bundle);
    syncPipelineSignalsForVorgang(bundle.liste.id, bundle.liste, bundle.workspace);
  }
}

export function seedPipelineFromListeVorgaenge(
  vorgaenge: ListeVorgang[],
  workspaces: Record<string, WorkspaceVorgang>
): void {
  for (const liste of vorgaenge) {
    const workspace = workspaces[liste.id];
    ensurePipelineForVorgang(liste.id, liste, workspace);
    syncPipelineSignalsForVorgang(liste.id, liste, workspace);
  }
}

export function syncPipelineSignalsForVorgang(
  vorgangId: string,
  liste?: ListeVorgang,
  workspace?: WorkspaceVorgang
): CrmPipelineRecord | null {
  if (!shouldTrackPipeline(liste, workspace)) return null;
  if (!getCrmPipelineRecord(vorgangId)) {
    ensurePipelineForVorgang(vorgangId, liste, workspace);
  }

  const appointment = getAppointmentSuggestion(vorgangId);
  if (
    appointment?.status === "bestaetigt" ||
    appointment?.confirmationStatus === "saved_to_calendar" ||
    appointment?.confirmationStatus === "customer_confirmed"
  ) {
    applyPipelineTrigger(vorgangId, "besichtigung-bestaetigt");
  }

  const offerte = getPreparedDocumentForVorgang(vorgangId, "offerte");
  const expose = getPreparedDocumentForVorgang(vorgangId, "expose");
  if (offerte || expose?.preparedByHelpy) {
    applyPipelineTrigger(vorgangId, "offerte-erstellt");
  }

  if (offerte?.status === "gesendet") {
    applyPipelineTrigger(vorgangId, "offerte-gesendet");
  }

  return getCrmPipelineRecord(vorgangId);
}

export function buildPipelineOverview(
  vorgangIds?: string[]
): CrmPipelineOverviewItem[] {
  const allowed = vorgangIds ? new Set(vorgangIds) : null;
  const counts = new Map<CrmPipelineStage, number>();

  for (const stage of CRM_PIPELINE_STAGES) {
    counts.set(stage, 0);
  }

  for (const record of getAllCrmPipelineRecords()) {
    if (allowed && !allowed.has(record.vorgangId)) continue;
    counts.set(record.currentStage, (counts.get(record.currentStage) ?? 0) + 1);
  }

  return CRM_PIPELINE_STAGES.map((stage) => ({
    stage,
    label: CRM_PIPELINE_STAGE_LABELS[stage],
    count: counts.get(stage) ?? 0,
  })).filter((item) => item.count > 0);
}

export function getCrmPipelineSnapshot(vorgangId: string): CrmPipelineRecord | null {
  return getCrmPipelineRecord(vorgangId);
}

export function getCrmPipelineServerSnapshot(): CrmPipelineRecord | null {
  return null;
}

export {
  subscribeCrmPipeline,
} from "@/features/crm/pipeline/pipeline-store";
