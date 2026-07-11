"use client";

import { Building2, Calendar } from "lucide-react";
import { SectionCard, FieldGrid } from "@/features/workspace/components/workspace-sections";
import { useWorkspaceContext } from "@/features/workspace/context";

export function PlatformObjektWorkspaceCard() {
  const { object, mail, listeVorgang } = useWorkspaceContext();
  const platform = object?.platform;

  const objekt = platform?.objekt ?? null;
  const adresse = platform?.adresse ?? null;
  const link = platform?.link ?? null;
  const nachricht = platform?.nachricht ?? null;

  const fields = [
    objekt ? { label: "Objekt", value: objekt } : null,
    adresse ? { label: "Adresse", value: adresse } : null,
    link ? { label: "Objekt-Link", value: link, highlight: true } : null,
    !objekt && !adresse && nachricht
      ? { label: "Nachricht", value: nachricht }
      : null,
    !objekt && !adresse && !nachricht && mail.summary
      ? { label: "Zusammenfassung", value: mail.summary }
      : null,
    !objekt && !adresse && !nachricht && !mail.summary && mail.snippet
      ? { label: "Nachricht", value: mail.snippet }
      : null,
    !objekt && !adresse && !nachricht && !mail.summary && !mail.snippet && listeVorgang?.summary
      ? { label: "Zusammenfassung", value: listeVorgang.summary }
      : null,
    !objekt && !adresse && !nachricht && !mail.summary && !mail.snippet && !listeVorgang?.summary && listeVorgang?.snippet
      ? { label: "Nachricht", value: listeVorgang.snippet }
      : null,
  ].filter((field): field is { label: string; value: string; highlight?: boolean } =>
    field !== null
  );

  if (fields.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Objekt" icon={Building2}>
      <FieldGrid fields={fields} />
    </SectionCard>
  );
}

export function PlatformBesichtigungWorkspaceCard() {
  const { appointment, object } = useWorkspaceContext();
  const besichtigung =
    appointment.terminwunsch ?? object?.platform?.besichtigung ?? null;

  if (!besichtigung) {
    return null;
  }

  return (
    <SectionCard title="Besichtigung" icon={Calendar}>
      <FieldGrid fields={[{ label: "Terminwunsch", value: besichtigung, highlight: true }]} />
    </SectionCard>
  );
}

/** @deprecated Use PlatformObjektWorkspaceCard + PlatformBesichtigungWorkspaceCard */
export function PlatformInquiryWorkspaceCard() {
  return (
    <>
      <PlatformObjektWorkspaceCard />
      <PlatformBesichtigungWorkspaceCard />
    </>
  );
}
