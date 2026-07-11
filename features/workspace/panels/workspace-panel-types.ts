export type WorkspacePanelKind =
  | "kunde"
  | "objekt"
  | "dokument"
  | "termin"
  | "angebot";

export type WorkspacePanelKundePayload = {
  vorgangId: string;
  customerName?: string;
  customerEmail?: string;
};

export type WorkspacePanelObjektPayload = {
  vorgangId: string;
  objectId?: string;
  objectTitle?: string;
};

export type WorkspacePanelDokumentPayload = {
  vorgangId: string;
  documentId?: string;
  fileName?: string;
  messageId?: string;
  focus?: "expose" | "offerte" | "dokument";
};

export type WorkspacePanelTerminPayload = {
  vorgangId: string;
  appointmentId?: string;
  dateLabel?: string;
};

export type WorkspacePanelAngebotPayload = {
  vorgangId: string;
  offerId?: string;
  offerTitle?: string;
};

export type WorkspacePanelPayloadMap = {
  kunde: WorkspacePanelKundePayload;
  objekt: WorkspacePanelObjektPayload;
  dokument: WorkspacePanelDokumentPayload;
  termin: WorkspacePanelTerminPayload;
  angebot: WorkspacePanelAngebotPayload;
};

export type WorkspacePanel<K extends WorkspacePanelKind = WorkspacePanelKind> = {
  id: string;
  kind: K;
  title: string;
  payload: WorkspacePanelPayloadMap[K];
  openedAt: number;
};

export type AnyWorkspacePanel =
  | WorkspacePanel<"kunde">
  | WorkspacePanel<"objekt">
  | WorkspacePanel<"dokument">
  | WorkspacePanel<"termin">
  | WorkspacePanel<"angebot">;

export type OpenWorkspacePanelInput<K extends WorkspacePanelKind = WorkspacePanelKind> =
  {
    kind: K;
    title?: string;
    payload: WorkspacePanelPayloadMap[K];
    id?: string;
  };

export const WORKSPACE_PANEL_TITLES: Record<WorkspacePanelKind, string> = {
  kunde: "Kunde",
  objekt: "Objekt",
  dokument: "Dokument",
  termin: "Termin",
  angebot: "Angebot",
};

export const WORKSPACE_PANEL_DESCRIPTIONS: Record<WorkspacePanelKind, string> = {
  kunde: "Kundeninformationen direkt im Workspace prüfen.",
  objekt: "Objekt- oder Projektbezug ohne Seitenwechsel einsehen.",
  dokument: "Dokumentdetails und Zuordnung im Workspace öffnen.",
  termin: "Terminvorschläge und Besichtigungen im Kontext bearbeiten.",
  angebot: "Offerten und Angebotsentwürfe im Workspace prüfen.",
};
