import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyKnowledgeRow, Json } from "@/lib/database/types";
import {
  cloneCompanyKnowledge,
  createEmptyCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-defaults";
import type {
  BusinessDayHours,
  CompanyKnowledge,
  WeekdayId,
} from "@/features/company-knowledge/types/company-knowledge-types";
import { WEEKDAY_ORDER } from "@/features/company-knowledge/types/company-knowledge-types";

export type { CompanyKnowledgeRow } from "@/lib/database/types";

function mergeBusinessHours(
  base: Record<WeekdayId, BusinessDayHours>,
  patch: unknown
): Record<WeekdayId, BusinessDayHours> {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return base;
  }

  const next = { ...base };
  for (const day of WEEKDAY_ORDER) {
    const hours = (patch as Record<string, unknown>)[day];
    if (!hours || typeof hours !== "object" || Array.isArray(hours)) continue;
    const record = hours as Partial<BusinessDayHours>;
    next[day] = {
      closed: typeof record.closed === "boolean" ? record.closed : base[day].closed,
      start:
        typeof record.start === "string" && record.start.trim()
          ? record.start.trim()
          : base[day].start,
      end:
        typeof record.end === "string" && record.end.trim()
          ? record.end.trim()
          : base[day].end,
    };
  }
  return next;
}

export function parseCompanyKnowledgeData(
  raw: unknown,
  companyId: string
): CompanyKnowledge {
  const base = createEmptyCompanyKnowledge(companyId);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }

  const parsed = raw as Partial<CompanyKnowledge>;

  return cloneCompanyKnowledge({
    ...base,
    ...parsed,
    companyId,
    companyDescription:
      typeof parsed.companyDescription === "string"
        ? parsed.companyDescription
        : base.companyDescription,
    services: Array.isArray(parsed.services) ? parsed.services : base.services,
    locations: Array.isArray(parsed.locations) ? parsed.locations : base.locations,
    businessHours: mergeBusinessHours(base.businessHours, parsed.businessHours),
    replyStyle:
      parsed.replyStyle === "friendly-professional" ||
      parsed.replyStyle === "short-direct" ||
      parsed.replyStyle === "detailed-advisory" ||
      parsed.replyStyle === "custom"
        ? parsed.replyStyle
        : base.replyStyle,
    replyStyleCustom:
      typeof parsed.replyStyleCustom === "string"
        ? parsed.replyStyleCustom
        : base.replyStyleCustom,
    emailSignatureOverride:
      typeof parsed.emailSignatureOverride === "string"
        ? parsed.emailSignatureOverride
        : base.emailSignatureOverride,
    appointmentDurationViewingMinutes:
      typeof parsed.appointmentDurationViewingMinutes === "number"
        ? parsed.appointmentDurationViewingMinutes
        : base.appointmentDurationViewingMinutes,
    appointmentDurationConsultationMinutes:
      typeof parsed.appointmentDurationConsultationMinutes === "number"
        ? parsed.appointmentDurationConsultationMinutes
        : base.appointmentDurationConsultationMinutes,
    appointmentDurationOnSiteMinutes:
      typeof parsed.appointmentDurationOnSiteMinutes === "number"
        ? parsed.appointmentDurationOnSiteMinutes
        : base.appointmentDurationOnSiteMinutes,
    defaultBufferMinutes:
      typeof parsed.defaultBufferMinutes === "number"
        ? parsed.defaultBufferMinutes
        : base.defaultBufferMinutes,
    internalRules: Array.isArray(parsed.internalRules)
      ? parsed.internalRules.filter((rule): rule is string => typeof rule === "string")
      : base.internalRules,
    faq: Array.isArray(parsed.faq) ? parsed.faq : base.faq,
    updatedAt:
      typeof parsed.updatedAt === "string" ? parsed.updatedAt : base.updatedAt,
    updatedBy:
      typeof parsed.updatedBy === "string" ? parsed.updatedBy : base.updatedBy,
  });
}

export async function fetchCompanyKnowledgeRow(
  supabase: SupabaseClient,
  companyId: string
): Promise<CompanyKnowledgeRow | null> {
  const { data, error } = await supabase
    .from("company_knowledge")
    .select("company_id, data, updated_at, updated_by")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CompanyKnowledgeRow | null) ?? null;
}

export async function upsertCompanyKnowledgeRow(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  knowledge: CompanyKnowledge
): Promise<CompanyKnowledgeRow> {
  const payload = {
    company_id: companyId,
    data: cloneCompanyKnowledge({ ...knowledge, companyId }) as unknown as Json,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from("company_knowledge")
    .upsert(payload, { onConflict: "company_id" })
    .select("company_id, data, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CompanyKnowledgeRow;
}

export function rowToCompanyKnowledge(row: CompanyKnowledgeRow): CompanyKnowledge {
  const knowledge = parseCompanyKnowledgeData(row.data, row.company_id);
  return cloneCompanyKnowledge({
    ...knowledge,
    companyId: row.company_id,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? knowledge.updatedBy,
  });
}
