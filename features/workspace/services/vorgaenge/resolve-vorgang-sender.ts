import { extractSenderName } from "@/features/brain/services/brain-result-to-vorgang";
import { readPlatformContextValue } from "@/features/brain/services/platform-inquiry-context";
import { extractPlatformInquiry } from "@/features/brain/services/platform-inquiry-extractor";
import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import {
  buildFromHeader,
  parseFrom,
  resolveSenderDisplayName,
  isPlaceholderSenderLabel,
} from "@/features/gmail/services/parse-from-header";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export function isUnknownSenderLabel(value: string | null | undefined): boolean {
  return isPlaceholderSenderLabel(value);
}

function extractPersonalEmailFromText(text: string): string | null {
  const matches = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? [];
  for (const raw of matches) {
    if (/immoscout|homegate|noreply|no-reply|donotreply|helpy|mailer-daemon/i.test(raw)) {
      continue;
    }
    const email = extractEmailAddress(raw);
    if (email) return email;
  }
  return null;
}

function formatSenderFrom(name: string, email: string | null, fallback = ""): string {
  if (email) {
    const displayName = resolveSenderDisplayName(name, email);
    if (displayName.includes("@")) return displayName;
    return buildFromHeader(displayName, email);
  }
  const displayName = resolveSenderDisplayName(name, "");
  return displayName || fallback.trim();
}

export function resolveVorgangSenderFromText(input: {
  fromHeader?: string;
  bodyText?: string;
  subject?: string;
  fallbackName?: string;
}): { name: string; email: string | null; from: string } {
  const fromHeader = input.fromHeader?.trim() ?? "";
  const bodyText = input.bodyText?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const inquiry = extractPlatformInquiry(fromHeader, subject, bodyText);

  const headerParsed = parseFrom(fromHeader);
  const email =
    (inquiry.interessentEmail !== PLATFORM_INQUIRY_MISSING
      ? inquiry.interessentEmail
      : null) ??
    headerParsed.email ??
    extractEmailAddress(fromHeader) ??
    extractPersonalEmailFromText(`${bodyText}\n${fromHeader}`);

  const headerName = headerParsed.email
    ? headerParsed.name
    : extractSenderName(fromHeader);
  const name =
    ((inquiry.interessentName !== PLATFORM_INQUIRY_MISSING
      ? inquiry.interessentName
      : null) ??
    (!isUnknownSenderLabel(input.fallbackName) ? input.fallbackName?.trim() : null) ??
    (!isUnknownSenderLabel(headerName) ? headerName : null) ??
    resolveSenderDisplayName(headerName, email ?? "")) ||
    (email ?? "");

  return {
    name,
    email,
    from: formatSenderFrom(name, email, fromHeader || name),
  };
}

export function resolveVorgangSender(
  vorgang: Pick<
    Vorgang,
    | "kunde"
    | "from"
    | "detectedContext"
    | "summary"
    | "snippet"
    | "latestMessageFrom"
    | "titel"
  >
): { name: string; email: string | null; from: string } {
  const ctxEmail = readPlatformContextValue(vorgang.detectedContext, "E-Mail");
  const ctxName = readPlatformContextValue(vorgang.detectedContext, "Interessent");

  if (ctxEmail) {
    const name =
      ctxName ??
      (!isUnknownSenderLabel(vorgang.kunde) ? vorgang.kunde : null) ??
      ctxEmail.split("@")[0] ??
      "Interessent";
    return {
      name,
      email: ctxEmail,
      from: buildFromHeader(name, ctxEmail),
    };
  }

  for (const candidate of [vorgang.from, vorgang.latestMessageFrom]) {
    if (!candidate?.trim()) continue;
    const email = extractEmailAddress(candidate);
    if (!email || /noreply|no-reply|donotreply/i.test(email)) continue;

    const headerName = extractSenderName(candidate);
    const name =
      (!isUnknownSenderLabel(headerName) ? headerName : null) ??
      (!isUnknownSenderLabel(vorgang.kunde) ? vorgang.kunde : null) ??
      email.split("@")[0] ??
      "Kontakt";

    return {
      name,
      email,
      from: formatSenderFrom(name, email, candidate),
    };
  }

  return resolveVorgangSenderFromText({
    fromHeader: vorgang.from ?? vorgang.latestMessageFrom ?? vorgang.kunde,
    bodyText: [vorgang.summary, vorgang.snippet, vorgang.titel].filter(Boolean).join("\n"),
    subject: vorgang.titel,
    fallbackName: vorgang.kunde,
  });
}

export function pickBestVorgangSender(
  items: Array<
    Pick<
      Vorgang,
      | "kunde"
      | "from"
      | "detectedContext"
      | "summary"
      | "snippet"
      | "latestMessageFrom"
      | "titel"
    >
  >
): { name: string; email: string | null; from: string } {
  let best = resolveVorgangSender(items[0] ?? { kunde: "Unbekannt", titel: "" });

  for (const item of items.slice(1)) {
    const candidate = resolveVorgangSender(item);

    if (candidate.email && !best.email) {
      best = candidate;
      continue;
    }

    if (
      candidate.email &&
      !isUnknownSenderLabel(candidate.name) &&
      isUnknownSenderLabel(best.name)
    ) {
      best = candidate;
    }
  }

  return best;
}

export function enrichVorgangSender<T extends Vorgang>(vorgang: T): T {
  const sender = resolveVorgangSender(vorgang);
  return {
    ...vorgang,
    kunde: isUnknownSenderLabel(vorgang.kunde) ? sender.name : vorgang.kunde,
    from: vorgang.from?.trim() ? vorgang.from : sender.from,
  };
}
