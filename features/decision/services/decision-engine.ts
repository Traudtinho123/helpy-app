import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import {
  buildDecisionContext,
  buildDecisionInputFromBundle,
  buildDecisionInputFromListe,
  buildDecisionInputFromWorkspace,
} from "@/features/decision/services/decision-context";
import { evaluateDecisionRules } from "@/features/decision/services/decision-rules";
import type {
  DecisionEvaluation,
  DecisionInput,
  HelpyDecision,
} from "@/features/decision/types/decision-types";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { shouldPrepareArchive } from "@/features/spam-handling/services/archive-handling-engine";
import { HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN } from "@/features/review/services/safety/review-mode";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

const decisions = new Map<string, HelpyDecision>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeHelpyDecision(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isGmailVorgang(source: {
  quelle?: string;
  id?: string;
  kopfzeile?: { quelle?: string };
  mailProvider?: "gmail" | "outlook";
}): boolean {
  const quelle = source.quelle ?? source.kopfzeile?.quelle ?? "";

  return (
    source.mailProvider === "gmail" ||
    quelle === "Gmail" ||
    isPlatformRealEstateQuelle(quelle) ||
    Boolean(source.id?.startsWith("brain-v3-") && !source.id.startsWith("brain-v3-outlook-")) ||
    Boolean(source.id?.startsWith("thread-"))
  );
}

export function isOutlookVorgang(source: {
  quelle?: string;
  id?: string;
  mailProvider?: "gmail" | "outlook";
}): boolean {
  return (
    source.mailProvider === "outlook" ||
    source.quelle === "Outlook" ||
    Boolean(source.id?.startsWith("brain-v3-outlook-"))
  );
}

export function isConnectedMailVorgang(source: {
  quelle?: string;
  id?: string;
  kopfzeile?: { quelle?: string };
  mailProvider?: "gmail" | "outlook";
}): boolean {
  return isGmailVorgang(source) || isOutlookVorgang(source);
}

export function isVoiceVorgang(source: {
  quelle?: string;
  typ?: string;
  id?: string;
  kopfzeile?: { quelle?: string };
}): boolean {
  const quelle = source.quelle ?? source.kopfzeile?.quelle ?? "";
  return (
    source.typ === "helpy_phone" ||
    quelle === "helpy_phone" ||
    quelle === "Telefon" ||
    quelle === "HELPY Phone" ||
    Boolean(source.id?.startsWith("voice-"))
  );
}

export function isHelpyIntakeVorgang(source: {
  quelle?: string;
  id?: string;
  kopfzeile?: { quelle?: string };
  mailProvider?: "gmail" | "outlook";
}): boolean {
  return isConnectedMailVorgang(source) || isVoiceVorgang(source);
}

function buildHelpyDecision(
  context: ReturnType<typeof buildDecisionContext>,
  outcome: ReturnType<typeof evaluateDecisionRules>
): HelpyDecision {
  return {
    id: `helpy-decision-${context.vorgangId}`,
    vorgangId: context.vorgangId,
    decisionTitle: outcome.decisionTitle,
    reason: outcome.reason,
    nextBestStep: outcome.nextBestStep,
    preparedItems: outcome.preparedItems,
    needsConfirmation: true,
    confirmationLabel: HELPY_BUTTON_PRUEFEN_UND_BESTAETIGEN,
    helpyMessage: outcome.helpyMessage,
  };
}

function decisionFingerprint(decision: HelpyDecision): string {
  return JSON.stringify({
    decisionTitle: decision.decisionTitle,
    reason: decision.reason,
    nextBestStep: decision.nextBestStep,
    preparedItems: decision.preparedItems,
    helpyMessage: decision.helpyMessage,
  });
}

function storeHelpyDecisionIfChanged(decision: HelpyDecision): HelpyDecision {
  const existing = decisions.get(decision.vorgangId);
  if (existing && decisionFingerprint(existing) === decisionFingerprint(decision)) {
    return existing;
  }

  decisions.set(decision.vorgangId, decision);
  notify();
  return decision;
}

function storeHelpyDecisionSilently(decision: HelpyDecision): HelpyDecision {
  const existing = decisions.get(decision.vorgangId);
  if (existing && decisionFingerprint(existing) === decisionFingerprint(decision)) {
    return existing;
  }

  decisions.set(decision.vorgangId, decision);
  return decision;
}

function commitHelpyDecision(input: DecisionInput): HelpyDecision {
  const context = buildDecisionContext(input);
  const outcome = evaluateDecisionRules(context);
  return storeHelpyDecisionIfChanged(buildHelpyDecision(context, outcome));
}

export function evaluateHelpyDecision(input: DecisionInput): DecisionEvaluation {
  const context = buildDecisionContext(input);
  const outcome = evaluateDecisionRules(context);
  const decision = storeHelpyDecisionSilently(
    buildHelpyDecision(context, outcome)
  );

  return { context, decision };
}

export function evaluateHelpyDecisionFromListe(
  vorgang: ListeVorgang
): HelpyDecision | null {
  if (!isGmailVorgang(vorgang) || shouldPrepareArchive(vorgang)) return null;
  return commitHelpyDecision(buildDecisionInputFromListe(vorgang));
}

export function evaluateHelpyDecisionFromWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): HelpyDecision | null {
  return getOrEvaluateHelpyDecisionForWorkspace(vorgang, liste);
}

export function getHelpyDecision(vorgangId: string): HelpyDecision | null {
  return decisions.get(vorgangId) ?? null;
}

export function getOrEvaluateHelpyDecision(
  vorgang: ListeVorgang
): HelpyDecision | null {
  if (shouldPrepareArchive(vorgang)) return null;
  const existing = getHelpyDecision(vorgang.id);
  if (existing) return existing;

  const context = buildDecisionContext(buildDecisionInputFromListe(vorgang));
  const outcome = evaluateDecisionRules(context);
  return storeHelpyDecisionSilently(buildHelpyDecision(context, outcome));
}

export function getOrEvaluateHelpyDecisionForWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): HelpyDecision | null {
  if (liste && shouldPrepareArchive(liste)) return null;
  const existing = getHelpyDecision(vorgang.id);
  if (existing) return existing;
  if (
    !isGmailVorgang(vorgang) &&
    !isGmailVorgang({ quelle: liste?.quelle, id: vorgang.id })
  ) {
    return null;
  }

  const context = buildDecisionContext(
    buildDecisionInputFromWorkspace(vorgang, liste)
  );
  const outcome = evaluateDecisionRules(context);
  return storeHelpyDecisionSilently(buildHelpyDecision(context, outcome));
}

export function seedHelpyDecisionsFromBundles(bundles: GmailVorgangBundle[]): void {
  for (const bundle of bundles) {
    if (shouldPrepareArchive(bundle.liste)) continue;
    commitHelpyDecision(buildDecisionInputFromBundle(bundle));
  }
}

export function seedHelpyDecisionsFromListeVorgaenge(
  vorgaenge: ListeVorgang[]
): void {
  for (const vorgang of vorgaenge) {
    if (isGmailVorgang(vorgang) && !shouldPrepareArchive(vorgang)) {
      evaluateHelpyDecisionFromListe(vorgang);
    }
  }
}

export function resetHelpyDecisionStore(): void {
  decisions.clear();
  notify();
}
