import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety/review-mode";

export type HelpyVorgangStatus =
  | "neu"
  | "von-helpy-vorbereitet"
  | "in-pruefung"
  | "bestaetigt"
  | "erledigt"
  | "wartet-auf-rueckmeldung";

export type StatusHistoryEntry = {
  id: string;
  time: string;
  label: string;
  at: string;
};

export type VorgangStatusSnapshot = {
  vorgangId: string;
  currentStatus: HelpyVorgangStatus;
  history: StatusHistoryEntry[];
};

export type DailyStatusSummary = {
  vorbereitet: number;
  wartenAufPruefung: number;
  bestaetigt: number;
  erledigt: number;
  introMessage: string;
};

export const HELPY_STATUS_LABELS: Record<HelpyVorgangStatus, string> = {
  neu: "Neu",
  "von-helpy-vorbereitet": "Von HELPY vorbereitet",
  "in-pruefung": "In Prüfung",
  bestaetigt: "Bestätigt",
  erledigt: "Erledigt",
  "wartet-auf-rueckmeldung": "Warten auf Antwort",
};

export const HELPY_STATUS_STYLES: Record<HelpyVorgangStatus, string> = {
  neu: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  "von-helpy-vorbereitet": "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
  "in-pruefung": "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  bestaetigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  erledigt: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
  "wartet-auf-rueckmeldung": "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
};

export const STATUS_PANEL_MESSAGE = HELPY_PANEL_REVIEW_INTRO;

export type AppendHistoryInput = {
  vorgangId: string;
  label: string;
  status?: HelpyVorgangStatus;
  at?: string;
};
