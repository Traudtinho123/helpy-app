import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  buildCustomerIdFromEmail,
  updateCustomerMemory,
} from "@/features/intelligence/memory-engine/memory-engine";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import type { VorgangAngebot } from "@/features/workspace/services/workspace/types";

function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim();
  if (from.includes("@")) return from.trim();
  return "";
}

function collectBundleText(bundle: GmailVorgangBundle): string {
  const parts = [
    bundle.brain.summary,
    bundle.brain.intent,
    bundle.message.snippet,
    bundle.liste.summary,
    ...(bundle.liste.detectedContext ?? []),
    bundle.workspace.letzteEmail.zusammenfassung,
    bundle.workspace.letzteEmail.betreff,
  ];

  return parts.filter(Boolean).join("\n");
}

export function updateCustomerMemoryFromGmailBundle(
  bundle: GmailVorgangBundle
): void {
  const email =
    extractSenderEmail(bundle.brain.from) ||
    extractSenderEmail(bundle.message.from) ||
    extractSenderEmail(bundle.liste.from ?? "") ||
    bundle.workspace.kunde.email;

  if (!email || email === "—") return;

  const text = collectBundleText(bundle);
  if (!text.trim()) return;

  updateCustomerMemory({
    customerId: buildCustomerIdFromEmail(email),
    source: "email",
    text,
    vorgangId: bundle.liste.id,
  });
}

export function updateCustomerMemoryFromGmailBundles(
  bundles: GmailVorgangBundle[]
): void {
  for (const bundle of bundles) {
    updateCustomerMemoryFromGmailBundle(bundle);
  }
}

export function updateCustomerMemoryFromKundenakte(
  kundenakte: Kundenakte
): void {
  if (!kundenakte.email || kundenakte.email === "—") return;

  const text = [
    kundenakte.name,
    kundenakte.firma,
    kundenakte.email,
    kundenakte.telefon,
    kundenakte.adresse,
    kundenakte.betreff,
    kundenakte.quelle,
  ]
    .filter(Boolean)
    .join("\n");

  updateCustomerMemory({
    customerId: buildCustomerIdFromEmail(kundenakte.email),
    source: "kundenakte",
    text,
    vorgangId: kundenakte.vorgangId,
  });
}

export function updateCustomerMemoryFromAppointment(input: {
  vorgangId: string;
  email: string;
  slotLabel: string;
  snippet?: string;
}): void {
  if (!input.email || input.email === "—") return;

  const text = [
    input.snippet,
    `Besichtigung bestätigt: ${input.slotLabel}`,
    "Termin im Kalender gespeichert",
  ]
    .filter(Boolean)
    .join("\n");

  updateCustomerMemory({
    customerId: buildCustomerIdFromEmail(input.email),
    source: "termin",
    text,
    vorgangId: input.vorgangId,
  });
}

export function updateCustomerMemoryFromOffer(input: {
  vorgangId: string;
  email: string;
  angebot: VorgangAngebot;
}): void {
  if (!input.email || input.email === "—") return;

  const netto = input.angebot.positionen.reduce(
    (sum, pos) => sum + pos.menge * pos.einzelpreis,
    0
  );
  const total = netto * (1 + input.angebot.mwstSatz / 100);

  const text = [
    `Angebot ${input.angebot.angebotNr}`,
    `Status: ${input.angebot.status}`,
    `Summe: ${Math.round(total).toLocaleString("de-CH")} CHF`,
    input.angebot.deadline ? `Frist: ${input.angebot.deadline}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  updateCustomerMemory({
    customerId: buildCustomerIdFromEmail(input.email),
    source: "angebot",
    text,
    vorgangId: input.vorgangId,
  });
}
