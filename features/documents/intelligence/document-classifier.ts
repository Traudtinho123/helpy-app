import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { inferMimeTypeFromFileName } from "@/features/gmail/services/gmail/attachment-parser";
import type {
  ConstructionDocumentCategory,
  ConsultingDocumentCategory,
  GmailAttachmentCandidate,
  RealEstateDocumentCategory,
  RecognizedDocumentCategory,
} from "@/features/documents/intelligence/document-types";
import { parseSizeFromText } from "@/features/documents/intelligence/document-dedupe";

const ATTACHMENT_SIGNAL_PATTERN =
  /anhang|attachment|beigef(?:ü|ue)gt|unterlagen|\.pdf|\.jpg|\.jpeg|\.png|\.docx?|\.xlsx?|\.csv|\.pptx?|datei/i;

export function hasGmailAttachmentSignals(subject: string, snippet: string): boolean {
  return ATTACHMENT_SIGNAL_PATTERN.test(`${subject} ${snippet}`);
}

export { inferMimeTypeFromFileName } from "@/features/gmail/services/gmail/attachment-parser";

export function extractAttachmentCandidates(
  subject: string,
  snippet: string,
  skill: HelpySkill,
  intentLabel?: string,
  messageId?: string
): GmailAttachmentCandidate[] {
  const combined = `${subject} ${snippet}`;
  const parsedSize = parseSizeFromText(combined);
  const found = new Set<string>();

  for (const match of combined.matchAll(
    /([\wäöüÄÖÜß\-_. ]+\.(?:pdf|png|jpe?g|docx?|xlsx?|csv|pptx?))/gi
  )) {
    found.add(match[1].trim());
  }

  const anhangMatch = combined.match(/anhang[:\s-]+([^,\n.]+)/i);
  if (anhangMatch) {
    let name = anhangMatch[1].trim();
    if (!/\.\w+$/.test(name)) {
      name = `${name}.pdf`;
    }
    found.add(name);
  }

  if (found.size === 0 && hasGmailAttachmentSignals(subject, snippet)) {
    for (const fallback of inferFallbackAttachments(skill, intentLabel, combined)) {
      found.add(fallback.fileName);
    }
  }

  return [...found].map((fileName) => ({
    fileName,
    mimeType: inferMimeTypeFromFileName(fileName),
    messageId,
    sizeBytes: parsedSize.sizeBytes,
    sizeLabel: parsedSize.sizeLabel,
  }));
}

function inferFallbackAttachments(
  skill: HelpySkill,
  intentLabel: string | undefined,
  text: string
): GmailAttachmentCandidate[] {
  const normalized = text.toLowerCase();

  if (skill === "real-estate") {
    if (/grundriss|plan/.test(normalized)) {
      return [{ fileName: "Grundriss.pdf", mimeType: "application/pdf" }];
    }
    if (/expose|exposé/.test(normalized)) {
      return [{ fileName: "Expose.pdf", mimeType: "application/pdf" }];
    }
    return [{ fileName: "Unterlagen_Immobilie.pdf", mimeType: "application/pdf" }];
  }

  if (skill === "construction") {
    if (/offert|angebot/.test(normalized) || intentLabel === "Angebotsanfrage") {
      return [{ fileName: "Offerte_Anfrage.pdf", mimeType: "application/pdf" }];
    }
    if (/plan|grundriss/.test(normalized)) {
      return [{ fileName: "Plan.pdf", mimeType: "application/pdf" }];
    }
    return [{ fileName: "Baustellen_Unterlagen.pdf", mimeType: "application/pdf" }];
  }

  if (/vollmacht/.test(normalized)) {
    return [{ fileName: "Vollmacht.pdf", mimeType: "application/pdf" }];
  }
  if (/vertrag/.test(normalized) || intentLabel === "Mandatsanfrage") {
    return [{ fileName: "Vertrag_Entwurf.pdf", mimeType: "application/pdf" }];
  }
  return [{ fileName: "Dokument_zur_Pruefung.pdf", mimeType: "application/pdf" }];
}

