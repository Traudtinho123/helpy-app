/** Legacy event shape — used by queue for modular swap to real inbox later. */
export type AutopilotEventType =
  | "angebotsanfrage"
  | "rechnung"
  | "terminbestaetigung"
  | "neuer_kunde"
  | "support_anfrage";

export type AutopilotEvent = {
  id: string;
  type: AutopilotEventType;
  title: string;
  description: string;
  absender?: string;
  betreff?: string;
  receivedAt: string;
};
