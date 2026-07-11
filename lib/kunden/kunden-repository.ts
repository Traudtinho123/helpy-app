import { normalizeEmail, normalizePhone } from "@/features/crm/services/crm-merge";
import {
  createKundeInputToDbPayload,
} from "@/features/customers/services/kunden-mapper";
import type {
  CreateKundeInput,
  KundeDuplicateMatch,
  KundeRecord,
} from "@/features/customers/types/kunden-db-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devKunden = new Map<string, KundeRecord>();

function generateDevId(): string {
  return `dev-kunde-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowToRecord(row: Record<string, unknown>): KundeRecord {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    company_id: String(row.company_id),
    firmenname: String(row.firmenname),
    ansprechpartner:
      typeof row.ansprechpartner === "string" ? row.ansprechpartner : null,
    email: typeof row.email === "string" ? row.email : null,
    telefon: typeof row.telefon === "string" ? row.telefon : null,
    adresse: typeof row.adresse === "string" ? row.adresse : null,
    notizen: typeof row.notizen === "string" ? row.notizen : null,
    status:
      row.status === "aktiv" || row.status === "bestandskunde"
        ? row.status
        : "interessent",
    erstellt_am: String(row.erstellt_am ?? new Date().toISOString()),
  };
}

export async function listKundenForCompany(companyId: string): Promise<KundeRecord[]> {
  if (!isSupabaseConfigured()) {
    return [...devKunden.values()]
      .filter((item) => item.company_id === companyId)
      .sort((a, b) => b.erstellt_am.localeCompare(a.erstellt_am));
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("kunden")
    .select("*")
    .eq("company_id", companyId)
    .order("erstellt_am", { ascending: false });

  if (error) {
    console.error("[kunden] list failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function findKundeByPhone(
  companyId: string,
  phone: string
): Promise<KundeRecord | null> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 6) return null;

  const all = await listKundenForCompany(companyId);
  return (
    all.find((item) => normalizePhone(item.telefon ?? "") === normalized) ?? null
  );
}

export async function findKundeDuplicates(
  companyId: string,
  input: Pick<CreateKundeInput, "email" | "telefon">
): Promise<KundeDuplicateMatch | null> {
  const email = normalizeEmail(input.email ?? undefined);
  const phone = normalizePhone(input.telefon ?? undefined);

  const all = await listKundenForCompany(companyId);

  if (email) {
    const match = all.find((item) => normalizeEmail(item.email ?? "") === email);
    if (match) {
      return {
        id: match.id,
        firmenname: match.firmenname,
        ansprechpartner: match.ansprechpartner,
        email: match.email,
        telefon: match.telefon,
        matchedBy: "email",
      };
    }
  }

  if (phone.length >= 6) {
    const match = all.find(
      (item) => normalizePhone(item.telefon ?? "") === phone
    );
    if (match) {
      return {
        id: match.id,
        firmenname: match.firmenname,
        ansprechpartner: match.ansprechpartner,
        email: match.email,
        telefon: match.telefon,
        matchedBy: "telefon",
      };
    }
  }

  return null;
}

export async function createKundeRecord(
  context: { userId: string; companyId: string },
  input: CreateKundeInput
): Promise<{ ok: true; record: KundeRecord } | { ok: false; error: string; duplicate?: KundeDuplicateMatch }> {
  const duplicate = await findKundeDuplicates(context.companyId, input);
  if (duplicate) {
    const label =
      duplicate.matchedBy === "email"
        ? "E-Mail"
        : "Telefonnummer";
    return {
      ok: false,
      error: `${label} ist bereits einem Kunden zugeordnet (${duplicate.ansprechpartner ?? duplicate.firmenname}).`,
      duplicate,
    };
  }

  const payload = createKundeInputToDbPayload(input, context);

  if (!isSupabaseConfigured()) {
    const record: KundeRecord = {
      id: generateDevId(),
      ...payload,
      erstellt_am: new Date().toISOString(),
    };
    devKunden.set(record.id, record);
    return { ok: true, record };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Supabase nicht konfiguriert." };
  }

  const { data, error } = await supabase
    .from("kunden")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[kunden] insert failed:", error?.message);
    return {
      ok: false,
      error: error?.message ?? "Kunde konnte nicht gespeichert werden.",
    };
  }

  return { ok: true, record: rowToRecord(data as Record<string, unknown>) };
}