function classifyRealEstate(fileName: string, context: string): RealEstateDocumentCategory {
  const haystack = `${fileName} ${context}`.toLowerCase();
  if (/expose|exposé/.test(haystack)) return "expose";
  if (/grundriss|plan/.test(haystack)) return "grundriss";
  if (/foto|bild|jpg|jpeg|png/.test(haystack)) return "objektbild";
  if (/finanz|hypothek|bank/.test(haystack)) return "finanzierungsbestaetigung";
  if (/ausweis|pass|id/.test(haystack)) return "ausweis";
  if (/miet|mietvertrag|mietunterlage/.test(haystack)) return "mietunterlagen";
  if (/vertrag|reservation|kauf/.test(haystack)) return "vertrag";
  return "sonstiges";
}

function classifyConstruction(fileName: string, context: string): ConstructionDocumentCategory {
  const haystack = `${fileName} ${context}`.toLowerCase();
  if (/plan|grundriss/.test(haystack)) return "plan";
  if (/offert|angebot|kostenvoranschlag/.test(haystack)) return "offerte";
  if (/rechnung|invoice/.test(haystack)) return "rechnung";
  if (/foto|bild|jpg|jpeg|png/.test(haystack)) return "foto";
  if (/material|liste/.test(haystack)) return "materialliste";
  if (/vertrag/.test(haystack)) return "vertrag";
  return "sonstiges";
}

function classifyConsulting(fileName: string, context: string): ConsultingDocumentCategory {
  const haystack = `${fileName} ${context}`.toLowerCase();
  if (/vollmacht/.test(haystack)) return "vollmacht";
  if (/rechnung|invoice/.test(haystack)) return "rechnung";
  if (/ausweis|pass|id/.test(haystack)) return "ausweis";
  if (/vertrag|mandat|vertrags/.test(haystack)) return "vertrag";
  if (/pruef|prüf|pruf|review|stellungnahme|frist/.test(haystack)) {
    return "dokument-zur-pruefung";
  }
  return "sonstiges";
}

export function classifyAttachment(
  skill: HelpySkill,
  attachment: GmailAttachmentCandidate,
  context: string
): RecognizedDocumentCategory {
  if (skill === "real-estate") {
    return classifyRealEstate(attachment.fileName, context);
  }
  if (skill === "construction") {
    return classifyConstruction(attachment.fileName, context);
  }
  return classifyConsulting(attachment.fileName, context);
}

export function buildRecommendation(
  skill: HelpySkill,
  category: RecognizedDocumentCategory,
  fileName: string
): string {
  if (category === "sonstiges") {
    return `Bitte prüfe „${fileName}“ und ordne es manuell zu.`;
  }

  if (skill === "real-estate") {
    if (category === "expose") return "Exposé dem Objekt und Interessenten zuordnen.";
    if (category === "grundriss") return "Grundriss mit Objektakte verknüpfen.";
    if (category === "finanzierungsbestaetigung") {
      return "Finanzierungsbestätigung in der Kundenakte hinterlegen.";
    }
    if (category === "vertrag") return "Vertrag zur Prüfung in Dokumente öffnen.";
  }

  if (skill === "construction") {
    if (category === "offerte") return "Offerte prüfen und dem Vorgang zuordnen.";
    if (category === "plan") return "Plan dem Projekt und der Offerte zuordnen.";
    if (category === "materialliste") return "Materialliste für die Offerte übernehmen.";
  }

  if (skill === "consulting-legal") {
    if (category === "vollmacht") return "Vollmacht prüfen und im Mandat ablegen.";
    if (category === "dokument-zur-pruefung") {
      return "Dokument zur fristgerechten Prüfung öffnen.";
    }
  }

  return "Zuordnung prüfen und in Dokumente ablegen.";
}
