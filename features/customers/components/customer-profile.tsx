"use client";

import type { ComponentType } from "react";
import { MapPin, Mail, Phone, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CustomerMemorySection } from "@/features/memory/components";
import { Timeline } from "@/features/customers/components/timeline";
import { getTimelineEntryCount } from "@/features/customers/services/timeline";
import { CompanyLogo } from "@/features/customers/components/company-logo";
import { LeadScoreIndicator } from "@/features/lead-scoring/components/lead-score-indicator";
import { getLeadScoreRecord } from "@/features/lead-scoring/services/lead-score-store";
import { statusLabels, statusStyles, type Customer } from "@/features/customers/mock/mock-customers";
import { cn } from "@/lib/utils";

type CustomerProfileProps = {
  customer: Customer | null;
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F1F5F9]">
        <Icon className="size-4 text-[#64748B]" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[#94A3B8]">{label}</p>
        <p className="mt-0.5 text-[13px] font-medium text-[#0F172A]">{value}</p>
      </div>
    </div>
  );
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  if (!customer) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-white/40">
        <p className="text-sm text-[#64748B]">
          Wähle einen Kunden über die Suche, den Filter oder die Kartenleiste.
        </p>
      </div>
    );
  }

  const status = statusStyles[customer.status];
  const leadScore =
    customer.leadScore ?? getLeadScoreRecord(customer.id)?.score ?? 5;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-white/40 backdrop-blur-sm">
      <div className="border-b border-[#CBD5E1]/50 bg-white/70 px-6 py-5 lg:px-8">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">
          Kundenakte
        </p>
      </div>

      <div className="px-6 py-6 lg:px-8">
        <div className="rounded-[24px] border border-[#CBD5E1]/40 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <CompanyLogo
              initials={customer.logoInitials}
              colorClass={customer.logoColor}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#0F172A]">
                      {customer.company}
                    </h2>
                    <LeadScoreIndicator score={leadScore} />
                  </div>
                  <p className="mt-1 text-[14px] text-[#64748B]">
                    {customer.contactPerson}
                    <span className="text-[#94A3B8]"> · {customer.role}</span>
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-6 rounded-full px-3 text-[11px] font-semibold",
                    status.badge
                  )}
                >
                  {statusLabels[customer.status]}
                </Badge>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="h-6 rounded-full border-[#CBD5E1]/60 bg-[#F8FAFC] px-2.5 text-[11px] font-medium text-[#475569]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-[#CBD5E1]/40 pt-6 sm:grid-cols-2">
            <InfoRow icon={Phone} label="Telefon" value={customer.phone} />
            <InfoRow icon={Mail} label="E-Mail" value={customer.email} />
            <InfoRow icon={MapPin} label="Adresse" value={customer.address} />
            <InfoRow
              icon={StickyNote}
              label="Notizen"
              value={customer.notes}
            />
          </div>
        </div>

        <CustomerMemorySection customerId={customer.id} />

        <div className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
                Kundengeschichte
              </h3>
              <p className="mt-0.5 text-[12px] text-[#64748B]">
                Chronologische Timeline — alles an einem Ort
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-medium text-[#64748B]">
              {getTimelineEntryCount(customer.id)} Einträge
            </span>
          </div>

          <Timeline customerId={customer.id} />
        </div>
      </div>
    </div>
  );
}
