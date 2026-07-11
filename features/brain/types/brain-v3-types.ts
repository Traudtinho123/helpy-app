import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import type { ViewingExtraction } from "@/features/brain/services/viewing-extraction";
import type {
  DetectedPlatform,
  PlatformInquiryExtraction,
} from "@/features/brain/types/platform-inquiry-types";

export type BrainV3Skill =
  | "HELPY Real Estate"
  | "HELPY Construction"
  | "HELPY Consulting & Legal"
  | "Allgemein";

/**
 * Mail-Intent (regelbasiert). Shared + skill-spezifische Intents.
 * Real Estate: Interessentenanfrage, Besichtigung, …
 * Construction: Vor-Ort-Termin, Materialanfrage, Auftragsanfrage, …
 * Consulting: Mandatsanfrage, Erstgespräch, …
 */
export type BrainV3Intent =
  | "Neue Anfrage"
  | "Interessentenanfrage"
  | "Angebotsanfrage"
  | "Besichtigung"
  | "Vor-Ort-Termin"
  | "Materialanfrage"
  | "Auftragsanfrage"
  | "Mandatsanfrage"
  | "Erstgespräch"
  | "Geschäftsanfrage"
  | "Bestandskunden-Kommunikation"
  | "Rückruf"
  | "Terminwunsch"
  | "Frist"
  | "Rechnung"
  | "Dokument"
  | "Normale Nachricht"
  | "Sonstiges / Unklar"
  | "Spam / Newsletter";

export type BrainV3Priority = "kritisch" | "hoch" | "mittel" | "niedrig";

export type BrainV3Status = "Von HELPY vorbereitet";

export type BrainV3Result = {
  id: string;
  source: "gmail" | "outlook";
  originalEmailId: string;
  threadId: string;
  subject: string;
  from: string;
  skill: BrainV3Skill;
  intent: BrainV3Intent;
  priority: BrainV3Priority;
  summary: string;
  recommendedAction: string;
  status: BrainV3Status;
  createdAt: string;
  /** Erkannte Immobilienplattform aus E-Mail-Inhalt */
  detectedPlatform?: DetectedPlatform;
  /** Extrahierte Anfrage-Felder bei Plattform-Erkennung */
  platformInquiry?: PlatformInquiryExtraction;
  /** Strukturierte Besichtigungs-Extraktion (Datum, Objekt, Kontakt) */
  viewingExtraction?: ViewingExtraction;
};

export type BrainV3AnalysisInput = Pick<
  GmailConnectorMessage,
  "id" | "threadId" | "subject" | "from" | "snippet" | "date"
>;
