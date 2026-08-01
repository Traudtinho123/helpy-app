import type { HelpyAction } from "@/features/brain/services/helpy-actions/types";

export type HelpyActionKind =
  | "reply"
  | "appointment"
  | "route"
  | "call"
  | "document"
  | "complete"
  | "navigate-kunde"
  | "navigate-objekte";

const ACTION_KIND_BY_ID: Record<string, HelpyActionKind> = {
  "re-besichtigung-planen": "route",
  "re-default-besichtigung": "route",
  "hw-baustellenbesichtigung": "route",
  "hw-default-besichtigung": "route",

  "re-erstgespraech": "appointment",
  "re-rueckruf-planen": "appointment",
  "re-default-rueckruf": "appointment",
  "hw-termin-nachfassen": "appointment",
  "cl-erstgespraech": "appointment",
  "cl-default-termin": "appointment",
  "cl-gespraech-vorbereiten": "appointment",
  "cl-frist-sichern": "appointment",

  "hw-antwort-vorbereiten": "reply",
  "cl-antwort-vorbereiten": "reply",
  "cl-default-antwort": "reply",
  "re-willkommen": "reply",
  "cl-mandant-informieren": "reply",
  "cl-einladung-senden": "reply",
  "cl-follow-up": "reply",

  "hw-kunde-anrufen": "call",
  "hw-kunde-anrufen-2": "call",
  "hw-rueckruf-kunde": "call",
  "hw-default-anruf": "call",
  "cl-berater-kontakt": "call",
  "cl-mandant-kontakt": "call",

  "re-expose-senden": "document",
  "re-default-expose": "document",
  "hw-offerte-erstellen": "document",
  "hw-angebot-nachreichen": "document",
  "hw-angebot-finalisieren": "document",
  "hw-default-offerte": "document",
  "hw-material-pruefen": "document",
  "hw-material-pruefen-2": "document",
  "hw-default-material": "document",
  "hw-lieferung-klaeren": "document",
  "cl-angebot-erstellen": "document",
  "cl-angebot-bereit": "document",
  "cl-angebot-freigeben": "document",
  "cl-default-angebot": "document",
  "cl-dokument-pruefen": "document",
  "cl-dokument-pruefen-2": "document",
  "cl-dokumente-sammeln": "document",

  "re-interessent-anlegen": "navigate-kunde",
  "re-interessent-anlegen-2": "navigate-kunde",
  "re-default-interessent": "navigate-kunde",
  "cl-mandant-anlegen": "navigate-kunde",
  "cl-default-mandant": "navigate-kunde",
  "hw-kunde-anlegen": "navigate-kunde",

  "re-objekt-matching": "navigate-objekte",
};

function inferKindFromText(action: HelpyAction): HelpyActionKind {
  const haystack =
    `${action.id} ${action.title} ${action.primaryLabel} ${action.description}`.toLowerCase();

  if (
    /anruf|telefon|kontakt|rückruf vorbereiten/.test(haystack) &&
    !/planen|termin|kalender|einplanen/.test(haystack)
  ) {
    return "call";
  }

  if (/besichtigung|baustelle|route/.test(haystack)) {
    return "route";
  }

  if (/termin|gespräch|frist|kalender|einplanen|vorschlagen/.test(haystack)) {
    return "appointment";
  }

  if (/antwort|mail|willkommen|einladung|follow-up|informieren|schreiben/.test(haystack)) {
    return "reply";
  }

  if (/offerte|angebot|exposé|expose|dokument|material|vertrag|prüfen/.test(haystack)) {
    return "document";
  }

  if (/anlegen|interessent|mandant|akte/.test(haystack)) {
    return "navigate-kunde";
  }

  if (/objekt|matching/.test(haystack)) {
    return "navigate-objekte";
  }

  if (/erledigt|abschliessen|abschließen/.test(haystack)) {
    return "complete";
  }

  return "reply";
}

export function resolveActionKind(action: HelpyAction): HelpyActionKind {
  return ACTION_KIND_BY_ID[action.id] ?? inferKindFromText(action);
}

export function resolveDocumentFocus(
  action: HelpyAction
): "expose" | "offerte" | "dokument" {
  const haystack =
    `${action.id} ${action.title} ${action.primaryLabel}`.toLowerCase();

  if (/exposé|expose/.test(haystack)) return "expose";
  if (/offerte|angebot/.test(haystack)) return "offerte";
  return "dokument";
}
