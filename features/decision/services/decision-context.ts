import type { GmailVorgangBundle } from "@/features/brain/services/brain-result-to-vorgang";
import { extractSenderName } from "@/features/brain/services/brain-result-to-vorgang";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { buildCompanyKnowledgeDecisionSupplement } from "@/features/company-knowledge/services/company-knowledge-context";
import { getSkillMemories } from "@/features/memory/services";
import { selectWorkflowTemplate } from "@/features/workflow/services/automation/workflow-rules";
import type {
  DecisionContext,
  DecisionInput,
} from "@/features/decision/types/decision-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

function skillFromLabel(label?: string): HelpySkill | undefined {
  if (!label) return undefined;
  if (label.includes("Real Estate")) return "real-estate";
  if (label.includes("Construction")) return "construction";
  if (label.includes("Consulting")) return "consulting-legal";
  return undefined;
}

function buildRecognized(input: DecisionInput): string[] {
  const points = [
    input.intentLabel ? `Intent: ${input.intentLabel}` : undefined,
    input.skillLabel ? `Skill: ${input.skillLabel}` : undefined,
    input.priority ? `Priorität: ${capitalize(input.priority)}` : undefined,
    input.gmail?.subject ? `Betreff: ${input.gmail.subject}` : undefined,
    input.summary,
  ].filter(Boolean) as string[];

  return points.slice(0, 4);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function resolveSkill(input: DecisionInput): HelpySkill {
  if (input.skill) return input.skill;
  return skillFromLabel(input.skillLabel) ?? "real-estate";
}

function isHelpySkill(value?: string): value is HelpySkill {
  return (
    value === "real-estate" ||
    value === "construction" ||
    value === "consulting-legal"
  );
}

function hasEmailBackedQuelle(quelle?: string): boolean {
  return quelle === "Gmail" || isPlatformRealEstateQuelle(quelle ?? "");
}

export function buildDecisionInputFromListe(vorgang: ListeVorgang): DecisionInput {
  const skill =
    (isHelpySkill(vorgang.skill) ? vorgang.skill : undefined) ??
    skillFromLabel(vorgang.skillLabel);

  return {
    vorgangId: vorgang.id,
    skill,
    skillLabel: vorgang.skillLabel,
    intent: vorgang.intent ?? vorgang.typ,
    intentLabel: vorgang.intentLabel ?? vorgang.typ,
    priority: vorgang.prioritaet,
    summary: vorgang.summary,
    recommendedAction: vorgang.recommendedNextStep ?? vorgang.helpyEmpfehlung,
    gmail: hasEmailBackedQuelle(vorgang.quelle)
      ? {
          subject: vorgang.titel,
          from: vorgang.from ?? vorgang.kunde,
          snippet: vorgang.snippet,
          threadId: vorgang.threadId,
          date: vorgang.emailDate,
        }
      : undefined,
    memoryEntries: skill ? getSkillMemories(skill).slice(0, 2) : [],
  };
}

export function buildDecisionInputFromBundle(
  bundle: GmailVorgangBundle
): DecisionInput {
  const base = buildDecisionInputFromListe(bundle.liste);

  return {
    ...base,
    brainResult: bundle.brain,
    gmail: {
      subject: bundle.message.subject,
      from: bundle.brain.from,
      snippet: bundle.message.snippet,
      threadId: bundle.brain.threadId,
      date: bundle.message.date,
    },
    recommendedAction: bundle.brain.recommendedAction,
    summary: bundle.brain.summary,
  };
}

export function buildDecisionInputFromWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): DecisionInput {
  if (liste) {
    return buildDecisionInputFromListe(liste);
  }

  const skill = vorgang.skill;

  return {
    vorgangId: vorgang.id,
    skill,
    skillLabel: undefined,
    intent: vorgang.aufgabe.kategorie,
    intentLabel: vorgang.kopfzeile?.intentLabel ?? vorgang.aufgabe.kategorie,
    priority: mapWorkspacePriority(vorgang.kopfzeile?.prioritaetLabel),
    summary: vorgang.letzteEmail.zusammenfassung,
    recommendedAction: vorgang.helpy.empfehlung ?? vorgang.aufgabe.empfohleneAktion,
    gmail:
      hasEmailBackedQuelle(vorgang.kopfzeile?.quelle)
        ? {
            subject: vorgang.letzteEmail.betreff,
            from: vorgang.letzteEmail.absender,
            snippet: vorgang.letzteEmail.inhalt,
          }
        : undefined,
    memoryEntries: getSkillMemories(skill).slice(0, 2),
  };
}

function mapWorkspacePriority(label?: string): DecisionInput["priority"] {
  const normalized = (label ?? "").toLowerCase();
  if (normalized.includes("kritisch")) return "kritisch";
  if (normalized.includes("hoch")) return "hoch";
  if (normalized.includes("niedrig")) return "niedrig";
  return "mittel";
}

export function buildDecisionContext(input: DecisionInput): DecisionContext {
  const skill = resolveSkill(input);
  const kunde = input.gmail?.from
    ? extractSenderName(input.gmail.from)
    : "Unbekannt";

  const workflowTemplate =
    input.workflowTemplate ??
    selectWorkflowTemplate({
      vorgangId: input.vorgangId,
      skill,
      intent: input.intent,
      titel: input.gmail?.subject ?? input.summary ?? "Vorgang",
    });

  return {
    ...input,
    skill,
    kunde,
    recognized: buildRecognized(input),
    workflowTemplate,
    workflowName: workflowTemplate.name,
    memoryEntries: input.memoryEntries ?? getSkillMemories(skill).slice(0, 2),
    companyKnowledgeHint: buildCompanyKnowledgeDecisionSupplement({
      intent: input.intent,
      intentLabel: input.intentLabel,
    }),
  };
}
