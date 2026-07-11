export type WorkspacePanelField = {
  label: string;
  value: string;
  highlight?: boolean;
  editable?: boolean;
  editKey?: string;
};

export type WorkspacePanelViewModel = {
  title: string;
  status: string;
  fields: WorkspacePanelField[];
  helpyHint?: string;
  canOpen: boolean;
  fallbackHref?: string;
  /** Gmail-Anhang für Vorschau/Download (API-Proxy) */
  mailAttachment?: import("@/features/mail/types/unified-mail-types").UnifiedMailAttachment | null;
  assignedToLabel?: string | null;
  relatedObjectId?: string | null;
  relatedObjectTitle?: string | null;
};
