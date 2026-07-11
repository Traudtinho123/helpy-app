import {
  AUTOPILOT_EMAIL_COUNT,
  AUTOPILOT_RELEVANT_COUNT,
  createInitialVorgaenge,
  getVorgangSummary,
  MOCK_INCOMING_EMAILS,
} from "@/features/brain/services/autopilot/mock-vorgaenge";
import { globalAutopilotQueue } from "@/features/brain/services/autopilot/queue";
import type {
  ActivityTimelineEntry,
  AutopilotRunOptions,
  AutopilotRunState,
  PreparedVorgang,
} from "@/features/brain/services/autopilot/types";

export const PANEL_SUMMARY_MESSAGE = `Ich habe ${AUTOPILOT_EMAIL_COUNT} neue E-Mails geprüft und daraus ${AUTOPILOT_RELEVANT_COUNT} relevante Vorgänge vorbereitet.`;

export const PANEL_RECOMMENDATION =
  "Ich würde zuerst die beiden Angebotsanfragen bearbeiten.";

function createIdleState(): AutopilotRunState {
  return {
    status: "idle",
    totalEmails: AUTOPILOT_EMAIL_COUNT,
    relevantVorgaenge: AUTOPILOT_RELEVANT_COUNT,
    scannedCount: 0,
    visibleVorgangIds: [],
    vorgaenge: [],
    summary: getVorgangSummary(),
    timeline: [],
    panelMessage: "",
    panelRecommendation: PANEL_RECOMMENDATION,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildTimeline(
  vorgaenge: PreparedVorgang[],
  visibleCount: number
): ActivityTimelineEntry[] {
  const entries: ActivityTimelineEntry[] = [
    {
      id: "scan-start",
      time: "09:14",
      label: `${AUTOPILOT_EMAIL_COUNT} neue E-Mails erkannt`,
    },
    {
      id: "scan-analyse",
      time: "09:14",
      label: "Analyse gestartet",
    },
  ];

  const visible = vorgaenge.slice(0, visibleCount);
  visible.forEach((v, index) => {
    const typLabels: Record<PreparedVorgang["typ"], string> = {
      aufgabe: "Aufgabe erstellt",
      angebot: "Angebot erkannt",
      termin: "Termin erkannt",
      rechnung: "Rechnung erkannt",
      nachricht: "Nachricht erkannt",
    };
    entries.push({
      id: `vorg-${v.id}`,
      time: index < 3 ? "09:15" : "09:16",
      label: typLabels[v.typ],
    });
  });

  if (visibleCount === vorgaenge.length) {
    entries.push({
      id: "scan-done",
      time: "09:16",
      label: "Vorgänge vorbereitet",
    });
  }

  return entries;
}

export class HelpyAutopilot {
  private running = false;
  private abortRequested = false;

  get isRunning(): boolean {
    return this.running;
  }

  abort(): void {
    this.abortRequested = true;
  }

  async run(options?: AutopilotRunOptions): Promise<AutopilotRunState> {
    if (this.running) {
      this.abort();
      await delay(50);
    }

    this.running = true;
    this.abortRequested = false;
    const stepDelayMs = options?.stepDelayMs ?? 400;
    const vorgaenge = createInitialVorgaenge();

    globalAutopilotQueue.clear();
    for (const email of MOCK_INCOMING_EMAILS) {
      globalAutopilotQueue.enqueue({
        id: email.id,
        type: "support_anfrage",
        title: email.betreff,
        description: email.absender,
        absender: email.absender,
        betreff: email.betreff,
        receivedAt: email.receivedAt,
      });
    }

    const emit = (state: AutopilotRunState) => {
      options?.onUpdate?.(state);
    };

    emit({
      status: "running",
      totalEmails: AUTOPILOT_EMAIL_COUNT,
      relevantVorgaenge: AUTOPILOT_RELEVANT_COUNT,
      scannedCount: 0,
      visibleVorgangIds: [],
      vorgaenge,
      summary: getVorgangSummary(),
      timeline: [{ id: "start", time: "09:14", label: "Neue E-Mails erkannt" }],
      panelMessage: "Ich prüfe gerade 10 neue E-Mails…",
      panelRecommendation: "",
    });

    for (let i = 1; i <= AUTOPILOT_EMAIL_COUNT; i++) {
      if (this.abortRequested) {
        this.running = false;
        return createIdleState();
      }

      await delay(stepDelayMs / 2);

      emit({
        status: "running",
        totalEmails: AUTOPILOT_EMAIL_COUNT,
        relevantVorgaenge: AUTOPILOT_RELEVANT_COUNT,
        scannedCount: i,
        visibleVorgangIds: [],
        vorgaenge,
        summary: getVorgangSummary(),
        timeline: buildTimeline(vorgaenge, 0),
        panelMessage: `Ich lese E-Mail ${i} von ${AUTOPILOT_EMAIL_COUNT}…`,
        panelRecommendation: "",
      });
    }

    await delay(stepDelayMs);

    emit({
      status: "running",
      totalEmails: AUTOPILOT_EMAIL_COUNT,
      relevantVorgaenge: AUTOPILOT_RELEVANT_COUNT,
      scannedCount: AUTOPILOT_EMAIL_COUNT,
      visibleVorgangIds: [],
      vorgaenge,
      summary: getVorgangSummary(),
      timeline: buildTimeline(vorgaenge, 0),
      panelMessage: "Ich erkenne relevante Vorgänge…",
      panelRecommendation: "",
    });

    const visibleIds: string[] = [];
    for (let i = 0; i < vorgaenge.length; i++) {
      if (this.abortRequested) {
        this.running = false;
        return createIdleState();
      }

      visibleIds.push(vorgaenge[i].id);
      await delay(stepDelayMs);

      emit({
        status: "running",
        totalEmails: AUTOPILOT_EMAIL_COUNT,
        relevantVorgaenge: AUTOPILOT_RELEVANT_COUNT,
        scannedCount: AUTOPILOT_EMAIL_COUNT,
        visibleVorgangIds: [...visibleIds],
        vorgaenge,
        summary: getVorgangSummary(),
        timeline: buildTimeline(vorgaenge, visibleIds.length),
        panelMessage:
          i < 2
            ? "Angebotsanfragen werden priorisiert…"
            : "Vorgänge werden vorbereitet…",
        panelRecommendation: "",
      });
    }

    const finalState: AutopilotRunState = {
      status: "completed",
      totalEmails: AUTOPILOT_EMAIL_COUNT,
      relevantVorgaenge: AUTOPILOT_RELEVANT_COUNT,
      scannedCount: AUTOPILOT_EMAIL_COUNT,
      visibleVorgangIds: vorgaenge.map((v) => v.id),
      vorgaenge,
      summary: getVorgangSummary(),
      timeline: buildTimeline(vorgaenge, vorgaenge.length),
      panelMessage: PANEL_SUMMARY_MESSAGE,
      panelRecommendation: PANEL_RECOMMENDATION,
    };

    emit(finalState);
    this.running = false;
    return finalState;
  }
}

export const helpyAutopilot = new HelpyAutopilot();

export async function runAutopilotPipeline(
  options?: AutopilotRunOptions
): Promise<AutopilotRunState> {
  return helpyAutopilot.run(options);
}

export { createIdleState as createAutopilotIdleState };

export function markVorgangErledigt(
  vorgaenge: PreparedVorgang[],
  id: string
): PreparedVorgang[] {
  return vorgaenge.map((v) =>
    v.id === id ? { ...v, status: "erledigt" as const } : v
  );
}

export function markVorgangGeoeffnet(
  vorgaenge: PreparedVorgang[],
  id: string
): PreparedVorgang[] {
  return vorgaenge.map((v) =>
    v.id === id ? { ...v, status: "geoeffnet" as const } : v
  );
}
