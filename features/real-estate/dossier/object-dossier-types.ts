export type ObjectDossierStatus = "draft" | "final";

export type ObjectDossierEckdaten = {
  label: string;
  value: string;
};

export type ObjectDossier = {
  objectId: string;
  status: ObjectDossierStatus;
  updatedAt: string;
  confirmedAt?: string | null;
  /** Abschnitt 1 — Objektübersicht */
  titel: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  objectType: string;
  transaktion: string;
  preisLabel: string;
  eckdaten: ObjectDossierEckdaten[];
  /** Abschnitt 2 — Beschreibung */
  description: string;
  descriptionAiGenerated: boolean;
  /** Abschnitt 3 — Highlights */
  highlights: string[];
  highlightsAiGenerated: boolean;
  /** Abschnitt 4 — Nächste Schritte */
  contactBlock: string;
  nextStepActions: string[];
  contactAiGenerated: boolean;
};

export type ObjectDossierDraftInput = Partial<
  Omit<ObjectDossier, "objectId" | "updatedAt">
>;
