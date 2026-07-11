import { analyzeEmailContent } from "@/features/brain/services/helpy-brain/email-analyzer";
import { createDailyPlan } from "@/features/brain/services/helpy-brain/daily-planner";
import {
  runBrainOnConnectQueue,
  type BrainQueueProcessingResult,
} from "@/features/platforms/services/connect";
import {
  runBrainV2,
  type BrainV2Result,
} from "@/features/brain/services/brain-v2";
import { getConnectEventQueue } from "@/features/platforms/services/connect/connect-engine";
import type {
  BrainEmailInput,
  DailyPlan,
  EmailAnalysisResult,
  GenerateDailyPlanOptions,
} from "@/features/brain/services/helpy-brain/types";

/** Demo-E-Mail für HELPY Brain v0.2 */
export const DEMO_BRAIN_EMAIL: BrainEmailInput = {
  id: "brain-demo-1",
  betreff: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
  absender: "Thomas Müller",
  absenderEmail: "thomas.mueller@weber-co.de",
  empfaenger: "Frau Traud",
  inhalt: `Guten Tag Frau Traut,
wir benötigen für unser neues Büro 45 Arbeitsplätze inklusive Schreibtischen, Stühlen und Lieferung bis Freitag. Bitte senden Sie uns ein verbindliches Angebot.
Viele Grüße
Thomas Müller`,
  erhaltenAm: new Date().toISOString(),
};

export type AnalyzeEmailOptions = {
  /** Simulierte Verarbeitungszeit in ms (v0.2 Mock) */
  delayMs?: number;
};

/**
 * Zentrale HELPY Brain Analyse-Funktion.
 * v0.2: Lokale Mock-Logik — später OpenAI / Gmail / Kalender.
 */
export async function analyzeEmail(
  email: BrainEmailInput,
  options?: AnalyzeEmailOptions
): Promise<EmailAnalysisResult> {
  const delayMs = options?.delayMs ?? 600;

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return analyzeEmailContent(email);
}

/** Synchroner Alias für Tests und direkte Aufrufe */
export function analyzeEmailSync(email: BrainEmailInput): EmailAnalysisResult {
  return analyzeEmailContent(email);
}

export class HelpyBrain {
  async analyzeEmail(
    email: BrainEmailInput,
    options?: AnalyzeEmailOptions
  ): Promise<EmailAnalysisResult> {
    return analyzeEmail(email, options);
  }

  async generateDailyPlan(
    options?: GenerateDailyPlanOptions
  ): Promise<DailyPlan> {
    return generateDailyPlan(options);
  }

  /**
   * Verarbeitet die HELPY Connect Event Queue.
   * v1: Mock-Routing — später echte Connector-Events + KI.
   */
  processConnectQueue(): BrainQueueProcessingResult {
    return runBrainOnConnectQueue();
  }

  /** Brain v2 — PreparedWorkItems aus Connect Events */
  processConnectEventsV2(): BrainV2Result {
    return runBrainV2(getConnectEventQueue().getAll());
  }
}

export const helpyBrain = new HelpyBrain();

/**
 * Erstellt einen intelligenten Tagesplan aus Mock-Daten.
 * v0.3: Lokale Priority-Engine — später Gmail, Kalender, OpenAI.
 */
export async function generateDailyPlan(
  options?: GenerateDailyPlanOptions
): Promise<DailyPlan> {
  const delayMs = options?.delayMs ?? 0;

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return createDailyPlan(undefined, options?.userName);
}

/** Synchroner Alias */
export function generateDailyPlanSync(
  options?: Pick<GenerateDailyPlanOptions, "userName">
): DailyPlan {
  return createDailyPlan(undefined, options?.userName);
}

/**
 * HELPY Brain ← Connect Pipeline (v1 Mock-Routing)
 */
export function processConnectEventQueueForBrain(): BrainQueueProcessingResult {
  return runBrainOnConnectQueue();
}

/**
 * HELPY Brain v2 — versteht Connect-Events und bereitet Vorgänge vor.
 */
export function processConnectEventsWithBrainV2(): BrainV2Result {
  return runBrainV2(getConnectEventQueue().getAll());
}
