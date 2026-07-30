"use client";

import Link from "next/link";
import { EntityBrowserPicker } from "@/components/entity-browser";
import { CompanyLogo } from "@/features/customers/components/company-logo";
import { LeadScoreBadge } from "@/features/lead-scoring/components/lead-score-badge";
import {
  statusStyles,
  type Customer,
} from "@/features/customers/mock/mock-customers";
import { cn } from "@/lib/utils";

type KundenPickerProps = {
  customers: Customer[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Erweiterte Bestandskunden-Zeile: Objekt, Kontakt, nächste Kampagne. */
  bestandskundenMode?: boolean;
};

function CustomerCard({
  customer,
  isSelected,
  onSelect,
  bestandskundenMode,
}: {
  customer: Customer;
  isSelected: boolean;
  onSelect: () => void;
  bestandskundenMode?: boolean;
}) {
  const status = statusStyles[customer.status];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full shrink-0 gap-3 rounded-[16px] border p-3 text-left transition-all duration-300",
        bestandskundenMode ? "sm:w-[280px]" : "sm:w-[220px]",
        isSelected
          ? "border-[#2563EB]/30 bg-white shadow-[0_2px_16px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]/15"
          : "border-[#CBD5E1]/40 bg-white/70 hover:border-[#CBD5E1]/60 hover:bg-white hover:shadow-sm"
      )}
    >
      <CompanyLogo
        initials={customer.logoInitials}
        colorClass={customer.logoColor}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {customer.contactPerson}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {customer.leadScore != null && (
              <LeadScoreBadge score={customer.leadScore} />
            )}
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", status.dot)} />
          </div>
        </div>
        {bestandskundenMode ? (
          <>
            <p className="mt-0.5 truncate text-[12px] text-[#64748B]">
              {customer.lastObjectLabel ?? customer.company}
            </p>
            <p className="mt-1 text-[11px] font-medium text-[#94A3B8]">
              Letzter Kontakt: {customer.lastActivityLabel}
              {customer.helpy.lastContactDays > 0
                ? ` · ${customer.helpy.lastContactDays} Tage`
                : ""}
            </p>
            {customer.nextCampaignLabel ? (
              <p className="mt-0.5 text-[11px] text-[#B45309]">
                Nächste Kampagne: {customer.nextCampaignLabel}
              </p>
            ) : null}
            <Link
              href={`/kunden?select=${encodeURIComponent(customer.id)}`}
              onClick={(event) => event.stopPropagation()}
              className="mt-2 inline-flex text-[11px] font-semibold text-[#2563EB]"
            >
              Kontaktieren →
            </Link>
          </>
        ) : (
          <>
            <p className="mt-0.5 truncate text-[12px] text-[#64748B]">
              {customer.company}
            </p>
            <p className="mt-1 text-[11px] font-medium text-[#94A3B8]">
              {customer.lastActivityLabel}
            </p>
          </>
        )}
      </div>
    </button>
  );
}

export function KundenPicker({
  customers,
  selectedId,
  onSelect,
  bestandskundenMode = false,
}: KundenPickerProps) {
  return (
    <EntityBrowserPicker
      items={customers}
      selectedId={selectedId}
      onSelect={onSelect}
      getItemId={(customer) => customer.id}
      getOptionLabel={(customer) =>
        `${customer.company} — ${customer.contactPerson}`
      }
      title="Kunde auswählen"
      selectAriaLabel="Kunde auswählen"
      emptyTitle="Keine Kunden gefunden."
      emptyDescription="Suche oder Filter anpassen."
      renderCard={(customer, isSelected) => (
        <CustomerCard
          customer={customer}
          isSelected={isSelected}
          onSelect={() => onSelect(customer.id)}
          bestandskundenMode={bestandskundenMode}
        />
      )}
    />
  );
}
