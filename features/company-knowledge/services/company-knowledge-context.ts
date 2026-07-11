import type { CompanyProfile } from "@/lib/company/company-profile-types";
import { DOCUMENT_LANGUAGE_LABELS } from "@/lib/company/company-profile-types";
import { getCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-service";
import {
  REPLY_STYLE_LABELS,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type ResolvedCompanyKnowledge,
} from "@/features/company-knowledge/types/company-knowledge-types";
import {
  getCompanyProfileSnapshot,
  getLoadedCompanyId,
} from "@/lib/company/company-profile-service";

export function resolveCompanyKnowledge(
  profile: CompanyProfile
): ResolvedCompanyKnowledge {
  const knowledge = getCompanyKnowledge(profile.companyId);

  return {
    ...knowledge,
    companyName: profile.companyName,
    industry: profile.industry,
    phone: profile.phone,
    generalEmail: profile.email,
    website: profile.website,
    preferredLanguage:
      DOCUMENT_LANGUAGE_LABELS[profile.documentLanguage] ??
      profile.documentLanguage,
    address: profile.address,
    emailSignature:
      knowledge.emailSignatureOverride.trim() || profile.companySignature,
  };
}

export function summarizeBusinessHours(
  resolved: ResolvedCompanyKnowledge
): string {
  return WEEKDAY_ORDER.map((day) => {
    const hours = resolved.businessHours[day];
    if (hours.closed) return `${WEEKDAY_LABELS[day]} geschlossen`;
    return `${WEEKDAY_LABELS[day]} ${hours.start}–${hours.end}`;
  }).join("; ");
}

export function resolveReplyStyleLabel(
  resolved: ResolvedCompanyKnowledge
): string {
  return resolved.replyStyle === "custom"
    ? resolved.replyStyleCustom.trim() || REPLY_STYLE_LABELS.custom
    : REPLY_STYLE_LABELS[resolved.replyStyle];
}

function resolveActiveCompanyProfile(): CompanyProfile {
  const loadedCompanyId = getLoadedCompanyId();
  const snapshot = getCompanyProfileSnapshot();
  return loadedCompanyId && loadedCompanyId !== snapshot.companyId
    ? { ...snapshot, companyId: loadedCompanyId }
    : snapshot;
}

export function buildCompanyKnowledgeDecisionSupplement(input: {
  intent?: string;
  intentLabel?: string;
}): string | null {
  const haystack = [input.intent, input.intentLabel]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isAppointmentIntent =
    haystack.includes("besichtigung") ||
    haystack.includes("termin") ||
    haystack.includes("immobilien");

  if (!isAppointmentIntent) return null;

  const resolved = resolveCompanyKnowledge(resolveActiveCompanyProfile());
  const parts: string[] = [];

  if (resolved.appointmentDurationViewingMinutes > 0) {
    parts.push(
      `Besichtigungen sind auf ${resolved.appointmentDurationViewingMinutes} Minuten ausgelegt.`
    );
  }

  const firstRule = resolved.internalRules.find((rule) => rule.trim());
  if (firstRule) {
    parts.push(firstRule.trim());
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

export function buildCompanyKnowledgeContextLines(
  profile: CompanyProfile
): string[] {
  const resolved = resolveCompanyKnowledge(profile);
  const lines: string[] = [
    `Unternehmen: ${resolved.companyName}`,
    `Branche: ${resolved.industry}`,
  ];

  if (resolved.companyDescription.trim()) {
    lines.push(`Beschreibung: ${resolved.companyDescription.trim()}`);
  }

  if (resolved.locations.length > 0) {
    lines.push(`Standorte: ${resolved.locations.join(", ")}`);
  } else if (resolved.address.trim()) {
    lines.push(`Adresse: ${resolved.address.trim()}`);
  }

  if (resolved.services.length > 0) {
    lines.push(
      `Dienstleistungen: ${resolved.services
        .map((service) => service.name)
        .join(", ")}`
    );
  }

  lines.push(`Arbeitszeiten: ${summarizeBusinessHours(resolved)}`);
  lines.push(`Telefon: ${resolved.phone}`);
  lines.push(`E-Mail: ${resolved.generalEmail}`);
  lines.push(`Website: ${resolved.website}`);
  lines.push(`Sprache: ${resolved.preferredLanguage}`);
  lines.push(`Antwortstil: ${resolveReplyStyleLabel(resolved)}`);
  lines.push(
    `Termine: Besichtigung ${resolved.appointmentDurationViewingMinutes} Min, Beratung ${resolved.appointmentDurationConsultationMinutes} Min, Vor-Ort ${resolved.appointmentDurationOnSiteMinutes} Min, Puffer ${resolved.defaultBufferMinutes} Min`
  );

  if (resolved.internalRules.length > 0) {
    lines.push(`Regeln: ${resolved.internalRules.join(" | ")}`);
  }

  if (resolved.faq.length > 0) {
    lines.push(
      `FAQ: ${resolved.faq
        .slice(0, 3)
        .map((entry) => `${entry.question} → ${entry.answer}`)
        .join(" | ")}`
    );
  }

  return lines;
}

export function buildCompanyKnowledgePromptBlock(
  profile: CompanyProfile
): string {
  return buildCompanyKnowledgeContextLines(profile).join("\n");
}
