import type {
  NurturingCampaignType,
  NurturingMailRecord,
  NurturingMailStatus,
  NurturingRoiStats,
} from "@/features/nurturing/types/nurturing-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devMails = new Map<string, NurturingMailRecord>();

function generateId(): string {
  return crypto.randomUUID();
}

function rowToRecord(row: Record<string, unknown>): NurturingMailRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    kunde_id: String(row.kunde_id),
    deal_id: typeof row.deal_id === "string" ? row.deal_id : null,
    campaign_type: row.campaign_type as NurturingCampaignType,
    status: row.status as NurturingMailStatus,
    subject: String(row.subject ?? ""),
    body_text: String(row.body_text ?? ""),
    body_html: typeof row.body_html === "string" ? row.body_html : null,
    to_email: String(row.to_email ?? ""),
    kunde_name: typeof row.kunde_name === "string" ? row.kunde_name : null,
    objekt_label: typeof row.objekt_label === "string" ? row.objekt_label : null,
    scheduled_for: String(row.scheduled_for ?? "").slice(0, 10),
    prepared_at: String(row.prepared_at ?? new Date().toISOString()),
    sent_at: typeof row.sent_at === "string" ? row.sent_at : null,
    gmail_message_id:
      typeof row.gmail_message_id === "string" ? row.gmail_message_id : null,
    gmail_thread_id:
      typeof row.gmail_thread_id === "string" ? row.gmail_thread_id : null,
    tracking_token: String(row.tracking_token ?? generateId()),
    opened_at: typeof row.opened_at === "string" ? row.opened_at : null,
    open_count: Number(row.open_count ?? 0),
    replied_at: typeof row.replied_at === "string" ? row.replied_at : null,
    deal_created_id:
      typeof row.deal_created_id === "string" ? row.deal_created_id : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export type CreateNurturingMailInput = {
  company_id: string;
  kunde_id: string;
  deal_id?: string | null;
  campaign_type: NurturingCampaignType;
  subject: string;
  body_text: string;
  body_html?: string | null;
  to_email: string;
  kunde_name?: string | null;
  objekt_label?: string | null;
  scheduled_for: string;
};

