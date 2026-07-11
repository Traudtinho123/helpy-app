/**
 * HELPY Datenpipeline — interne Architektur
 *
 * Platform Layer  →  externe Systeme (Gmail, ImmoScout24, …)
 *        ↓
 * HELPY Connect   →  lib/connect — Event Queue, Connectoren, Sync
 *        ↓
 * HELPY Brain v2  →  lib/brain-v2 — Intent, Priorität, Vorgänge vorbereiten
 *        ↓
 * HELPY Brain     →  Erkennung, Priorisierung, Empfehlungen (Legacy)
 *        ↓
 * Vorgänge        →  Einheitliche Arbeitsobjekte für den Nutzer
 *        ↓
 * Workspace       →  Bearbeitung im Kontext
 *
 * Der Nutzer sieht nur Vorgänge — nie die Herkunftsplattform als Hauptnavigation.
 */

export type HelpyPipelineStage =
  | "platform"
  | "connect"
  | "brain"
  | "vorgaenge"
  | "workspace";

export const HELPY_PIPELINE_STAGES: HelpyPipelineStage[] = [
  "platform",
  "connect",
  "brain",
  "vorgaenge",
  "workspace",
];
