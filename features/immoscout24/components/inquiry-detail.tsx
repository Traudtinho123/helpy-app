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
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)]">
      <p className="text-[10px] font-semibold tracking-[0.04em] text-[var(--text-muted)] uppercase">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {Icon && <Icon className="size-3.5 shrink-0 text-[var(--text-secondary)]" strokeWidth={2} />}
        <p className="text-[13px] font-medium text-[var(--text-primary)]">{value}</p>
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
          : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]"
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
        <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-surface)] px-10 py-12 text-center backdrop-blur-xl">
          <Building2 className="mx-auto size-10 text-[var(--text-muted)]" strokeWidth={1.5} />
          <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">
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
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-8 py-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-[var(--accent)] uppercase">
              ImmoScout24.ch
            </p>
            <h1 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {inquiry.name}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{inquiry.objekt}</p>
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
        <Card className="rounded-[24px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
          <CardContent className="p-6 lg:p-7">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Anfragedetails
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailField label="Telefonnummer" value={inquiry.telefon} icon={Phone} />
              <DetailField label="E-Mail" value={inquiry.email} icon={Mail} />
              <DetailField label="Wunschdatum" value={inquiry.wunschdatum} icon={Calendar} />
              <DetailField label="Eingegangen" value={inquiry.receivedLabel} />
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold tracking-[0.04em] text-[var(--text-muted)] uppercase">
                Interesse
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <InterestBadge active={inquiry.kauf} label="Kauf" />
                <InterestBadge active={inquiry.miete} label="Miete" />
                <InterestBadge active={inquiry.besichtigung} label="Besichtigung" />
              </div>
            </div>

            <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
              <p className="text-[10px] font-semibold tracking-[0.04em] text-[var(--text-muted)] uppercase">
                Nachricht
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
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
            className="h-11 gap-2 rounded-[14px] border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]/40"
          >
            <UserPlus className="size-4" />
            Interessent anlegen
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]/40"
          >
            <Mail className="size-4" />
            Antwort vorbereiten
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]/40"
          >
            <ShoppingBag className="size-4" />
            Zur Kundenakte
          </Button>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[14px] border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-medium backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)]/40 sm:col-span-2 lg:col-span-1"
          >
            <CheckCircle2 className="size-4" />
            Als erledigt markieren
          </Button>
        </div>
      </div>
    </div>
  );
}