export async function listPreparedNurturingMails(
  companyId: string
): Promise<NurturingMailRecord[]> {
  if (!isSupabaseConfigured()) {
    return [...devMails.values()]
      .filter(
        (mail) =>
          mail.company_id === companyId && mail.status === "vorbereitet"
      )
      .sort((a, b) => b.prepared_at.localeCompare(a.prepared_at));
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("nurturing_mails")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "vorbereitet")
    .order("prepared_at", { ascending: false });

  if (error) {
    console.error("[nurturing] list prepared failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function listNurturingMailsForCompany(
  companyId: string
): Promise<NurturingMailRecord[]> {
  if (!isSupabaseConfigured()) {
    return [...devMails.values()]
      .filter((mail) => mail.company_id === companyId)
      .sort((a, b) => b.prepared_at.localeCompare(a.prepared_at));
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("nurturing_mails")
    .select("*")
    .eq("company_id", companyId)
    .order("prepared_at", { ascending: false });

  if (error) {
    console.error("[nurturing] list failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function listSentNurturingMailsForKunde(
  companyId: string,
  kundeId: string
): Promise<NurturingMailRecord[]> {
  if (!isSupabaseConfigured()) {
    return [...devMails.values()].filter(
      (mail) =>
        mail.company_id === companyId &&
        mail.kunde_id === kundeId &&
        mail.status === "gesendet"
    );
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("nurturing_mails")
    .select("*")
    .eq("company_id", companyId)
    .eq("kunde_id", kundeId)
    .eq("status", "gesendet")
    .order("sent_at", { ascending: false });

  if (error) {
    console.error("[nurturing] list sent for kunde failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function getNurturingMailById(
  companyId: string,
  mailId: string
): Promise<NurturingMailRecord | null> {
  if (!isSupabaseConfigured()) {
    const mail = devMails.get(mailId);
    if (!mail || mail.company_id !== companyId) return null;
    return mail;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("nurturing_mails")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", mailId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function getNurturingMailByTrackingToken(
  token: string
): Promise<NurturingMailRecord | null> {
  if (!isSupabaseConfigured()) {
    return (
      [...devMails.values()].find((mail) => mail.tracking_token === token) ??
      null
    );
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("nurturing_mails")
    .select("*")
    .eq("tracking_token", token)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function insertNurturingMail(
  input: CreateNurturingMailInput
): Promise<NurturingMailRecord | null> {
  const now = new Date().toISOString();
  const trackingToken = generateId();

  if (!isSupabaseConfigured()) {
    const existing = [...devMails.values()].find(
      (mail) =>
        mail.company_id === input.company_id &&
        mail.kunde_id === input.kunde_id &&
        mail.campaign_type === input.campaign_type &&
        mail.scheduled_for === input.scheduled_for
    );
    if (existing) return existing;

    const record: NurturingMailRecord = {
      id: generateId(),
      company_id: input.company_id,
      kunde_id: input.kunde_id,
      deal_id: input.deal_id ?? null,
      campaign_type: input.campaign_type,
      status: "vorbereitet",
      subject: input.subject,
      body_text: input.body_text,
      body_html: input.body_html ?? null,
      to_email: input.to_email,
      kunde_name: input.kunde_name ?? null,
      objekt_label: input.objekt_label ?? null,
      scheduled_for: input.scheduled_for,
      prepared_at: now,
      sent_at: null,
      gmail_message_id: null,
      gmail_thread_id: null,
      tracking_token: trackingToken,
      opened_at: null,
      open_count: 0,
      replied_at: null,
      deal_created_id: null,
      created_at: now,
      updated_at: now,
    };
    devMails.set(record.id, record);
    return record;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const payload = {
    company_id: input.company_id,
    kunde_id: input.kunde_id,
    deal_id: input.deal_id ?? null,
    campaign_type: input.campaign_type,
    status: "vorbereitet",
    subject: input.subject,
    body_text: input.body_text,
    body_html: input.body_html ?? null,
    to_email: input.to_email,
    kunde_name: input.kunde_name ?? null,
    objekt_label: input.objekt_label ?? null,
    scheduled_for: input.scheduled_for,
    tracking_token: trackingToken,
  };

  const { data, error } = await supabase
    .from("nurturing_mails")
    .upsert(payload as never, {
      onConflict: "company_id,kunde_id,campaign_type,scheduled_for",
      ignoreDuplicates: true,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    // Unique conflict with ignoreDuplicates may return null — fetch existing
    const { data: existing } = await supabase
      .from("nurturing_mails")
      .select("*")
      .eq("company_id", input.company_id)
      .eq("kunde_id", input.kunde_id)
      .eq("campaign_type", input.campaign_type)
      .eq("scheduled_for", input.scheduled_for)
      .maybeSingle();

    if (existing) return rowToRecord(existing as Record<string, unknown>);
    console.error("[nurturing] insert failed:", error.message);
    return null;
  }

  if (!data) {
    const { data: existing } = await supabase
      .from("nurturing_mails")
      .select("*")
      .eq("company_id", input.company_id)
      .eq("kunde_id", input.kunde_id)
      .eq("campaign_type", input.campaign_type)
      .eq("scheduled_for", input.scheduled_for)
      .maybeSingle();
    if (existing) return rowToRecord(existing as Record<string, unknown>);
    return null;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function updateNurturingMailContent(input: {
  companyId: string;
  mailId: string;
  subject: string;
  body_text: string;
  body_html?: string | null;
}): Promise<NurturingMailRecord | null> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const existing = devMails.get(input.mailId);
    if (!existing || existing.company_id !== input.companyId) return null;
    if (existing.status !== "vorbereitet") return null;
    const updated: NurturingMailRecord = {
      ...existing,
      subject: input.subject,
      body_text: input.body_text,
      body_html: input.body_html ?? existing.body_html,
      updated_at: now,
    };
    devMails.set(updated.id, updated);
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("nurturing_mails")
    .update({
      subject: input.subject,
      body_text: input.body_text,
      body_html: input.body_html ?? null,
      updated_at: now,
    } as never)
    .eq("id", input.mailId)
    .eq("company_id", input.companyId)
    .eq("status", "vorbereitet")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("[nurturing] update content failed:", error?.message);
    return null;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function markNurturingMailSent(input: {
  companyId: string;
  mailId: string;
  gmailMessageId?: string | null;
  gmailThreadId?: string | null;
}): Promise<NurturingMailRecord | null> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const existing = devMails.get(input.mailId);
    if (!existing || existing.company_id !== input.companyId) return null;
    const updated: NurturingMailRecord = {
      ...existing,
      status: "gesendet",
      sent_at: now,
      gmail_message_id: input.gmailMessageId ?? null,
      gmail_thread_id: input.gmailThreadId ?? null,
      updated_at: now,
    };
    devMails.set(updated.id, updated);
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("nurturing_mails")
    .update({
      status: "gesendet",
      sent_at: now,
      gmail_message_id: input.gmailMessageId ?? null,
      gmail_thread_id: input.gmailThreadId ?? null,
      updated_at: now,
    } as never)
    .eq("id", input.mailId)
    .eq("company_id", input.companyId)
    .eq("status", "vorbereitet")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    console.error("[nurturing] mark sent failed:", error?.message);
    return null;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function recordNurturingOpen(
  token: string
): Promise<NurturingMailRecord | null> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const existing = [...devMails.values()].find(
      (mail) => mail.tracking_token === token
    );
    if (!existing) return null;
    const updated: NurturingMailRecord = {
      ...existing,
      opened_at: existing.opened_at ?? now,
      open_count: existing.open_count + 1,
      updated_at: now,
    };
    devMails.set(updated.id, updated);
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const existing = await getNurturingMailByTrackingToken(token);
  if (!existing) return null;

  const { data, error } = await supabase
    .from("nurturing_mails")
    .update({
      opened_at: existing.opened_at ?? now,
      open_count: existing.open_count + 1,
      updated_at: now,
    } as never)
    .eq("id", existing.id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function markNurturingReplied(input: {
  companyId: string;
  gmailThreadId?: string | null;
  toEmail?: string | null;
}): Promise<number> {
  const now = new Date().toISOString();
  let updated = 0;

  if (!isSupabaseConfigured()) {
    for (const mail of devMails.values()) {
      if (mail.company_id !== input.companyId) continue;
      if (mail.status !== "gesendet" || mail.replied_at) continue;
      const threadMatch =
        input.gmailThreadId && mail.gmail_thread_id === input.gmailThreadId;
      const emailMatch =
        input.toEmail &&
        mail.to_email.toLowerCase() === input.toEmail.toLowerCase();
      if (!threadMatch && !emailMatch) continue;
      mail.replied_at = now;
      mail.updated_at = now;
      updated += 1;
    }
    return updated;
  }

  const supabase = await createClient();
  if (!supabase) return 0;

  if (input.gmailThreadId) {
    const { data } = await supabase
      .from("nurturing_mails")
      .update({ replied_at: now, updated_at: now } as never)
      .eq("company_id", input.companyId)
      .eq("status", "gesendet")
      .eq("gmail_thread_id", input.gmailThreadId)
      .is("replied_at", null)
      .select("id");
    updated += data?.length ?? 0;
  }

  if (input.toEmail && updated === 0) {
    const { data } = await supabase
      .from("nurturing_mails")
      .update({ replied_at: now, updated_at: now } as never)
      .eq("company_id", input.companyId)
      .eq("status", "gesendet")
      .eq("to_email", input.toEmail)
      .is("replied_at", null)
      .select("id");
    updated += data?.length ?? 0;
  }

  return updated;
}

export async function linkNurturingDealCreated(input: {
  companyId: string;
  kundeId: string;
  dealId: string;
}): Promise<void> {
  const now = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    for (const mail of [...devMails.values()].sort((a, b) =>
      (b.sent_at ?? "").localeCompare(a.sent_at ?? "")
    )) {
      if (
        mail.company_id === input.companyId &&
        mail.kunde_id === input.kundeId &&
        mail.status === "gesendet" &&
        !mail.deal_created_id
      ) {
        mail.deal_created_id = input.dealId;
        mail.updated_at = now;
        break;
      }
    }
    return;
  }

  const supabase = await createClient();
  if (!supabase) return;

  const { data: candidates } = await supabase
    .from("nurturing_mails")
    .select("id")
    .eq("company_id", input.companyId)
    .eq("kunde_id", input.kundeId)
    .eq("status", "gesendet")
    .is("deal_created_id", null)
    .order("sent_at", { ascending: false })
    .limit(1);

  const targetId = (candidates?.[0] as { id?: string } | undefined)?.id;
  if (!targetId) return;

  await supabase
    .from("nurturing_mails")
    .update({ deal_created_id: input.dealId, updated_at: now } as never)
    .eq("id", targetId);
}

export function computeNurturingRoi(
  mails: NurturingMailRecord[]
): NurturingRoiStats {
  const prepared = mails.filter((m) => m.status === "vorbereitet").length;
  const sent = mails.filter((m) => m.status === "gesendet");
  const opened = sent.filter((m) => m.opened_at || m.open_count > 0);
  const replied = sent.filter((m) => m.replied_at);
  const dealsCreated = sent.filter((m) => m.deal_created_id);

  return {
    prepared,
    sent: sent.length,
    opened: opened.length,
    replied: replied.length,
    dealsCreated: dealsCreated.length,
    openRate: sent.length ? opened.length / sent.length : 0,
    replyRate: sent.length ? replied.length / sent.length : 0,
  };
}

export async function promoteKundeToBestandskunde(input: {
  companyId: string;
  kundeId: string;
  dealId: string;
  objektId: string | null;
  closedAt: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("kunden")
    .update({
      status: "bestandskunde",
      letzter_deal_abschluss: input.closedAt,
      letzter_deal_id: input.dealId,
      letzter_deal_objekt_id: input.objektId,
      letzter_kontakt: input.closedAt,
      nurturing_aktiv: true,
    } as never)
    .eq("id", input.kundeId)
    .eq("company_id", input.companyId);
}

export async function touchKundeLetzterKontakt(input: {
  companyId: string;
  kundeId: string;
  at?: string;
}): Promise<void> {
  const at = input.at ?? new Date().toISOString();

  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  if (!supabase) return;

  await supabase
    .from("kunden")
    .update({ letzter_kontakt: at } as never)
    .eq("id", input.kundeId)
    .eq("company_id", input.companyId);
}
