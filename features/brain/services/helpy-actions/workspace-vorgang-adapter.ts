import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const fallbackListeCache = new Map<string, { cacheKey: string; value: ListeVorgang }>();

export function toListeVorgangFromWorkspace(vorgang: WorkspaceVorgang): ListeVorgang {
  const cacheKey = [
    vorgang.aufgabe.titel,
    vorgang.letzteEmail.absender,
    vorgang.letzteEmail.datum,
    vorgang.kopfzeile?.quelle ?? "Gmail",
  ].join("|");

  const cached = fallbackListeCache.get(vorgang.id);
  if (cached?.cacheKey === cacheKey) {
    return cached.value;
  }

  const next: ListeVorgang = {
    id: vorgang.id,
    typ: "normale_nachricht",
    titel: vorgang.aufgabe.titel,
    emoji: "✉",
    kunde: vorgang.kunde.firmenname,
    quelle: vorgang.kopfzeile?.quelle ?? "Gmail",
    prioritaet: "mittel",
    status: "neu",
    helpyEmpfehlung: vorgang.helpy.empfehlung,
    receivedAt: new Date().toISOString(),
    receivedLabel: vorgang.letzteEmail.datum,
    from: vorgang.letzteEmail.absender,
    snippet: vorgang.letzteEmail.inhalt,
    skill: vorgang.skill,
    intentLabel: vorgang.kopfzeile?.intentLabel,
  };

  fallbackListeCache.set(vorgang.id, { cacheKey, value: next });
  return next;
}
