import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import {
  getGmailListeVorgang,
  getGmailWorkspaceVorgang,
} from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import {
  getOutlookListeVorgang,
  getOutlookWorkspaceVorgang,
} from "@/features/outlook/services/outlook-vorgaenge-store";
import {
  getVoiceListeVorgang,
  getVoiceWorkspaceVorgang,
} from "@/features/voice/services/voice-vorgaenge-store";
import {
  VORGANG_PRIORITY_LABELS,
  VORGANG_TYP_LABELS,
  type Vorgang as ListeVorgang,
} from "@/features/workspace/services/vorgaenge/types";
import { HELPY_STATUS_LABELS } from "@/features/workspace/services/status/types";
import { getVorgangStatusSnapshot, initStatusForVorgaenge } from "@/features/workspace/services/status/status-engine";
import { getVorgang as getLegacyWorkspaceVorgang } from "@/features/workspace/services/workspace/mock-vorgaenge";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { DEFAULT_HELPY_SKILL } from "@/features/workspace/services/workspace/skills";
import type {
  Vorgang,
  VorgangAngebot,
  VorgangDokument,
  VorgangHelpy,
  VorgangKopfzeile,
  VorgangKunde,
  VorgangTermin,
} from "@/features/workspace/services/workspace/types";

import { HELPY_WORKSPACE_INTRO } from "@/features/review/services/safety/review-mode";

let listeInitialized = false;

function ensureListeStatus(): ListeVorgang[] {
  const items = getBrainV2Vorgaenge();
  if (!listeInitialized) {
    initStatusForVorgaenge(items);
    listeInitialized = true;
  }
  return items;
}

export function getWorkspacePath(id: string): string {
  return `/workspace/${id}`;
}

function parseKunde(kundeStr: string): VorgangKunde {
  const parts = kundeStr.split("·").map((part) => part.trim());
  if (parts.length >= 2) {
    return {
      firmenname: parts[parts.length - 1],
      ansprechpartner: parts[0],
      email: "—",
      telefon: "—",
      adresse: "—",
      status: "Aktiv",
    };
  }

  return {
    firmenname: kundeStr,
    ansprechpartner: kundeStr,
    email: "—",
    telefon: "—",
    adresse: "—",
    status: "Aktiv",
  };
}

function inferSkill(vorgang: ListeVorgang): HelpySkill {
  if (
    vorgang.skill === "real-estate" ||
    vorgang.skill === "construction" ||
    vorgang.skill === "consulting-legal"
  ) {
    return vorgang.skill;
  }

  const intent = vorgang.intent ?? vorgang.typ;
  if (
    intent === "besichtigung" ||
    intent === "interessentenanfrage" ||
    intent === "immobilienanfrage"
  ) {
    return "real-estate";
  }
  if (
    intent === "angebotsanfrage" ||
    intent === "offertanfrage" ||
    intent === "vor_ort_termin" ||
    intent === "materialanfrage" ||
    intent === "auftragsanfrage" ||
    intent === "rueckruf"
  ) {
    return "construction";
  }
  if (
    intent === "mandatsanfrage" ||
    intent === "erstgespraech" ||
    intent === "frist"
  ) {
    return "consulting-legal";
  }
  // Generisches "anfrage" ohne Skill-Hinweis → Default (kein RE-Zwang).
  return DEFAULT_HELPY_SKILL;
}

function inferKategorie(vorgang: ListeVorgang): string {
  return (
    vorgang.intentLabel ??
    VORGANG_TYP_LABELS[vorgang.typ] ??
    "Vorgang"
  );
}

function buildTermine(vorgang: ListeVorgang): VorgangTermin[] {
  if (
    vorgang.typ === "terminwunsch" ||
    vorgang.intent === "terminwunsch" ||
    vorgang.intent === "besichtigung" ||
    vorgang.intent === "vor_ort_termin" ||
    vorgang.intent === "erstgespraech"
  ) {
    return [
      {
        titel: vorgang.titel,
        datum: vorgang.receivedLabel,
        ort: vorgang.detectedContext?.[0],
      },
    ];
  }
  return [];
}

function buildDokumente(vorgang: ListeVorgang): VorgangDokument[] {
  return (vorgang.createdObjects ?? []).map((name) => ({
    name,
    typ: "PDF",
    datum: "07.07.2026",
  }));
}

function buildAngebot(vorgang: ListeVorgang): VorgangAngebot | undefined {
  if (
    vorgang.typ !== "angebotsanfrage" &&
    vorgang.intent !== "angebotsanfrage" &&
    vorgang.intent !== "offertanfrage"
  ) {
    return undefined;
  }

  return {
    angebotNr: `A-2026-${vorgang.id.slice(-4).replace(/\D/g, "0") || "0147"}`,
    status: "Entwurf",
    mwstSatz: 19,
    deadline: "Diese Woche",
    positionen: [
      {
        bezeichnung: vorgang.titel,
        menge: 1,
        einzelpreis: 0,
      },
    ],
  };
}

