"use client";

import { Brain } from "lucide-react";
import { SectionCard, FieldGrid } from "@/features/workspace/components/workspace-sections";
import type {
  CustomerMemoryHistoryItem,
  CustomerMemoryProfile,
  MemoryEnrichmentHint,
} from "@/features/memory/types/customer-memory-types";

type CustomerMemoryWorkspaceSectionProps = {
  profile: CustomerMemoryProfile | null;
  hints: MemoryEnrichmentHint[];
};

function HistoryList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: CustomerMemoryHistoryItem[];
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-[12px] text-[#94A3B8]">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-[12px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-[#0F172A]">{item.title}</p>
                <span className="text-[10px] font-medium text-[#94A3B8]">
                  {item.dateLabel}
                </span>
              </div>
              {item.summary && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#64748B]">
                  {item.summary}
                </p>
              )}
              {item.status && (
                <p className="mt-1 text-[10px] font-medium text-[#2563EB]">
                  {item.status}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CustomerMemoryWorkspaceSection({
  profile,
  hints,
}: CustomerMemoryWorkspaceSectionProps) {
  if (!profile) return null;

  const { contact, history } = profile;
  const kommunikation = history.filter(
    (item) => item.type === "vorgang" || item.type === "antwort"
  );
  const angebote = history.filter((item) => item.type === "angebot");
  const rechnungen = history.filter((item) => item.type === "rechnung");
  const termine = history.filter(
    (item) =>
      item.type === "termin" ||
      item.type === "besichtigung" ||
      item.type === "baustelle"
  );

  return (
    <SectionCard title="HELPY Memory" icon={Brain}>
      <div className="space-y-5">
        {hints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hints.map((hint) => (
              <span
                key={hint.id}
                className="rounded-full border border-[#E9D5FF]/70 bg-[#FAF5FF]/80 px-3 py-1 text-[11px] font-semibold text-[#6D28D9]"
              >
                {hint.label}
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
            Kunde
          </p>
          <div className="mt-2">
            <FieldGrid
              fields={[
                { label: "Name", value: contact.name },
                { label: "Firma", value: contact.company },
                { label: "E-Mail", value: contact.email, highlight: true },
                { label: "Telefon", value: contact.phone },
                { label: "Adresse", value: contact.address },
                { label: "Skill", value: contact.skill },
                { label: "Kommunikationsstil", value: contact.communicationStyle },
                { label: "Tonalität", value: contact.tone },
              ]}
            />
          </div>
        </div>

        <HistoryList
          title="Historie"
          items={history.slice(0, 6)}
          emptyLabel="Noch keine Historie vorhanden."
        />

        <HistoryList
          title="Timeline"
          items={history.slice(0, 8)}
          emptyLabel="Noch keine Einträge in der Timeline."
        />

        <HistoryList
          title="Kommunikation"
          items={kommunikation}
          emptyLabel="Noch keine Kommunikation gespeichert."
        />

        <HistoryList
          title="Angebote"
          items={angebote}
          emptyLabel="Noch keine Angebote gespeichert."
        />

        <HistoryList
          title="Rechnungen"
          items={rechnungen}
          emptyLabel="Noch keine Rechnungen gespeichert."
        />

        <HistoryList
          title="Termine & Baustellen"
          items={termine}
          emptyLabel="Noch keine Termine oder Baustellen gespeichert."
        />

        {contact.notes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Notizen
            </p>
            <ul className="mt-2 space-y-1">
              {contact.notes.map((note) => (
                <li key={note} className="text-[12px] text-[#64748B]">
                  · {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
