import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WhatsappConnectionRow,
  WhatsappMessageRow,
  WhatsappMessageStatusDb,
} from "@/lib/database/types";
import type { Database } from "@/lib/database/types";
import type {
  WhatsappConnection,
  WhatsappMessage,
  WhatsappMessageFilter,
  WhatsappSummary,
} from "@/features/whatsapp/types/whatsapp-types";

function mapMessageRow(
  row: WhatsappMessageRow & { kunden?: { name: string | null } | null }
): WhatsappMessage {
  return {
    id: row.id,
    companyId: row.company_id,
    messageId: row.message_id,
    fromNumber: row.from_number,
    fromName: row.from_name,
    body: row.body,
    messageType: row.message_type,
    status: row.status,
    intentType: row.intent_type,
    intentLabel: row.intent_label,
    priority: row.priority,
    summary: row.summary,
    recommendedAction: row.recommended_action,
    customerId: row.customer_id,
    customerName: row.kunden?.name ?? null,
    receivedAt: row.received_at,
    classifiedAt: row.classified_at,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapConnectionRow(row: WhatsappConnectionRow): WhatsappConnection {
  return {
    id: row.id,
    companyId: row.company_id,
    phoneNumberId: row.phone_number_id,
    displayNumber: row.display_number,
    wabaId: row.waba_id,
    isActive: row.is_active,
    connectedAt: row.connected_at,
  };
}

export async function fetchWhatsappConnection(
  client: SupabaseClient<Database>,
  companyId: string
): Promise<WhatsappConnection | null> {
  const { data, error } = await client
    .from("whatsapp_connections")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) return null;
  return mapConnectionRow(data);
}

export async function fetchCompanyIdByPhoneNumberId(
  client: SupabaseClient<Database>,
  phoneNumberId: string
): Promise<string | null> {
  const { data, error } = await client
    .from("whatsapp_connections")
    .select("company_id")
    .eq("phone_number_id", phoneNumberId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data?.company_id) return null;
  return data.company_id;
}

export async function upsertWhatsappConnection(
  client: SupabaseClient<Database>,
  input: {
    companyId: string;
    phoneNumberId: string;
    displayNumber?: string | null;
    wabaId?: string | null;
  }
): Promise<WhatsappConnection | null> {
  const { data, error } = await client
    .from("whatsapp_connections")
    .upsert(
      {
        company_id: input.companyId,
        phone_number_id: input.phoneNumberId,
        display_number: input.displayNumber ?? null,
        waba_id: input.wabaId ?? null,
        is_active: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    )
    .select("*")
    .single();

  if (error || !data) return null;
  return mapConnectionRow(data);
}

export async function fetchWhatsappMessages(
  client: SupabaseClient<Database>,
  companyId: string,
  filter: WhatsappMessageFilter = "alle"
): Promise<WhatsappMessage[]> {
  let query = client
    .from("whatsapp_messages")
    .select("*, kunden(name)")
    .eq("company_id", companyId)
    .order("received_at", { ascending: false })
    .limit(200);

  if (filter !== "alle") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) =>
    mapMessageRow(
      row as WhatsappMessageRow & { kunden?: { name: string | null } | null }
    )
  );
}

export async function fetchWhatsappMessageById(
  client: SupabaseClient<Database>,
  companyId: string,
  id: string
): Promise<WhatsappMessage | null> {
  const { data, error } = await client
    .from("whatsapp_messages")
    .select("*, kunden(name)")
    .eq("company_id", companyId)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapMessageRow(
    data as WhatsappMessageRow & { kunden?: { name: string | null } | null }
  );
}

export async function updateWhatsappMessageStatus(
  client: SupabaseClient<Database>,
  companyId: string,
  id: string,
  status: WhatsappMessageStatusDb
): Promise<WhatsappMessage | null> {
  const { data, error } = await client
    .from("whatsapp_messages")
    .update({ status })
    .eq("company_id", companyId)
    .eq("id", id)
    .select("*, kunden(name)")
    .maybeSingle();

  if (error || !data) return null;
  return mapMessageRow(
    data as WhatsappMessageRow & { kunden?: { name: string | null } | null }
  );
}

export async function insertWhatsappMessageIfNew(
  client: SupabaseClient<Database>,
  input: {
    companyId: string;
    messageId: string;
    fromNumber: string;
    fromName?: string | null;
    body: string;
    messageType: string;
    receivedAt: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ inserted: boolean; row: WhatsappMessageRow | null }> {
  const { data, error } = await client
    .from("whatsapp_messages")
    .insert({
      company_id: input.companyId,
      message_id: input.messageId,
      from_number: input.fromNumber,
      from_name: input.fromName ?? null,
      body: input.body,
      message_type: input.messageType,
      received_at: input.receivedAt,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { inserted: false, row: null };
    }
    return { inserted: false, row: null };
  }

  return { inserted: Boolean(data), row: data };
}

export async function applyWhatsappClassification(
  client: SupabaseClient<Database>,
  companyId: string,
  messageDbId: string,
  input: {
    intentType: string;
    intentLabel: string;
    priority: string;
    summary: string;
    recommendedAction: string;
    customerId?: string | null;
  }
): Promise<void> {
  await client
    .from("whatsapp_messages")
    .update({
      intent_type: input.intentType,
      intent_label: input.intentLabel,
      priority: input.priority,
      summary: input.summary,
      recommended_action: input.recommendedAction,
      customer_id: input.customerId ?? null,
      classified_at: new Date().toISOString(),
    })
    .eq("company_id", companyId)
    .eq("id", messageDbId);
}

export async function buildWhatsappSummary(
  client: SupabaseClient<Database>,
  companyId: string
): Promise<WhatsappSummary> {
  const connection = await fetchWhatsappConnection(client, companyId);
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const { data, error } = await client
    .from("whatsapp_messages")
    .select("status, received_at")
    .eq("company_id", companyId);

  if (error || !data) {
    return {
      openCount: 0,
      neuCount: 0,
      inBearbeitungCount: 0,
      erledigtCount: 0,
      archiviertCount: 0,
      todayCount: 0,
      weekCount: 0,
      connected: Boolean(connection?.isActive),
      displayNumber: connection?.displayNumber ?? null,
    };
  }

  let neuCount = 0;
  let inBearbeitungCount = 0;
  let erledigtCount = 0;
  let archiviertCount = 0;
  let todayCount = 0;
  let weekCount = 0;

  for (const row of data) {
    if (row.status === "neu") neuCount += 1;
    if (row.status === "in_bearbeitung") inBearbeitungCount += 1;
    if (row.status === "erledigt") erledigtCount += 1;
    if (row.status === "archiviert") archiviertCount += 1;

    const receivedAt = new Date(row.received_at);
    if (receivedAt >= startOfDay) todayCount += 1;
    if (receivedAt >= startOfWeek) weekCount += 1;
  }

  const openCount = neuCount + inBearbeitungCount;

  return {
    openCount,
    neuCount,
    inBearbeitungCount,
    erledigtCount,
    archiviertCount,
    todayCount,
    weekCount,
    connected: Boolean(connection?.isActive),
    displayNumber: connection?.displayNumber ?? null,
  };
}
