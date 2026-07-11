import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { extractSenderName } from "@/features/brain/services/brain-result-to-vorgang";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export type KundenakteExtractInput = {
  vorgangId: string;
  from: string;
  subject: string;
  snippet: string;
  summary?: string;
  skill: HelpySkill;
  receivedAt: string;
  receivedLabel: string;
  existingFirma?: string;
  existingTelefon?: string;
  existingAdresse?: string;
};

const EMPTY = "—";

function extractPhone(text: string): string {
  const patterns = [
    /(?:\+49|0049|0)\s?[\d\s()/\-]{8,}/,
    /(?:\+41|0041)\s?[\d\s()/\-]{8,}/,
    /(?:tel\.?|telefon|phone|mobil)[:\s]+([+\d\s()/\-]{8,})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = (match[1] ?? match[0]).trim();
      if (value.replace(/\D/g, "").length >= 6) {
        return value;
      }
    }
  }

  return EMPTY;
}

function extractAddress(text: string): string {
  const plzMatch = text.match(
    /([A-ZÄÖÜa-zäöüß.\- ]{3,40},?\s+\d{4,5}\s+[A-ZÄÖÜa-zäöüß.\- ]{2,40})/
  );
  if (plzMatch?.[1]) {
    return plzMatch[1].trim();
  }

  const labelMatch = text.match(
    /(?:adresse|anschrift)[:\s]+(.{8,80})/i
  );
  if (labelMatch?.[1]) {
    return labelMatch[1].trim();
  }

  return EMPTY;
}

function extractCompany(from: string, snippet: string, name: string): string {
  const fromCompany = from.split("·").pop()?.trim();
  if (fromCompany && fromCompany !== name && fromCompany.length > 2) {
    return fromCompany;
  }

  const snippetMatch = snippet.match(/(?:firma|unternehmen|company)[:\s]+(.{2,60})/i);
  if (snippetMatch?.[1]) {
    return snippetMatch[1].trim();
  }

  return name;
}

export function extractKundenakteFields(
  input: KundenakteExtractInput
): Omit<
  KundenakteExtractInput,
  "vorgangId" | "receivedAt" | "receivedLabel"
> & {
  name: string;
  firma: string;
  email: string;
  telefon: string;
  adresse: string;
  skillLabel: string;
  betreff: string;
  zusammenfassung: string;
} {
  const combined = [input.from, input.subject, input.snippet, input.summary]
    .filter(Boolean)
    .join("\n");

  const email = extractEmailAddress(input.from) ?? EMPTY;
  const name = extractSenderName(input.from);
  const firma =
    input.existingFirma && input.existingFirma !== EMPTY
      ? input.existingFirma
      : extractCompany(input.from, input.snippet, name);
  const telefon =
    input.existingTelefon && input.existingTelefon !== EMPTY
      ? input.existingTelefon
      : extractPhone(combined);
  const adresse =
    input.existingAdresse && input.existingAdresse !== EMPTY
      ? input.existingAdresse
      : extractAddress(combined);

  return {
    from: input.from,
    subject: input.subject,
    snippet: input.snippet,
    summary: input.summary,
    skill: input.skill,
    name,
    firma,
    email,
    telefon,
    adresse,
    skillLabel: getSkillConfig(input.skill).label,
    betreff: input.subject,
    zusammenfassung: input.summary ?? input.snippet ?? EMPTY,
  };
}

export function buildExtractInputFromBundle(
  bundle: GmailVorgangBundle
): KundenakteExtractInput {
  return {
    vorgangId: bundle.liste.id,
    from: bundle.message.from || bundle.brain.from,
    subject: bundle.message.subject || bundle.liste.titel,
    snippet: bundle.message.snippet || bundle.liste.snippet || "",
    summary: bundle.brain.summary,
    skill: bundle.workspace.skill,
    receivedAt: bundle.liste.receivedAt,
    receivedLabel: bundle.liste.receivedLabel,
    existingFirma: bundle.workspace.kunde.firmenname,
    existingTelefon: bundle.workspace.kunde.telefon,
    existingAdresse: bundle.workspace.kunde.adresse,
  };
}

export function buildExtractInputFromWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): KundenakteExtractInput {
  return {
    vorgangId: vorgang.id,
    from: liste?.from ?? vorgang.letzteEmail.absender,
    subject: liste?.titel ?? vorgang.letzteEmail.betreff,
    snippet: liste?.snippet ?? vorgang.letzteEmail.inhalt,
    summary: vorgang.letzteEmail.zusammenfassung,
    skill: vorgang.skill,
    receivedAt: liste?.receivedAt ?? new Date().toISOString(),
    receivedLabel: liste?.receivedLabel ?? vorgang.letzteEmail.datum,
    existingFirma: vorgang.kunde.firmenname,
    existingTelefon: vorgang.kunde.telefon,
    existingAdresse: vorgang.kunde.adresse,
  };
}
