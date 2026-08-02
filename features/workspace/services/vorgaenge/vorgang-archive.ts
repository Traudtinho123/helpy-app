import { isHelpyPhoneArchiveVorgang } from "@/features/voice/services/helpy-phone-detector";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import {
  inferArchiveCategoryFromText,
  type VorgangArchiveCategory,
} from "@/features/mail/services/vorgang-classification-types";
import type {
  ArchiveVorgangFilter,
  RealVorgangFilter,
  Vorgang,
} from "@/features/workspace/services/vorgaenge/types";
import {
  getEffectiveVorgangStatus,
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
  isVorgangErledigt,
} from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import {
  isPlatformInquiryVorgang,
  isTerminAnfrageVorgang,
} from "@/features/workspace/services/vorgaenge/mock-vorgaenge";

export function isZuArchivierenVorgang(vorgang: Vorgang): boolean {
  return (
    vorgang.status === "zu_archivieren" ||
    getEffectiveVorgangStatus(vorgang) === "zu_archivieren"
  );
}

export function isEchterVorgang(vorgang: Vorgang): boolean {
  if (isHelpyReportVorgang(vorgang)) return false;
  if (isHelpyPhoneArchiveVorgang(vorgang)) return false;
  return !isZuArchivierenVorgang(vorgang);
}

export function resolveArchiveCategory(vorgang: Vorgang): VorgangArchiveCategory {
  if (vorgang.archiveCategory) return vorgang.archiveCategory;

  const label = (vorgang.intentLabel ?? "").toLowerCase();
  if (label.includes("newsletter")) return "newsletter";
  if (label.includes("werbung")) return "werbung";
  if (label.includes("system")) return "system";

  return inferArchiveCategoryFromText({
    from: vorgang.from ?? vorgang.kunde,
    subject: vorgang.titel,
    snippet: vorgang.snippet ?? vorgang.summary,
  });
}

export function filterEchteVorgaenge(
  vorgaenge: Vorgang[],
  filter: RealVorgangFilter
): Vorgang[] {
  const echte = vorgaenge.filter(isEchterVorgang);

  if (filter === "alle") {
    return echte.filter((item) => isVorgangActiveOpen(item));
  }
  if (filter === "wartend") {
    return echte.filter((item) => isVorgangAwaitingCustomerReply(item));
  }
  if (filter === "besichtigungen") {
    return echte.filter((item) => isTerminAnfrageVorgang(item));
  }
  if (filter === "anfragen") {
    return echte.filter(
      (item) =>
        item.typ === "anfrage" ||
        item.typ === "angebotsanfrage" ||
        item.typ === "neuer_kunde" ||
        isPlatformInquiryVorgang(item)
    );
  }
  if (filter === "erledigt") {
    return echte.filter((item) => isVorgangErledigt(item));
  }

  return echte.filter((item) => getEffectiveVorgangStatus(item) === filter);
}

export function filterArchiveVorgaenge(
  vorgaenge: Vorgang[],
  filter: ArchiveVorgangFilter
): Vorgang[] {
  const archiv = vorgaenge.filter(isZuArchivierenVorgang);
  if (filter === "alle") return archiv;
  return archiv.filter((item) => resolveArchiveCategory(item) === filter);
}

export function countArchiveVorgaengeToday(vorgaenge: Vorgang[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return vorgaenge.filter((item) => {
    if (!isZuArchivierenVorgang(item)) return false;
    const received = Date.parse(item.receivedAt);
    return !Number.isNaN(received) && received >= today.getTime();
  }).length;
}

export function buildRealVorgangFilterCounts(
  vorgaenge: Vorgang[]
): Record<RealVorgangFilter, number> {
  const echte = vorgaenge.filter(isEchterVorgang);

  return {
    alle: echte.filter((item) => isVorgangActiveOpen(item)).length,
    neu: echte.filter((item) => getEffectiveVorgangStatus(item) === "neu").length,
    besichtigungen: echte.filter((item) => isTerminAnfrageVorgang(item)).length,
    anfragen: echte.filter(
      (item) =>
        item.typ === "anfrage" ||
        item.typ === "angebotsanfrage" ||
        item.typ === "neuer_kunde" ||
        isPlatformInquiryVorgang(item)
    ).length,
    in_bearbeitung: echte.filter(
      (item) => getEffectiveVorgangStatus(item) === "in_bearbeitung"
    ).length,
    wartend: echte.filter((item) => isVorgangAwaitingCustomerReply(item)).length,
    erledigt: echte.filter((item) => isVorgangErledigt(item)).length,
  };
}

export function buildArchiveVorgangFilterCounts(
  vorgaenge: Vorgang[]
): Record<ArchiveVorgangFilter, number> {
  const archiv = vorgaenge.filter(isZuArchivierenVorgang);

  return {
    alle: archiv.length,
    newsletter: archiv.filter((item) => resolveArchiveCategory(item) === "newsletter")
      .length,
    werbung: archiv.filter((item) => resolveArchiveCategory(item) === "werbung").length,
    system: archiv.filter((item) => resolveArchiveCategory(item) === "system").length,
    spam: archiv.filter((item) => resolveArchiveCategory(item) === "spam").length,
  };
}
