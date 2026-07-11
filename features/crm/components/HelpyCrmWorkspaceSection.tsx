"use client";

import { Building2 } from "lucide-react";
import { SectionCard, FieldGrid } from "@/features/workspace/components/workspace-sections";
import type { HelpyCrmCustomer } from "@/features/crm/types/crm-types";
import type { CrmTimelineEntry } from "@/features/crm/types/crm-types";

type HelpyCrmWorkspaceSectionProps = {
  customer: HelpyCrmCustomer | null;
  isNewCustomer?: boolean;
};

function EntryList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: CrmTimelineEntry[];
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

export function HelpyCrmWorkspaceSection({
  customer,
  isNewCustomer = false,
}: HelpyCrmWorkspaceSectionProps) {
  if (!customer) return null;

  return (
    <SectionCard title="HELPY Smart CRM" icon={Building2}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#BFDBFE]/70 bg-[#EFF6FF]/80 px-3 py-1 text-[11px] font-semibold text-[#2563EB]">
            {customer.status === "neu" || isNewCustomer
              ? "Neuer Kunde"
              : "Bestandskunde"}
          </span>
          <span className="rounded-full border border-[#E9D5FF]/70 bg-[#FAF5FF]/80 px-3 py-1 text-[11px] font-semibold text-[#6D28D9]">
            {customer.vorgangIds.length} Vorgänge
          </span>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
            Kunde
          </p>
          <div className="mt-2">
            <FieldGrid
              fields={[
                { label: "Ansprechpartner", value: customer.ansprechpartner },
                { label: "Firma", value: customer.firma },
                { label: "E-Mail", value: customer.email, highlight: true },
                { label: "Telefon", value: customer.telefon },
                { label: "Adresse", value: customer.adresse },
                { label: "Branche", value: customer.branche },
                { label: "Skill", value: customer.skill },
              ]}
            />
          </div>
        </div>

        <EntryList
          title="Projekte"
          items={customer.projects.map((project) => ({
            id: project.id,
            type: "projekt",
            title: project.title,
            date: project.startedAt,
            dateLabel: project.status,
            status: project.status,
            vorgangId: project.vorgangId,
          }))}
          emptyLabel="Noch keine Projekte erfasst."
        />

        <EntryList
          title="Timeline"
          items={customer.timeline.slice(0, 8)}
          emptyLabel="Noch keine Timeline-Einträge."
        />

        <EntryList
          title="Angebote"
          items={customer.offers}
          emptyLabel="Noch keine Angebote erfasst."
        />

        <EntryList
          title="Rechnungen"
          items={customer.invoices}
          emptyLabel="Noch keine Rechnungen erfasst."
        />

        <EntryList
          title="Termine"
          items={customer.appointments}
          emptyLabel="Noch keine Termine erfasst."
        />

        {customer.documents.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Dokumente
            </p>
            <ul className="mt-2 space-y-2">
              {customer.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-[12px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-3.5 py-3"
                >
                  <p className="text-[12px] font-semibold text-[#0F172A]">{doc.title}</p>
                  <p className="mt-1 text-[10px] text-[#64748B]">
                    {doc.type} · {doc.date}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {customer.notes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Notizen
            </p>
            <ul className="mt-2 space-y-1">
              {customer.notes.map((note) => (
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
