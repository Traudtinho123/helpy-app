import type { HelpyWorkStep } from "@/features/workflow/services/helpy-work/types";

export const HELPY_WORK_STEP_DEFINITIONS: Omit<HelpyWorkStep, "status">[] = [
  {
    id: "emails",
    label: "Neue E-Mails prüfen",
    panelMessage: "Ich prüfe gerade neue E-Mails…",
  },
  {
    id: "calendar",
    label: "Kalender prüfen",
    panelMessage: "Ich schaue, ob Termine anstehen…",
  },
  {
    id: "offers",
    label: "Angebote prüfen",
    panelMessage: "Ich prüfe offene Angebotsanfragen…",
  },
  {
    id: "invoices",
    label: "Rechnungen prüfen",
    panelMessage: "Ich prüfe eingegangene Rechnungen…",
  },
  {
    id: "customers",
    label: "Kunden prüfen",
    panelMessage: "Ich aktualisiere Kundeninformationen…",
  },
  {
    id: "tasks",
    label: "Aufgaben aktualisieren",
    panelMessage: "Ich aktualisiere deine Aufgaben…",
  },
  {
    id: "daily_plan",
    label: "Tagesplanung neu berechnen",
    panelMessage: "Ich berechne deinen Tagesplan neu…",
  },
];

export function createInitialWorkSteps(): HelpyWorkStep[] {
  return HELPY_WORK_STEP_DEFINITIONS.map((step) => ({
    ...step,
    status: "pending",
  }));
}
