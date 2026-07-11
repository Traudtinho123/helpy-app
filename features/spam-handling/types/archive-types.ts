export type ArchivePreparationStatus =
  | "zum_archivieren_vorbereitet"
  | "archivierung_bestaetigt";

export type ArchivePreparation = {
  id: string;
  vorgangId: string;
  recommendation: string;
  statusLabel: string;
  status: ArchivePreparationStatus;
  needsConfirmation: true;
};

export type ArchivePreparationInput = {
  vorgangId: string;
  subject?: string;
  sender?: string;
  summary?: string;
};
