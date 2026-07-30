import { parseCompanyKnowledgeData } from "@/features/company-knowledge/services/company-knowledge-repository";
import {
  isCampaignDue,
  isCampaignEnabled,
  isEligibleBestandskunde,
  toDateKey,
} from "@/features/nurturing/services/nurturing-rules";
import {
  appendTrackingPixel,
  parseNurturingSettings,
  plainTextToHtml,
  renderNurturingTemplate,
} from "@/features/nurturing/services/nurturing-templates";
import type {
  NurturingCampaignType,
  NurturingMailRecord,
  NurturingSettings,
} from "@/features/nurturing/types/nurturing-types";
import { listDealsForCompany } from "@/lib/deals/deal-repository";
import { listKundenForCompany } from "@/lib/kunden/kunden-repository";
import {
  insertNurturingMail,
  listSentNurturingMailsForKunde,
  updateNurturingMailContent,
} from "@/lib/nurturing/nurturing-repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const ALL_CAMPAIGNS: NurturingCampaignType[] = [
  "marktupdate",
  "jahrestag",
  "weiterempfehlung",
];

async function loadNurturingSettings(
  companyId: string
): Promise<{ settings: NurturingSettings; firma: string; signatur: string }> {
  const defaults = {
    settings: parseNurturingSettings(undefined),
    firma: "Ihr Immobilienmakler",
    signatur: "",
  };

  if (!isSupabaseConfigured()) return defaults;

  const supabase = await createClient();
  if (!supabase) return defaults;

  const { data } = await supabase
    .from("company_knowledge")
    .select("data")
    .eq("company_id", companyId)
    .maybeSingle();

  const knowledge = parseCompanyKnowledgeData(
    (data as { data?: unknown } | null)?.data,
    companyId
  );

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();

  return {
    settings: knowledge.nurturing ?? parseNurturingSettings(undefined),
    firma:
      (company as { name?: string } | null)?.name?.trim() || defaults.firma,
    signatur: knowledge.emailSignatureOverride?.trim() || "",
  };
}

function lastSentAtForCampaign(
  sent: NurturingMailRecord[],
  type: NurturingCampaignType
): string | null {
  const match = sent.find((mail) => mail.campaign_type === type);
  return match?.sent_at ?? null;
}

export async function prepareNurturingMailsForCompany(input: {
  companyId: string;
  origin?: string;
  force?: boolean;
  now?: Date;
}): Promise<{ created: NurturingMailRecord[]; skippedReason?: string }> {
  const now = input.now ?? new Date();
  const scheduledFor = toDateKey(now);

  const { settings, firma, signatur } = await loadNurturingSettings(
    input.companyId
  );

  const kunden = await listKundenForCompany(input.companyId);
  const deals = await listDealsForCompany(input.companyId);
  const dealsByKunde = new Map<string, (typeof deals)[number]>();
  for (const deal of deals) {
    if (!deal.kunde_id || deal.phase < 9) continue;
    const existing = dealsByKunde.get(deal.kunde_id);
    if (!existing || deal.phase_updated_at > existing.phase_updated_at) {
      dealsByKunde.set(deal.kunde_id, deal);
    }
  }

  const created: NurturingMailRecord[] = [];

  for (const kunde of kunden) {
    const deal = dealsByKunde.get(kunde.id);
    const letzterAbschluss =
      kunde.letzter_deal_abschluss ?? deal?.phase_updated_at ?? null;

    if (
      !isEligibleBestandskunde({
        status: kunde.status,
        nurturingAktiv: kunde.nurturing_aktiv,
        letzterDealAbschluss: letzterAbschluss,
        now,
      })
    ) {
      continue;
    }

    if (!kunde.email?.trim()) continue;

    const sent = await listSentNurturingMailsForKunde(
      input.companyId,
      kunde.id
    );

    const name =
      kunde.ansprechpartner?.trim() || kunde.firmenname.trim() || "Kunde";
    const objektLabel =
      kunde.letzter_deal_objekt_id ?? deal?.objekt_id ?? "Ihrer Immobilie";

    for (const campaignType of ALL_CAMPAIGNS) {
      if (!isCampaignEnabled(settings, campaignType)) continue;

      const due = isCampaignDue({
        campaignType,
        letzterDealAbschluss: letzterAbschluss!,
        lastSentAt: lastSentAtForCampaign(sent, campaignType),
        now,
      });
      if (!due) continue;

      const template = settings.templates[campaignType];
      const rendered = renderNurturingTemplate(template, {
        name,
        objekt: objektLabel,
        firma,
        signatur,
      });

      let bodyHtml = plainTextToHtml(rendered.body);

      const mail = await insertNurturingMail({
        company_id: input.companyId,
        kunde_id: kunde.id,
        deal_id: deal?.id ?? null,
        campaign_type: campaignType,
        subject: rendered.subject,
        body_text: rendered.body,
        body_html: bodyHtml,
        to_email: kunde.email.trim(),
        kunde_name: name,
        objekt_label: objektLabel,
        scheduled_for: scheduledFor,
      });

      if (!mail) continue;

      if (input.origin) {
        bodyHtml = appendTrackingPixel(
          plainTextToHtml(rendered.body),
          `${input.origin}/api/nurturing/track/${mail.tracking_token}`
        );
        const withPixel = await updateNurturingMailContent({
          companyId: input.companyId,
          mailId: mail.id,
          subject: mail.subject,
          body_text: mail.body_text,
          body_html: bodyHtml,
        });
        created.push(withPixel ?? { ...mail, body_html: bodyHtml });
      } else {
        created.push(mail);
      }
    }
  }

  return { created };
}
