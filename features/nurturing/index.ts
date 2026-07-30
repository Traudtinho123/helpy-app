export type {
  NurturingCampaignType,
  NurturingMailRecord,
  NurturingSettings,
  NurturingRoiStats,
} from "@/features/nurturing/types/nurturing-types";
export { NURTURING_CAMPAIGN_LABELS } from "@/features/nurturing/types/nurturing-types";
export {
  createDefaultNurturingSettings,
  cloneNurturingSettings,
  parseNurturingSettings,
  DEFAULT_NURTURING_TEMPLATES,
} from "@/features/nurturing/services/nurturing-templates";
export {
  nextCampaignHint,
  isEligibleBestandskunde,
} from "@/features/nurturing/services/nurturing-rules";
