"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  ShoppingBag,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  priorityLabels,
  priorityStyles,
  statusLabels,
  statusStyles,
  type ImmoScoutInquiry,
} from "@/features/immoscout24/mock/mock-inquiries";
import { cn } from "@/lib/utils";

type InquiryDetailProps = {
  inquiry: ImmoScoutInquiry | null;
};

function DetailField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-[14px] border border-[#CBD5E1]/40 bg-white/80 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-white">
      <p className="text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {Icon && <Icon className="size-3.5 shrink-0 text-[#64748B]" strokeWidth={2} />}
        <p className="text-[13px] font-medium text-[#0F172A]">{value}</p>
      </div>
    </div>
  );
}

function InterestBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-300",
        active
          ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
          : "border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8]"
      )}
    >
      {active ? (
        <CheckCircle2 className="size-3" strokeWidth={2.5} />
      ) : (
        <span className="size-1.5 rounded-full bg-[#CBD5E1]" />
      )}
      {label}
    </span>
  );
}

export function InquiryDetail({ inquiry }: InquiryDetailProps) {
  if (!inquiry) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#EEF4FC]/40">
        <div className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-white/70 px-10 py-12 text-center backdrop-blur-xl">
          <Building2 className="mx-auto size-10 text-[#94A3B8]" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-medium text-[#64748B]">
            Wähle eine Anfrage aus der Liste.
          </p>
        </div>
      </div>
    );
  }

  const priority = priorityStyles[inquiry.prioritaet];
  const status = statusStyles[inquiry.status];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#EEF4FC]/40">
      <div className="border-b border-[#CBD5E1]/40 bg-white/70 px-8 py-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[#2563EB] uppercase">
              ImmoScout24.ch
            </p>
            <h1 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {inquiry.name}
            </h1>
            <p className="mt-1 text-[13px] text-[#64748B]">{inquiry.objekt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("h-6 rounded-full px-2.5 text-[11px] font-semibold", priority.badge)}
            >
              {priorityLabels[inquiry.prioritaet]}
            </Badge>
            <Badge
              variant="outline"
              className={cn("h-6 rounded-full px-2.5 text-[11px] font-semibold", status.badge)}
            >
              {statusLabels[inquiry.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 px-8 py-6">
        <Card className="rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
          <CardContent className="p-6 lg:p-7">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
              Anfragedetails
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailField label="Telefonnummer" value={inquiry.telefon} icon={Phone} />
              <DetailField label="E-Mail" value={inquiry.email} icon={Mail} />
              <DetailField label="Wunschdatum" value={inquiry.wunschdatum} icon={Calendar} />
              <DetailField label="Eingegangen" value={inquiry.receivedLabel} />
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                Interesse
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <InterestBadge active={inquiry.kauf} label="Kauf" />
                <InterestBadge active={inquiry.miete} label="Miete" />
                <InterestBadge active={inquiry.besichtigung} label="Besichtigung" />
              </div>
            </div>

            <div className="mt-5 rounded-[16px] border border-[#CBD5E1]/40 bg-[#F8FAFC]/80 p-4">
              <p className="text-[10px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
                Nachricht
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#334155]">
                {inquiry.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button className="h-11 gap-2 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-300 hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]">
            <Calendar className="size-4" />
            Besichtigung planen
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[#CBD5E1]/60 bg-white/90 text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40"
          >
            <UserPlus className="size-4" />
            Interessent anlegen
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[#CBD5E1]/60 bg-white/90 text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40"
          >
            <Mail className="size-4" />
            Antwort vorbereiten
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[#CBD5E1]/60 bg-white/90 text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40"
          >
            <ShoppingBag className="size-4" />
            Zur Kundenakte
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[#CBD5E1]/60 bg-white/90 text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]/40 sm:col-span-2 lg:col-span-1"
          >
            <CheckCircle2 className="size-4" />
            Als erledigt markieren
          </Button>
        </div>
      </div>
    </div>
  );
}
