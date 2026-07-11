"use client";

import {
  Building2,
  Calendar,
  FileText,
  Mail,
  Paperclip,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Vorgang, VorgangAngebot } from "@/features/workspace/services/workspace/types";

export function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 border-b border-[#CBD5E1]/30 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <CardTitle className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

export function FieldGrid({
  fields,
}: {
  fields: Array<{ label: string; value: string; highlight?: boolean }>;
}) {
  return (
    <dl className="space-y-2 text-[12px]">
      {fields.map(({ label, value, highlight }) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-[#64748B]">{label}</dt>
          <dd
            className={cn(
              "text-right font-medium",
              highlight ? "text-[#2563EB]" : "text-[#0F172A]"
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CustomerSection({
  vorgang,
  title = "Kundeninformationen",
  id,
}: {
  vorgang: Vorgang;
  title?: string;
  id?: string;
}) {
  const { kunde } = vorgang;

  return (
    <div id={id}>
    <SectionCard title={title} icon={Building2}>
      <div className="space-y-3">
        <div>
          <p className="text-[15px] font-semibold text-[#0F172A]">
            {kunde.firmenname}
          </p>
          <Badge
            variant="outline"
            className="mt-2 h-5 rounded-full border-[#BFDBFE] bg-[#EFF6FF] px-2 text-[10px] font-semibold text-[#2563EB]"
          >
            {kunde.status}
          </Badge>
        </div>
        <FieldGrid
          fields={[
            { label: "Ansprechpartner", value: kunde.ansprechpartner },
            { label: "E-Mail", value: kunde.email, highlight: true },
            { label: "Telefon", value: kunde.telefon },
            { label: "Adresse", value: kunde.adresse },
            ...(kunde.branche
              ? [{ label: "Branche", value: kunde.branche }]
              : []),
          ]}
        />
      </div>
    </SectionCard>
    </div>
  );
}

export function EmailSection({ vorgang }: { vorgang: Vorgang }) {
  const { letzteEmail } = vorgang;

  return (
    <SectionCard title="Letzte E-Mail" icon={Mail}>
      <div className="space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-[#0F172A]">
            {letzteEmail.betreff}
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            {letzteEmail.absender} · {letzteEmail.datum}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3.5 py-3">
          <p className="text-[11px] font-semibold text-[#2563EB]">
            HELPY Zusammenfassung
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#334155]">
            {letzteEmail.zusammenfassung}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#CBD5E1]/40 bg-[#F8FAFC] px-3.5 py-3">
          <p className="whitespace-pre-line text-[12px] leading-[1.65] text-[#475569]">
            {letzteEmail.inhalt}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function OfferEditorSection({ angebot }: { angebot: VorgangAngebot }) {
  const netto = angebot.positionen.reduce(
    (sum, p) => sum + p.menge * p.einzelpreis,
    0
  );
  const mwst = netto * (angebot.mwstSatz / 100);
  const brutto = netto + mwst;

  return (
    <SectionCard title="Angebotseditor" icon={FileText}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-[#0F172A]">
              {angebot.angebotNr}
            </p>
            <Badge
              variant="outline"
              className="h-5 rounded-full border-[#FDE68A] bg-[#FFFBEB] px-2 text-[10px] font-semibold text-[#B45309]"
            >
              {angebot.status}
            </Badge>
          </div>
          {angebot.deadline && (
            <Badge
              variant="outline"
              className="h-5 rounded-full border-[#FECACA] bg-[#FEF2F2] px-2 text-[10px] font-semibold text-[#DC2626]"
            >
              Frist: {angebot.deadline}
            </Badge>
          )}
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[#CBD5E1]/40">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#CBD5E1]/40 bg-[#F8FAFC]">
                <th className="px-3 py-2.5 text-left font-semibold text-[#64748B]">
                  Bezeichnung
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#64748B]">
                  Menge
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#64748B]">
                  Preis
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-[#64748B]">
                  Summe
                </th>
              </tr>
            </thead>
            <tbody>
              {angebot.positionen.map((pos) => (
                <tr
                  key={pos.bezeichnung}
                  className="border-b border-[#CBD5E1]/30 last:border-0"
                >
                  <td className="px-3 py-2.5 font-medium text-[#0F172A]">
                    {pos.bezeichnung}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#475569]">
                    {pos.menge}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#475569]">
                    {formatCurrency(pos.einzelpreis)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-[#0F172A]">
                    {formatCurrency(pos.menge * pos.einzelpreis)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-1 text-[12px]">
          <div className="flex w-full max-w-[240px] justify-between">
            <span className="text-[#64748B]">Netto</span>
            <span className="font-semibold text-[#0F172A]">
              {formatCurrency(netto)}
            </span>
          </div>
          <div className="flex w-full max-w-[240px] justify-between">
            <span className="text-[#64748B]">MwSt. ({angebot.mwstSatz} %)</span>
            <span className="font-semibold text-[#0F172A]">
              {formatCurrency(mwst)}
            </span>
          </div>
          <div className="flex w-full max-w-[240px] justify-between border-t border-[#CBD5E1]/40 pt-2">
            <span className="font-semibold text-[#0F172A]">Brutto</span>
            <span className="text-[14px] font-bold text-[#2563EB]">
              {formatCurrency(brutto)}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function TermineSection({ termine }: { termine: Vorgang["termine"] }) {
  return (
    <SectionCard title="Termine" icon={Calendar}>
      {termine.length === 0 ? (
        <p className="text-[12px] text-[#64748B]">
          Keine Termine zu diesem Vorgang.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {termine.map((termin) => (
            <li
              key={`${termin.titel}-${termin.datum}`}
              className="rounded-[12px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/40 px-3.5 py-2.5"
            >
              <p className="text-[12px] font-semibold text-[#047857]">
                {termin.titel}
              </p>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                {termin.datum}
                {termin.ort ? ` · ${termin.ort}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function DocumentsSection({ dokumente }: { dokumente: Vorgang["dokumente"] }) {
  return (
    <SectionCard title="Dokumente" icon={Paperclip}>
      {dokumente.length === 0 ? (
        <p className="text-[12px] text-[#64748B]">Noch keine Dokumente.</p>
      ) : (
        <ul className="space-y-2">
          {dokumente.map((doc) => (
            <li
              key={doc.name}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-[#CBD5E1]/40 bg-[#F8FAFC] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-[#0F172A]">
                  {doc.name}
                </p>
                <p className="text-[10px] text-[#94A3B8]">{doc.datum}</p>
              </div>
              <Badge
                variant="outline"
                className="h-5 shrink-0 rounded-full border-[#CBD5E1] px-2 text-[10px] font-medium text-[#64748B]"
              >
                {doc.typ}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function NotesSection({ notizen }: { notizen: string }) {
  return (
    <SectionCard title="Interne Notizen" icon={StickyNote}>
      <textarea
        defaultValue={notizen}
        rows={6}
        className="w-full resize-none rounded-[14px] border border-[#CBD5E1]/50 bg-[#FFFBEB]/30 px-3.5 py-3 text-[12px] leading-relaxed text-[#334155] outline-none focus:border-[#FDE68A]/60 focus:ring-2 focus:ring-[#FDE68A]/20"
        placeholder="Interne Notizen zum Vorgang…"
      />
    </SectionCard>
  );
}

export function GenericFieldsSection({
  title,
  icon: Icon,
  fields,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  fields: Array<{ label: string; value: string; highlight?: boolean }>;
}) {
  return (
    <SectionCard title={title} icon={Icon}>
      <FieldGrid fields={fields} />
    </SectionCard>
  );
}
