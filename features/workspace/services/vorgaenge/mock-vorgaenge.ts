import { getBrainV2Items } from "@/features/brain/services/brain-v2";
import { mapPreparedWorkItemsToVorgaenge } from "@/features/workspace/services/vorgaenge/brain-v2-mapper";
import { isHelpyPhoneArchiveVorgang } from "@/features/voice/services/helpy-phone-detector";
import { isHelpyReportVorgang } from "@/features/workspace/services/vorgaenge/helpy-report-detector";
import {
  getEffectiveVorgangStatus,
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
} from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import type { Vorgang, VorgangFilter } from "@/features/workspace/services/vorgaenge/types";

export function getBrainV2Vorgaenge(): Vorgang[] {
  return mapPreparedWorkItemsToVorgaenge(getBrainV2Items());
}

export { getEffectiveVorgangStatus };

function getReceivedTimestamp(vorgang: Vorgang): number {
  const raw = vorgang.emailDate ?? vorgang.receivedAt;
  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function sortHelpyReportVorgaenge(vorgaenge: Vorgang[]): Vorgang[] {
  return [...vorgaenge].sort(
    (a, b) => getReceivedTimestamp(b) - getReceivedTimestamp(a)
  );
}

export function sortHelpyPhoneVorgaenge(vorgaenge: Vorgang[]): Vorgang[] {
  return [...vorgaenge].sort(
    (a, b) => getReceivedTimestamp(b) - getReceivedTimestamp(a)
  );
}

export function isTerminAnfrageVorgang(vorgang: Vorgang): boolean {
  if (vorgang.typ === "terminwunsch") return true;
  const intent = (vorgang.intent ?? vorgang.intentLabel ?? "").toLowerCase();
  return (
    intent.includes("termin") ||
    intent.includes("besichtigung") ||
    intent.includes("reservation") ||
    intent.includes("kurs")
  );
}

export function filterVorgaenge(
  vorgaenge: Vorgang[],
  filter: VorgangFilter
): Vorgang[] {
  if (filter === "helpy_reports") {
    return sortHelpyReportVorgaenge(vorgaenge.filter((v) => isHelpyReportVorgang(v)));
  }

  if (filter === "helpy_phone") {
    return sortHelpyPhoneVorgaenge(
      vorgaenge.filter((v) => isHelpyPhoneArchiveVorgang(v))
    );
  }

  const customerVorgaenge = vorgaenge.filter(
    (v) =>
      !isHelpyReportVorgang(v) &&
      !isHelpyPhoneArchiveVorgang(v)
  );

  if (filter === "alle") {
    return customerVorgaenge.filter((v) => isVorgangActiveOpen(v));
  }
  if (filter === "wartend") {
    return customerVorgaenge.filter((v) => isVorgangAwaitingCustomerReply(v));
  }
  if (filter === "termine_anfragen") {
    return customerVorgaenge.filter((v) => isTerminAnfrageVorgang(v));
  }
  return customerVorgaenge.filter(
    (v) => getEffectiveVorgangStatus(v) === filter
  );
}

export function getVorgangFilterCounts(
  vorgaenge: Vorgang[]
): Record<VorgangFilter, number> {
  const customerVorgaenge = vorgaenge.filter(
    (v) => !isHelpyReportVorgang(v) && !isHelpyPhoneArchiveVorgang(v)
  );
  const activeOpen = customerVorgaenge.filter((v) => isVorgangActiveOpen(v));

  return {
    alle: activeOpen.length,
    neu: customerVorgaenge.filter((v) => getEffectiveVorgangStatus(v) === "neu")
      .length,
    termine_anfragen: customerVorgaenge.filter((v) => isTerminAnfrageVorgang(v))
      .length,
    in_bearbeitung: customerVorgaenge.filter(
      (v) => getEffectiveVorgangStatus(v) === "in_bearbeitung"
    ).length,
    erledigt: customerVorgaenge.filter((v) => getEffectiveVorgangStatus(v) === "erledigt")
      .length,
    wartend: customerVorgaenge.filter((v) => isVorgangAwaitingCustomerReply(v))
      .length,
    helpy_reports: vorgaenge.filter((v) => isHelpyReportVorgang(v)).length,
    helpy_phone: vorgaenge.filter((v) => isHelpyPhoneArchiveVorgang(v)).length,
  };
}

const PRIORITY_ORDER = {
  kritisch: 0,
  hoch: 1,
  mittel: 2,
  niedrig: 3,
} as const;

export function sortVorgaengeByPriority(vorgaenge: Vorgang[]): Vorgang[] {
  return [...vorgaenge].sort(
    (a, b) => PRIORITY_ORDER[a.prioritaet] - PRIORITY_ORDER[b.prioritaet]
  );
}

/** @deprecated Legacy mock — Brain v2 ist die Quelle */
export const mockVorgaenge: Vorgang[] = getBrainV2Vorgaenge();
