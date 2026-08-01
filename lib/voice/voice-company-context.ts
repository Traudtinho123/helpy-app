import {
  fetchCompanyKnowledgeRow,
  rowToCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-repository";
import { WEEKDAY_LABELS } from "@/features/company-knowledge/types/company-knowledge-types";
import { createAdminClient } from "@/lib/supabase/admin";

export type VoiceCompanyContext = {
  companyName: string;
  systemContext: string;
  greetingCompanyLine: string;
};

function formatKnowledgeBusinessHours(
  businessHours: ReturnType<typeof rowToCompanyKnowledge>["businessHours"]
): string {
  return Object.entries(businessHours)
    .map(([day, hours]) => {
      const label = WEEKDAY_LABELS[day as keyof typeof WEEKDAY_LABELS] ?? day;
      if (hours.closed) return `${label}: geschlossen`;
      return `${label}: ${hours.start}–${hours.end}`;
    })
    .join("; ");
}

export async function loadVoiceCompanyContext(
  companyId: string
): Promise<VoiceCompanyContext> {
  const admin = createAdminClient();
  let companyName = "Ihrem Unternehmen";
  let contactLines: string[] = [];

  if (admin) {
    const { data: companyRow } = await admin
      .from("companies")
      .select("name, phone, email, website, address, city, zip")
      .eq("id", companyId)
      .maybeSingle();

    if (companyRow?.name?.trim()) {
      companyName = companyRow.name.trim();
    }

    contactLines = [
      companyRow?.phone,
      companyRow?.email,
      companyRow?.website,
      [companyRow?.address, companyRow?.zip, companyRow?.city]
        .filter(Boolean)
        .join(", "),
    ].filter((line): line is string => Boolean(line));

    try {
      const knowledgeRow = await fetchCompanyKnowledgeRow(admin, companyId);
      if (knowledgeRow) {
        const knowledge = rowToCompanyKnowledge(knowledgeRow);
        const services =
          knowledge.services.length > 0
            ? knowledge.services
                .slice(0, 6)
                .map((service) => `${service.name}: ${service.description}`)
                .join("; ")
            : "Keine Dienstleistungen hinterlegt.";

        const faq =
          knowledge.faq.length > 0
            ? knowledge.faq
                .slice(0, 4)
                .map((entry) => `F: ${entry.question} A: ${entry.answer}`)
                .join(" | ")
            : "";

        const systemContext = [
          `Firmenname: ${companyName}`,
          contactLines.length > 0
            ? `Kontakt: ${contactLines.join(" · ")}`
            : null,
          knowledge.companyDescription
            ? `Beschreibung: ${knowledge.companyDescription}`
            : null,
          `Dienstleistungen: ${services}`,
          knowledge.locations.length > 0
            ? `Standorte: ${knowledge.locations.join(", ")}`
            : null,
          `Öffnungszeiten: ${formatKnowledgeBusinessHours(knowledge.businessHours)}`,
          faq ? `FAQ: ${faq}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        return {
          companyName,
          systemContext,
          greetingCompanyLine: companyName,
        };
      }
    } catch (error) {
      console.error(
        "[voice] company knowledge load failed:",
        error instanceof Error ? error.message : "unknown"
      );
    }
  }

  return {
    companyName,
    systemContext: [
      `Firmenname: ${companyName}`,
      contactLines.length > 0 ? `Kontakt: ${contactLines.join(" · ")}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    greetingCompanyLine: companyName,
  };
}
