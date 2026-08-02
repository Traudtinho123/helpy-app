import type { CreateVorgangInput } from "@/features/vorgaenge/types/create-vorgang-types";
import { insertNotification } from "@/lib/notifications/notification-repository";
import type { NotificationPriority } from "@/lib/notifications/notification-types";

function workspaceLink(vorgangId: string): string {
  return `/workspace/${vorgangId}`;
}

function isViewingRequest(input: CreateVorgangInput): boolean {
  const haystack = `${input.titel} ${input.inhalt}`.toLowerCase();
  return (
    haystack.includes("besichtigung") ||
    haystack.includes("terminwunsch") ||
    haystack.includes("besichtigungstermin")
  );
}

export async function createNotificationsForNewVorgang(input: {
  vorgangId: string;
  createInput: CreateVorgangInput;
  created: boolean;
}): Promise<void> {
  if (!input.created) return;

  const { createInput, vorgangId } = input;
  const link = workspaceLink(vorgangId);
  const customerLabel =
    createInput.absender_name?.trim() ||
    createInput.absender_email?.trim() ||
    "Unbekannt";
  const beschreibung = `${customerLabel} · ${createInput.titel.trim()}`;

  const tasks: Array<{
    typ: string;
    titel: string;
    prioritaet: NotificationPriority;
  }> = [];

  if (createInput.source === "helpy_phone") {
    tasks.push({
      typ: "voice_anruf",
      titel: "📞 Anruf eingegangen",
      prioritaet: "wichtig",
    });
  }

  if (
    createInput.prioritaet === "hoch" ||
    createInput.prioritaet === "kritisch"
  ) {
    tasks.push({
      typ: "vorgang_prioritaet_hoch",
      titel:
        createInput.prioritaet === "kritisch"
          ? "🚨 Kritischer Vorgang"
          : "⚡ Vorgang mit hoher Priorität",
      prioritaet: "wichtig",
    });
  }

  if (isViewingRequest(createInput)) {
    tasks.push({
      typ: "besichtigungsanfrage",
      titel: "🏠 Neue Besichtigungsanfrage",
      prioritaet: "wichtig",
    });
  }

  await Promise.all(
    tasks.map((task) =>
      insertNotification({
        company_id: createInput.company_id,
        typ: task.typ,
        titel: task.titel,
        beschreibung,
        link,
        prioritaet: task.prioritaet,
      })
    )
  );
}
