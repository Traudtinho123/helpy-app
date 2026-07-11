import { MOCK_CONNECT_EVENTS } from "@/features/platforms/services/connect/mock-events";
import { getBrainV2Vorgaenge } from "@/features/workspace/services/vorgaenge/mock-vorgaenge";
import type { VorgangPriority } from "@/features/workspace/services/vorgaenge/types";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { getListeVorgang } from "@/features/workspace/services/workspace/workspace-engine";
import type {
  DecisionContext,
  DecisionKundenstatus,
  DecisionPriority,
  DecisionSignal,
} from "@/features/workspace/services/decision/decision-types";

function mapPriority(priority?: VorgangPriority): DecisionPriority {
  if (priority === "kritisch") return "kritisch";
  if (priority === "hoch") return "hoch";
  if (priority === "niedrig") return "niedrig";
  return "mittel";
}

function inferKundenstatus(vorgang: Vorgang, listeKunde?: string): DecisionKundenstatus {
  const status = vorgang.kunde.status.toLowerCase();
  const kundeText = `${listeKunde ?? ""} ${vorgang.kunde.firmenname}`.toLowerCase();

  if (status.includes("neu") || kundeText.includes("neuer")) return "neu";
  if (status.includes("mandant") || status.includes("behörde")) return "mandant";
  if (status.includes("interessent")) return "interessent";
  if (status.includes("bestand")) return "bestehend";
  return "unbekannt";
}

function countRelatedVorgaenge(kundeName: string, currentId: string): number {
  const all = getBrainV2Vorgaenge();
  return all.filter(
    (item) => item.id !== currentId && item.kunde.includes(kundeName.split(" ")[0])
  ).length;
}

export function buildDecisionContext(vorgang: Vorgang): DecisionContext {
  const liste = getListeVorgang(vorgang.id);
  const event = liste?.sourceEventId
    ? MOCK_CONNECT_EVENTS.find((item) => item.id === liste.sourceEventId)
    : undefined;

  const prioritaet = mapPriority(liste?.prioritaet);
  const kundenstatus = inferKundenstatus(vorgang, liste?.kunde);
  const plattform = liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Unbekannt";
  const hasDokumente = vorgang.dokumente.length > 0;
  const hasFrist =
    Boolean(vorgang.aufgabe.deadline) ||
    liste?.typ === "frist" ||
    liste?.intent === "frist";
  const hasKalenderBezug =
    vorgang.termine.length > 0 ||
    liste?.typ === "terminwunsch" ||
    event?.type === "neuer-kalendereintrag" ||
    event?.type === "terminaenderung";

  const erkanntePunkte = [
    liste?.summary,
    ...(liste?.detectedContext ?? []),
    vorgang.letzteEmail.zusammenfassung,
  ].filter(Boolean) as string[];

  const skillLabel = getSkillConfig(vorgang.skill).label;
  const bestehendeVorgaenge = countRelatedVorgaenge(
    vorgang.kunde.firmenname,
    vorgang.id
  );

  const signals: DecisionSignal[] = [
    {
      category: "prioritaet",
      label: "Priorität",
      value: prioritaet,
      weight: prioritaet === "kritisch" ? 5 : prioritaet === "hoch" ? 4 : 2,
    },
    {
      category: "kundenstatus",
      label: "Kundenstatus",
      value: kundenstatus,
      weight: kundenstatus === "neu" ? 4 : 3,
    },
    {
      category: "skill",
      label: "Skill",
      value: skillLabel,
      weight: 3,
    },
    {
      category: "plattform",
      label: "Plattform",
      value: plattform,
      weight: 2,
    },
    {
      category: "dokumente",
      label: "Dokumente",
      value: hasDokumente ? "vorhanden" : "noch keine",
      weight: hasDokumente ? 3 : 1,
    },
    {
      category: "fristen",
      label: "Fristen",
      value: hasFrist ? "relevant" : "keine",
      weight: hasFrist ? 4 : 1,
    },
    {
      category: "kalender",
      label: "Kalender",
      value: hasKalenderBezug ? "Terminbezug" : "ruhig",
      weight: hasKalenderBezug ? 3 : 1,
    },
    {
      category: "bestehende-vorgaenge",
      label: "Bestehende Vorgänge",
      value: String(bestehendeVorgaenge),
      weight: bestehendeVorgaenge > 0 ? 2 : 1,
    },
  ];

  return {
    vorgangId: vorgang.id,
    skill: vorgang.skill,
    titel: vorgang.aufgabe.titel,
    kunde: vorgang.kunde.firmenname,
    plattform,
    prioritaet,
    kundenstatus,
    intent: liste?.intent ?? liste?.typ,
    sourceEventId: liste?.sourceEventId,
    hasDokumente,
    hasFrist,
    hasKalenderBezug,
    bestehendeVorgaenge,
    erkanntePunkte,
    signals,
  };
}
