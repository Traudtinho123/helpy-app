import { getAppointmentSuggestion, subscribeAppointmentSuggestion } from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  getDocumentsForCustomer,
  getPreparedDocumentForVorgang,
  subscribeDocuments,
} from "@/features/documents/services/document-engine";
import { DOCUMENT_STATUS_LABELS } from "@/features/documents/services/types";
import { getFollowUpSnapshot, subscribeFollowUp } from "@/features/followup/services/followup-store";
import { subscribeKundenakte } from "@/features/kundenakte/services/kundenakte-store";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { getObjektPath } from "@/features/portfolio/services/object-navigation";
import { getDokumentePath } from "@/features/workspace/services/navigation/entity-navigation";
import { peekRealEstateObjectByVorgangId, subscribeRealEstateObjects } from "@/features/real-estate/object/object-memory";
import { getReplyDraft, subscribeReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import { getWorkspacePath } from "@/features/workspace/services/workspace";

export type KundenakteWidgetId =
  | "objekte"
  | "besichtigungen"
  | "dokumente"
  | "kalender"
  | "antworten"
  | "offerten";

export type KundenakteWidgetSnapshot = {
  id: KundenakteWidgetId;
  label: string;
  status: string;
  detail: string;
  href: string;
};

export type KundenakteOpenTask = {
  id: string;
  label: string;
  detail: string;
  href: string;
  urgent?: boolean;
};

const REPLY_STATUS_LABELS = {
  vorbereitet: "Antwort vorbereitet",
  bearbeitet: "Antwort bearbeitet",
  bestaetigt: "Antwort bestätigt",
  uebernommen: "Antwort übernommen",
} as const;

function formatDocumentCount(count: number): string {
  if (count === 0) return "Keine Dokumente";
  if (count === 1) return "1 Dokument";
  return `${count} Dokumente`;
}

export const EMPTY_KUNDENAKTE_WIDGETS: readonly KundenakteWidgetSnapshot[] =
  Object.freeze([]);

export const EMPTY_KUNDENAKTE_OPEN_TASKS: readonly KundenakteOpenTask[] =
  Object.freeze([]);

type CachedWidgetSnapshots = {
  fingerprint: string;
  value: readonly KundenakteWidgetSnapshot[];
};

type CachedOpenTasks = {
  fingerprint: string;
  value: readonly KundenakteOpenTask[];
};

const widgetSnapshotCache = new Map<string, CachedWidgetSnapshots>();
const openTasksCache = new Map<string, CachedOpenTasks>();

function widgetCacheKey(vorgangId: string, customerEmail: string): string {
  return `${vorgangId}:${customerEmail.trim().toLowerCase()}`;
}

function buildWidgetSourceFingerprint(
  vorgangId: string,
  customerEmail: string
): string {
  const object = peekRealEstateObjectByVorgangId(vorgangId);
  const appointment = getAppointmentSuggestion(vorgangId);
  const documents = getDocumentsForCustomer({
    vorgangId,
    email: customerEmail,
  });
  const replyDraft = getReplyDraft(vorgangId);
  const offerte =
    getPreparedDocumentForVorgang(vorgangId, "offerte") ??
    documents.find((document) => document.typeId === "offerte");

  return JSON.stringify({
    objectId: object?.objectId ?? null,
    objectUpdatedAt: object?.updatedAt ?? null,
    objectTitle: object?.titel ?? null,
    objectAdresse: object?.adresse ?? null,
    appointmentStatus: appointment?.status ?? null,
    appointmentSlotCount: appointment?.slots.length ?? 0,
    selectedSlotId: appointment?.selectedSlotId ?? null,
    viewingDateLabel: appointment?.viewingConfirmation?.dateLabel ?? null,
    appointmentObjekt: appointment?.objekt ?? null,
    documentCount: documents.length,
    firstDocumentId: documents[0]?.id ?? null,
    firstDocumentTitle: documents[0]?.title ?? null,
    replyStatus: replyDraft?.status ?? null,
    replySubject: replyDraft?.subject ?? null,
    offerteId: offerte?.id ?? null,
    offerteStatus: offerte?.status ?? null,
    offerteTitle: offerte?.title ?? null,
  });
}

function buildOpenTasksFingerprint(
  vorgangId: string,
  kundenakte: Kundenakte
): string {
  const replyDraft = getReplyDraft(vorgangId);
  const appointment = getAppointmentSuggestion(vorgangId);
  const followUp = getFollowUpSnapshot(vorgangId);

  return JSON.stringify({
    kundenakteStatus: kundenakte.status,
    kundenakteStatusLabel: kundenakte.statusLabel,
    replyStatus: replyDraft?.status ?? null,
    replySubject: replyDraft?.subject ?? null,
    appointmentStatus: appointment?.status ?? null,
    appointmentSlotCount: appointment?.slots.length ?? 0,
    followUpId: followUp?.id ?? null,
    followUpStatus: followUp?.status ?? null,
    followUpRecommendation: followUp?.recommendation ?? null,
  });
}

export function invalidateKundenakteDashboardCache(vorgangId?: string): void {
  invalidateKundenakteWidgetCache(vorgangId);
  invalidateKundenakteOpenTasksCache(vorgangId);
}

export function invalidateKundenakteWidgetCache(vorgangId?: string): void {
  if (!vorgangId) {
    widgetSnapshotCache.clear();
    return;
  }

  for (const key of widgetSnapshotCache.keys()) {
    if (key.startsWith(`${vorgangId}:`)) {
      widgetSnapshotCache.delete(key);
    }
  }
}

export function invalidateKundenakteOpenTasksCache(vorgangId?: string): void {
  if (!vorgangId) {
    openTasksCache.clear();
    return;
  }

  openTasksCache.delete(vorgangId);
}

export function getKundenakteWidgetSnapshots(
  vorgangId: string,
  customerEmail: string
): readonly KundenakteWidgetSnapshot[] {
  if (!vorgangId || !customerEmail.trim()) {
    return EMPTY_KUNDENAKTE_WIDGETS;
  }

  const cacheKey = widgetCacheKey(vorgangId, customerEmail);
  const fingerprint = buildWidgetSourceFingerprint(vorgangId, customerEmail);
  const cached = widgetSnapshotCache.get(cacheKey);

  if (cached?.fingerprint === fingerprint) {
    return cached.value;
  }

  const value = Object.freeze(
    buildKundenakteWidgetSnapshots(vorgangId, customerEmail)
  );
  widgetSnapshotCache.set(cacheKey, { fingerprint, value });
  return value;
}

export function getKundenakteOpenTasks(
  vorgangId: string,
  kundenakte: Kundenakte
): readonly KundenakteOpenTask[] {
  const fingerprint = buildOpenTasksFingerprint(vorgangId, kundenakte);
  const cached = openTasksCache.get(vorgangId);

  if (cached?.fingerprint === fingerprint) {
    return cached.value;
  }

  const value = Object.freeze(buildKundenakteOpenTasks(vorgangId, kundenakte));
  openTasksCache.set(vorgangId, { fingerprint, value });
  return value;
}

export function buildKundenakteWidgetSnapshots(
  vorgangId: string,
  customerEmail: string
): KundenakteWidgetSnapshot[] {
  const workspaceHref = getWorkspacePath(vorgangId);
  const object = peekRealEstateObjectByVorgangId(vorgangId);
  const appointment = getAppointmentSuggestion(vorgangId);
  const documents = getDocumentsForCustomer({
    vorgangId,
    email: customerEmail,
  });
  const replyDraft = getReplyDraft(vorgangId);
  const offerte =
    getPreparedDocumentForVorgang(vorgangId, "offerte") ??
    documents.find((document) => document.typeId === "offerte");

  const objectStatus = object
    ? object.titel || object.adresse || "Objekt verknüpft"
    : "Noch kein Objekt";
  const objectDetail = object
    ? [object.adresse, object.ort].filter(Boolean).join(", ") || object.quelle
    : "HELPY verknüpft Objekte aus Plattform-Anfragen";

  let besichtigungStatus = "Keine Besichtigung";
  let besichtigungDetail = "Termine werden bei Anfrage vorbereitet";
  if (appointment?.status === "bestaetigt") {
    besichtigungStatus = "Besichtigung bestätigt";
    besichtigungDetail =
      appointment.viewingConfirmation?.dateLabel ??
      appointment.date ??
      appointment.title;
  } else if (appointment?.status === "vorbereitet" && appointment.slots.length > 0) {
    besichtigungStatus = "Terminvorschläge bereit";
    besichtigungDetail = `${appointment.slots.length} freie Zeiten vorgeschlagen`;
  } else if (appointment?.status === "loading") {
    besichtigungStatus = "Termine werden geladen";
    besichtigungDetail = "Kalender wird geprüft";
  } else if (appointment?.objekt) {
    besichtigungStatus = "Besichtigung offen";
    besichtigungDetail = appointment.objekt;
  }

  let kalenderStatus = "Kein Termin";
  let kalenderDetail = "Besichtigungen erscheinen im Kalender";
  if (appointment?.status === "bestaetigt") {
    kalenderStatus = "Termin im Kalender";
    kalenderDetail =
      appointment.viewingConfirmation?.dateLabel ??
      appointment.slots.find((slot) => slot.id === appointment.selectedSlotId)
        ?.label ??
      appointment.date;
  } else if (appointment?.status === "vorbereitet" && appointment.slots.length > 0) {
    kalenderStatus = "Termin auswählen";
    kalenderDetail = "Besichtigung noch nicht gespeichert";
  }

  const replyStatus = replyDraft
    ? REPLY_STATUS_LABELS[replyDraft.status]
    : "Keine Antwort";
  const replyDetail = replyDraft
    ? replyDraft.subject
    : "Antwort wird bei Bedarf vorbereitet";

  const offerteStatus = offerte ? offerte.title : "Keine Offerte";
  const offerteDetail = offerte
    ? `${offerte.typeLabel} · ${DOCUMENT_STATUS_LABELS[offerte.status]}`
    : "Offerte wird bei Bedarf vorbereitet";

  const latestDocument = documents[0];

  return [
    {
      id: "objekte",
      label: "Objekte",
      status: objectStatus,
      detail: objectDetail,
      href: object
        ? getObjektPath(object.objectId, { from: "kunde", vorgangId })
        : workspaceHref,
    },
    {
      id: "besichtigungen",
      label: "Besichtigungen",
      status: besichtigungStatus,
      detail: besichtigungDetail,
      href: `/kalender?vorgang=${encodeURIComponent(vorgangId)}&focus=besichtigung`,
    },
    {
      id: "dokumente",
      label: "Dokumente",
      status: formatDocumentCount(documents.length),
      detail: latestDocument?.title ?? "Exposé, Verträge und Vorlagen",
      href: getDokumentePath({
        vorgangId,
        focus: "dokument",
      }),
    },
    {
      id: "kalender",
      label: "Kalender",
      status: kalenderStatus,
      detail: kalenderDetail,
      href: `/kalender?vorgang=${encodeURIComponent(vorgangId)}&focus=besichtigung`,
    },
    {
      id: "antworten",
      label: "Antworten",
      status: replyStatus,
      detail: replyDetail,
      href: `${workspaceHref}?focus=antwort`,
    },
    {
      id: "offerten",
      label: "Offerten",
      status: offerteStatus,
      detail: offerteDetail,
      href: `/dokumente?vorgang=${encodeURIComponent(vorgangId)}&focus=offerte`,
    },
  ];
}

export function buildKundenakteOpenTasks(
  vorgangId: string,
  kundenakte: Kundenakte
): KundenakteOpenTask[] {
  const tasks: KundenakteOpenTask[] = [];
  const workspaceHref = getWorkspacePath(vorgangId);

  if (kundenakte.status !== "bestaetigt") {
    tasks.push({
      id: "kundenakte-bestaetigen",
      label: "Kundenakte prüfen",
      detail: kundenakte.statusLabel,
      href: workspaceHref,
      urgent: kundenakte.status === "vorbereitet",
    });
  }

  const replyDraft = getReplyDraft(vorgangId);
  if (replyDraft && replyDraft.status === "vorbereitet") {
    tasks.push({
      id: "antwort-pruefen",
      label: "Antwort prüfen",
      detail: replyDraft.subject,
      href: `${workspaceHref}?focus=antwort`,
    });
  }

  const appointment = getAppointmentSuggestion(vorgangId);
  if (
    appointment?.status === "vorbereitet" &&
    appointment.slots.length > 0
  ) {
    tasks.push({
      id: "termin-pruefen",
      label: "Terminvorschläge prüfen",
      detail: `${appointment.slots.length} Zeiten für ${appointment.objekt || "Besichtigung"}`,
      href: `/kalender?vorgang=${encodeURIComponent(vorgangId)}&focus=besichtigung`,
    });
  }

  const followUp = getFollowUpSnapshot(vorgangId);
  if (followUp && followUp.status !== "abgeschlossen") {
    tasks.push({
      id: `followup-${followUp.id}`,
      label: "Follow-up offen",
      detail: followUp.recommendation,
      href: followUp.href,
      urgent: followUp.status === "dringend",
    });
  }

  return tasks;
}

export function subscribeKundenakteWidgets(listener: () => void): () => void {
  const onStoreChange = () => {
    const hadCachedWidgets = widgetSnapshotCache.size > 0;
    invalidateKundenakteWidgetCache();

    if (!hadCachedWidgets) {
      return;
    }

    listener();
  };

  const unsubObjects = subscribeRealEstateObjects(onStoreChange);
  const unsubDocuments = subscribeDocuments(onStoreChange);
  const unsubReply = subscribeReplyDraft(onStoreChange);
  const unsubAppointment = subscribeAppointmentSuggestion(onStoreChange);

  return () => {
    unsubObjects();
    unsubDocuments();
    unsubReply();
    unsubAppointment();
  };
}

export function subscribeKundenakteOpenTasks(listener: () => void): () => void {
  const onStoreChange = () => {
    const hadCachedTasks = openTasksCache.size > 0;
    invalidateKundenakteOpenTasksCache();

    if (!hadCachedTasks) {
      return;
    }

    listener();
  };

  const unsubFollowUp = subscribeFollowUp(onStoreChange);
  const unsubReply = subscribeReplyDraft(onStoreChange);
  const unsubAppointment = subscribeAppointmentSuggestion(onStoreChange);
  const unsubKundenakte = subscribeKundenakte(onStoreChange);

  return () => {
    unsubFollowUp();
    unsubReply();
    unsubAppointment();
    unsubKundenakte();
  };
}