function buildHelpy(vorgang: ListeVorgang): VorgangHelpy {
  const erkannt =
    vorgang.summary ??
    vorgang.detectedContext?.join(" · ") ??
    `${vorgang.kunde} über ${vorgang.quelle}`;

  return {
    intro: HELPY_WORKSPACE_INTRO,
    erkannt,
    empfehlung: vorgang.helpyEmpfehlung,
    naechsterSchritt:
      vorgang.recommendedNextStep ??
      vorgang.preparedActions?.[0] ??
      "Vorgang prüfen und bestätigen",
  };
}

function buildKopfzeile(vorgang: ListeVorgang): VorgangKopfzeile {
  const { currentStatus } = getVorgangStatusSnapshot(vorgang);

  return {
    statusLabel: HELPY_STATUS_LABELS[currentStatus],
    prioritaetLabel: VORGANG_PRIORITY_LABELS[vorgang.prioritaet],
    quelle: vorgang.quelle,
    intentLabel: vorgang.intentLabel,
  };
}

function mapListeToWorkspace(vorgang: ListeVorgang): Vorgang {
  const kunde = parseKunde(vorgang.kunde);
  const kategorie = inferKategorie(vorgang);

  return {
    id: vorgang.id,
    skill: inferSkill(vorgang),
    kunde,
    aufgabe: {
      titel: vorgang.titel,
      kategorie,
      deadline: vorgang.receivedLabel,
      fortschritt: 55,
      empfohleneAktion:
        vorgang.recommendedNextStep ??
        vorgang.preparedActions?.[0] ??
        vorgang.helpyEmpfehlung,
    },
    letzteEmail: {
      betreff: vorgang.titel,
      absender: kunde.ansprechpartner,
      datum: vorgang.receivedLabel,
      inhalt: vorgang.summary ?? vorgang.helpyEmpfehlung,
      zusammenfassung:
        vorgang.summary ??
        vorgang.detectedContext?.join(" ") ??
        vorgang.helpyEmpfehlung,
    },
    angebot: buildAngebot(vorgang),
    termine: buildTermine(vorgang),
    dokumente: buildDokumente(vorgang),
    notizen:
      vorgang.detectedContext?.join("\n") ??
      "Von HELPY aus dem Vorgang übernommen.",
    helpy: buildHelpy(vorgang),
    kopfzeile: buildKopfzeile(vorgang),
  };
}

function enrichLegacyWorkspace(vorgang: Vorgang): Vorgang {
  return {
    ...vorgang,
    helpy: {
      intro: HELPY_WORKSPACE_INTRO,
      erkannt:
        vorgang.helpy.erkannt ??
        vorgang.helpy.begruessung ??
        vorgang.letzteEmail.zusammenfassung,
      empfehlung: vorgang.helpy.empfehlung,
      naechsterSchritt: vorgang.helpy.naechsterSchritt,
    },
    kopfzeile: vorgang.kopfzeile ?? {
      statusLabel: "Von HELPY vorbereitet",
      prioritaetLabel: "Hoch",
      quelle: "Posteingang",
      intentLabel: vorgang.aufgabe.kategorie,
    },
  };
}

export function buildWorkspaceVorgangFromListe(vorgang: ListeVorgang): Vorgang {
  return mapListeToWorkspace(vorgang);
}

export function getWorkspaceVorgang(id: string): Vorgang | null {
  const gmailWorkspace = getGmailWorkspaceVorgang(id);
  if (gmailWorkspace) {
    return gmailWorkspace;
  }

  const outlookWorkspace = getOutlookWorkspaceVorgang(id);
  if (outlookWorkspace) {
    return outlookWorkspace;
  }

  const voiceWorkspace = getVoiceWorkspaceVorgang(id);
  if (voiceWorkspace) {
    return voiceWorkspace;
  }

  const gmailListe = getGmailListeVorgang(id);
  if (gmailListe) {
    return mapListeToWorkspace(gmailListe);
  }

  const outlookListe = getOutlookListeVorgang(id);
  if (outlookListe) {
    return mapListeToWorkspace(outlookListe);
  }

  const voiceListe = getVoiceListeVorgang(id);
  if (voiceListe) {
    return mapListeToWorkspace(voiceListe);
  }

  const legacy = getLegacyWorkspaceVorgang(id);
  if (legacy) {
    return enrichLegacyWorkspace(legacy);
  }

  const liste = ensureListeStatus().find((v) => v.id === id);
  if (liste) {
    return mapListeToWorkspace(liste);
  }

  return null;
}

export function getListeVorgang(id: string): ListeVorgang | null {
  return ensureListeStatus().find((v) => v.id === id) ?? null;
}
