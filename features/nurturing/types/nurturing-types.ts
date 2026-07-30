export type NurturingCampaignType =
  | "marktupdate"
  | "jahrestag"
  | "weiterempfehlung";

export type NurturingMailStatus =
  | "vorbereitet"
  | "gesendet"
  | "abgebrochen";

export const NURTURING_CAMPAIGN_LABELS: Record<NurturingCampaignType, string> =
  {
    marktupdate: "Marktupdate",
    jahrestag: "Jahrestag",
    weiterempfehlung: "Weiterempfehlung",
  };

export type NurturingMailTemplate = {
  subject: string;
  body: string;
};

export type NurturingSettings = {
  marktupdateEnabled: boolean;
  jahrestagEnabled: boolean;
  weiterempfehlungEnabled: boolean;
  templates: Record<NurturingCampaignType, NurturingMailTemplate>;
};

export type NurturingMailRecord = {
  id: string;
  company_id: string;
  kunde_id: string;
  deal_id: string | null;
  campaign_type: NurturingCampaignType;
  status: NurturingMailStatus;
  subject: string;
  body_text: string;
  body_html: string | null;
  to_email: string;
  kunde_name: string | null;
  objekt_label: string | null;
  scheduled_for: string;
  prepared_at: string;
  sent_at: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  tracking_token: string;
  opened_at: string | null;
  open_count: number;
  replied_at: string | null;
  deal_created_id: string | null;
  created_at: string;
  updated_at: string;
};

export type NurturingRoiStats = {
  prepared: number;
  sent: number;
  opened: number;
  replied: number;
  dealsCreated: number;
  openRate: number;
  replyRate: number;
};

/** Bestandskunde: letzter Deal abgeschlossen vor mehr als 90 Tagen. */
export const BESTANDSKUNDE_DAYS_AFTER_CLOSE = 90;

/** Marktupdate-Kadenz in Monaten. */
export const MARKTUPDATE_INTERVAL_MONTHS = 3;

/** Weiterempfehlung: Monate nach Abschluss. */
export const WEITEREMPFEHLUNG_MONTHS_AFTER_CLOSE = 6;
