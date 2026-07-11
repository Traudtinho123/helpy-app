import { fetchCompanyKnowledgeRow } from "@/features/company-knowledge/services/company-knowledge-repository";
import { loadVoiceCompanyContext } from "@/lib/voice/voice-company-context";
import { listActiveVoiceStandardResponsesForPrompt } from "@/lib/voice/voice-standard-responses-repository";
import { createAdminClient } from "@/lib/supabase/admin";

export type VoicePortfolioObject = {
  objectId: string;
  titel: string;
  adresse: string;
  ort: string;
  zimmer: string | null;
  preis: string | null;
  status: string;
};

export type VoiceCallPromptContext = {
  companyId: string;
  companyName: string;
  systemContext: string;
  greetingCompanyLine: string;
  standardResponses: Array<{ triggerText: string; responseText: string }>;
  portfolioObjects: VoicePortfolioObject[];
};

const promptContextByCall = new Map<string, VoiceCallPromptContext>();

function parsePortfolioObjects(raw: unknown): VoicePortfolioObject[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const titel = typeof record.titel === "string" ? record.titel.trim() : "";
      if (!titel) return null;

      return {
        objectId: typeof record.objectId === "string" ? record.objectId : titel,
        titel,
        adresse: typeof record.adresse === "string" ? record.adresse : "",
        ort: typeof record.ort === "string" ? record.ort : "",
        zimmer: typeof record.zimmer === "string" ? record.zimmer : null,
        preis: typeof record.preis === "string" ? record.preis : null,
        status: typeof record.status === "string" ? record.status : "aktiv",
      } satisfies VoicePortfolioObject;
    })
    .filter((item): item is VoicePortfolioObject => item !== null)
    .filter((item) => item.status === "aktiv")
    .slice(0, 5);
}

export async function loadVoicePortfolioObjects(
  companyId: string
): Promise<VoicePortfolioObject[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  try {
    const row = await fetchCompanyKnowledgeRow(admin, companyId);
    if (!row?.data || typeof row.data !== "object" || Array.isArray(row.data)) {
      return [];
    }

    return parsePortfolioObjects(
      (row.data as Record<string, unknown>).portfolioObjects
    );
  } catch (error) {
    console.error(
      "[voice] portfolio load failed:",
      error instanceof Error ? error.message : "unknown"
    );
    return [];
  }
}

export async function loadVoiceCallPromptContext(
  companyId: string
): Promise<VoiceCallPromptContext> {
  const [company, standardResponses, portfolioObjects] = await Promise.all([
    loadVoiceCompanyContext(companyId),
    listActiveVoiceStandardResponsesForPrompt(companyId),
    loadVoicePortfolioObjects(companyId),
  ]);

  return {
    companyId,
    companyName: company.companyName,
    systemContext: company.systemContext,
    greetingCompanyLine: company.greetingCompanyLine,
    standardResponses,
    portfolioObjects,
  };
}

export function cacheVoiceCallPromptContext(
  callSid: string,
  context: VoiceCallPromptContext
): void {
  promptContextByCall.set(callSid, context);
}

export function getCachedVoiceCallPromptContext(
  callSid: string
): VoiceCallPromptContext | null {
  return promptContextByCall.get(callSid) ?? null;
}

export async function resolveVoiceCallPromptContext(
  callSid: string,
  companyId: string
): Promise<VoiceCallPromptContext> {
  const cached = getCachedVoiceCallPromptContext(callSid);
  if (cached && cached.companyId === companyId) {
    return cached;
  }

  const context = await loadVoiceCallPromptContext(companyId);
  cacheVoiceCallPromptContext(callSid, context);
  return context;
}

export function clearVoiceCallPromptContext(callSid: string): void {
  promptContextByCall.delete(callSid);
}

export async function upsertVoicePortfolioSnapshot(
  companyId: string,
  objects: VoicePortfolioObject[]
): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  try {
    const row = await fetchCompanyKnowledgeRow(admin, companyId);
    const existingData =
      row?.data && typeof row.data === "object" && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {};

    const nextData = {
      ...existingData,
      portfolioObjects: objects.slice(0, 20),
      portfolioUpdatedAt: new Date().toISOString(),
    };

    const { error } = await admin.from("company_knowledge").upsert(
      {
        company_id: companyId,
        data: nextData as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    );

    if (error) {
      console.error("[voice] portfolio snapshot save failed:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[voice] portfolio snapshot failed:",
      error instanceof Error ? error.message : "unknown"
    );
    return false;
  }
}
