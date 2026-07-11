export type CrmPipelineStage =
  | "interessent"
  | "kontakt-aufgenommen"
  | "besichtigung-geplant"
  | "besichtigung-durchgefuehrt"
  | "offerte-vorbereitet"
  | "offerte-versendet"
  | "verhandlung"
  | "reserviert"
  | "verkauft";

export type CrmPipelineTrigger =
  | "neue-anfrage"
  | "besichtigung-bestaetigt"
  | "offerte-erstellt"
  | "offerte-gesendet";

export type CrmPipelineRecord = {
  vorgangId: string;
  currentStage: CrmPipelineStage;
  recommendedStage: CrmPipelineStage;
  recommendationText: string;
  manuallySet: boolean;
  updatedAt: string;
};

export type CrmPipelineOverviewItem = {
  stage: CrmPipelineStage;
  label: string;
  count: number;
};

export const CRM_PIPELINE_STAGES: CrmPipelineStage[] = [
  "interessent",
  "kontakt-aufgenommen",
  "besichtigung-geplant",
  "besichtigung-durchgefuehrt",
  "offerte-vorbereitet",
  "offerte-versendet",
  "verhandlung",
  "reserviert",
  "verkauft",
];

export const CRM_PIPELINE_STAGE_LABELS: Record<CrmPipelineStage, string> = {
  interessent: "Interessent",
  "kontakt-aufgenommen": "Kontakt aufgenommen",
  "besichtigung-geplant": "Besichtigung geplant",
  "besichtigung-durchgefuehrt": "Besichtigung durchgeführt",
  "offerte-vorbereitet": "Offerte vorbereitet",
  "offerte-versendet": "Offerte versendet",
  verhandlung: "Verhandlung",
  reserviert: "Reserviert",
  verkauft: "Verkauft",
};

export const CRM_PIPELINE_NEXT_STEP: Record<CrmPipelineStage, string> = {
  interessent: "Besichtigung planen",
  "kontakt-aufgenommen": "Besichtigung planen",
  "besichtigung-geplant": "Besichtigung durchführen",
  "besichtigung-durchgefuehrt": "Offerte vorbereiten",
  "offerte-vorbereitet": "Offerte versenden",
  "offerte-versendet": "Verhandlung führen",
  verhandlung: "Reservierung abschliessen",
  reserviert: "Verkauf abschliessen",
  verkauft: "Vorgang abschliessen",
};

export const CRM_PIPELINE_TRIGGER_STAGE: Record<CrmPipelineTrigger, CrmPipelineStage> =
  {
    "neue-anfrage": "interessent",
    "besichtigung-bestaetigt": "besichtigung-geplant",
    "offerte-erstellt": "offerte-vorbereitet",
    "offerte-gesendet": "offerte-versendet",
  };
