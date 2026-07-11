import type { PreparedHelpyAction } from "@/features/review/services/actions/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import type {
  AllgemeinReviewContent,
  AngebotReviewContent,
  AntwortReviewContent,
  FristReviewContent,
  HelpyReview,
  KundeReviewContent,
  ReviewKind,
  TerminReviewContent,
} from "@/features/review/services/types";
import { REVIEW_KIND_FOR_ACTION } from "@/features/review/services/types";

function parseCustomer(vorgang: Vorgang): {
  name: string;
  firma: string;
  email: string;
} {
  const raw = vorgang.kunde;
  if (raw.includes("·")) {
    const [name, firma] = raw.split("·").map((s) => s.trim());
    return {
      name: name ?? raw,
      firma: firma ?? "—",
      email: guessEmail(firma ?? name ?? ""),
    };
  }
  return {
    name: raw,
    firma: raw.includes("GmbH") || raw.includes("AG") ? raw : "—",
    email: guessEmail(raw),
  };
}

function guessEmail(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  return `kontakt@${slug || "kunde"}.de`;
}

function buildAntwortReview(
  vorgang: Vorgang,
  action: PreparedHelpyAction
): AntwortReviewContent {
  const { name, firma, email } = parseCustomer(vorgang);

  return {
    kind: "antwort",
    betreff: `Re: ${vorgang.titel}`,
    empfaenger: email.includes("@") ? email : `${name} <${email}>`,
    tonalitaet: "Formell und freundlich",
    antworttext: `Sehr geehrte/r ${name},

vielen Dank für Ihre Nachricht${firma !== "—" ? ` im Namen von ${firma}` : ""}. Ich habe Ihr Anliegen geprüft und melde mich zeitnah mit den nächsten Schritten.

Bei Rückfragen stehe ich Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`,
    primaryLabel: "Bestätigen & über Gmail senden",
  };
}

function buildAngebotReview(
  vorgang: Vorgang,
  action: PreparedHelpyAction
): AngebotReviewContent {
  const { firma, name } = parseCustomer(vorgang);
  const isOfferte = action.actionTypeId === "offerte-vorbereiten";

  return {
    kind: "angebot",
    kunde: firma !== "—" ? firma : name,
    positionen: isOfferte
      ? [
          "Vor-Ort-Besichtigung und Aufmaß",
          "Material und Arbeitszeit laut Besichtigung",
          "Projektleitung und Koordination",
        ]
      : [
          "Leistungspaket laut Anfrage",
          "Beratung und Abstimmung",
          "Optional: Erweiterungspositionen",
        ],
    summe: isOfferte ? "48.200,00 EUR (zzgl. MwSt.)" : "12.500,00 EUR (zzgl. MwSt.)",
    fehlendeAngaben: isOfferte
      ? ["Vor-Ort-Termin noch nicht bestätigt", "Finale Materialwahl offen"]
      : ["Leistungsumfang final abstimmen", "Zahlungsziel bestätigen"],
    primaryLabel: "Angebot prüfen",
  };
}

function buildTerminReview(
  vorgang: Vorgang,
  action: PreparedHelpyAction
): TerminReviewContent {
  const { name, firma } = parseCustomer(vorgang);
  const isRueckruf = action.actionTypeId === "rueckruf-planen";

  return {
    kind: "termin",
    kunde: firma !== "—" ? `${name} · ${firma}` : name,
    datum: "10.07.2026",
    uhrzeit: isRueckruf ? "10:30 – 11:00" : "18:30 – 19:30",
    ort: isRueckruf
      ? "Telefonisch"
      : vorgang.summary?.includes("Industriestraße")
        ? "Industriestraße 12, München"
        : "Nach Vereinbarung vor Ort",
    primaryLabel: "Termin bestätigen",
  };
}

function buildKundeReview(vorgang: Vorgang): KundeReviewContent {
  const { name, firma, email } = parseCustomer(vorgang);

  return {
    kind: "kunde",
    name,
    firma: firma !== "—" ? firma : name,
    email,
    telefon: "+49 89 555 123 45",
    primaryLabel: "Kundenakte bestätigen",
  };
}

function buildFristReview(vorgang: Vorgang): FristReviewContent {
  return {
    kind: "frist",
    frist: "10.07.2026",
    grund: vorgang.titel,
    kalenderhinweis:
      "Erinnerung 2 Tage vorher · Verantwortliche Person zuweisen",
    primaryLabel: "Frist bestätigen",
  };
}

function buildAllgemeinReview(
  vorgang: Vorgang,
  action: PreparedHelpyAction
): AllgemeinReviewContent {
  return {
    kind: "allgemein",
    zusammenfassung: action.description,
    details: [
      `Vorgang: ${vorgang.titel}`,
      `Kunde: ${vorgang.kunde}`,
      `Quelle: ${vorgang.quelle}`,
    ],
    primaryLabel: "Bestätigen",
  };
}

export function resolveReviewKind(actionTypeId: string): ReviewKind {
  return REVIEW_KIND_FOR_ACTION[actionTypeId as keyof typeof REVIEW_KIND_FOR_ACTION] ?? "allgemein";
}

export function buildMockReview(
  vorgang: Vorgang,
  action: PreparedHelpyAction
): HelpyReview {
  const kind = resolveReviewKind(action.actionTypeId);

  let content:
    | AntwortReviewContent
    | AngebotReviewContent
    | TerminReviewContent
    | KundeReviewContent
    | FristReviewContent
    | AllgemeinReviewContent;

  switch (kind) {
    case "antwort":
      content = buildAntwortReview(vorgang, action);
      break;
    case "angebot":
      content = buildAngebotReview(vorgang, action);
      break;
    case "termin":
      content = buildTerminReview(vorgang, action);
      break;
    case "kunde":
      content = buildKundeReview(vorgang);
      break;
    case "frist":
      content = buildFristReview(vorgang);
      break;
    default:
      content = buildAllgemeinReview(vorgang, action);
  }

  return {
    id: `review-${action.instanceId}`,
    instanceId: action.instanceId,
    actionTypeId: action.actionTypeId,
    actionTitle: action.title,
    title: action.title,
    helpyHint: "Ich habe alles vorbereitet. Bitte prüfe die Angaben, bevor du bestätigst.",
    content,
  };
}
