"use client";

import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { LeadScoreBadge } from "@/features/lead-scoring/components/lead-score-badge";
import { getAllCrmCustomers } from "@/features/crm/services/crm-store";
import { normalizeEmail } from "@/features/crm/services/crm-merge";

export type HotLeadItem = {
  id: string;
  company: string;
  contactPerson: string;
  score: number;
  href: string;
};

type HotLeadsSectionProps = {
  leads: HotLeadItem[];
};

function resolveHotLeadHref(customerId: string, email: string): string {
  const crm = getAllCrmCustomers().find(
    (entry) =>
      entry.id === customerId || normalizeEmail(entry.email) === normalizeEmail(email)
  );
  const vorgangId = crm?.vorgangIds[0];
  if (vorgangId) return `/kunden/akte/${vorgangId}`;
  return "/kunden";
}

export function buildHotLeadItems(
  customers: Array<{
    id: string;
    company: string;
    contactPerson: string;
    email: string;
    leadScore?: number;
  }>,
  limit = 3
): HotLeadItem[] {
  return [...customers]
    .sort((a, b) => (b.leadScore ?? 5) - (a.leadScore ?? 5))
    .slice(0, limit)
    .filter((customer) => (customer.leadScore ?? 5) >= 7)
    .map((customer) => ({
      id: customer.id,
      company: customer.company,
      contactPerson: customer.contactPerson,
      score: customer.leadScore ?? 5,
      href: resolveHotLeadHref(customer.id, customer.email),
    }));
}

export function HotLeadsSection({ leads }: HotLeadsSectionProps) {
  if (leads.length === 0) return null;

  return (
    <section className="rounded-[24px] border border-[#A7F3D0]/50 bg-gradient-to-br from-[#ECFDF5]/70 to-white/90 p-6 shadow-sm ring-1 ring-[#D1FAE5]/60">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#D1FAE5] text-[#047857]">
          <Flame className="size-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
            Heisse Leads
          </h2>
          <p className="text-[12px] text-[#64748B]">
            Top-Kontakte nach Lead-Score — direkt in die Kundenakte.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={lead.href}
              className="group flex items-center justify-between gap-3 rounded-[14px] border border-[#CBD5E1]/40 bg-white/80 px-4 py-3 transition-all hover:border-[#6EE7B7]/60 hover:bg-white"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#0F172A]">
                  {lead.company}
                </p>
                <p className="truncate text-[11px] text-[#64748B]">
                  {lead.contactPerson}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LeadScoreBadge score={lead.score} />
                <ArrowRight className="size-3.5 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#047857]" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
