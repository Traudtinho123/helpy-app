export type {
  CrmPipelineOverviewItem,
  CrmPipelineRecord,
  CrmPipelineStage,
  CrmPipelineTrigger,
} from "@/features/crm/pipeline/pipeline-types";

export {
  CRM_PIPELINE_NEXT_STEP,
  CRM_PIPELINE_STAGE_LABELS,
  CRM_PIPELINE_STAGES,
} from "@/features/crm/pipeline/pipeline-types";

export {
  clearCrmPipelineStore,
  getAllCrmPipelineRecords,
  getCrmPipelineRecord,
  subscribeCrmPipeline,
} from "@/features/crm/pipeline/pipeline-store";

export {
  applyPipelineTrigger,
  buildPipelineOverview,
  buildPipelineRecommendationText,
  ensurePipelineForVorgang,
  getCrmPipelineServerSnapshot,
  getCrmPipelineSnapshot,
  getPipelineStageIndex,
  preparePipelineFromGmailBundle,
  recommendPipelineStageFromTrigger,
  seedPipelineFromGmailBundles,
  seedPipelineFromListeVorgaenge,
  setPipelineStage,
  syncPipelineSignalsForVorgang,
} from "@/features/crm/pipeline/pipeline-engine";

export { HelpyNextRecommendation } from "@/features/crm/pipeline/components/helpy-next-recommendation";
