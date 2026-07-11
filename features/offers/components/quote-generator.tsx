"use client";

import {
  FileDown,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateQuoteTotals,
  formatCurrency,
  offerStatusLabels,
  offerStatusStyles,
  type Offer,
} from "@/features/offers/mock/mock-offers";
import { cn } from "@/lib/utils";

type QuoteGeneratorProps = {
  offer: Offer | null;
  onImproveWithHelpy?: () => void;
  onOpenPreview?: () => void;
};

export function QuoteGenerator({
  offer,
  onImproveWithHelpy,
  onOpenPreview,
}: QuoteGeneratorProps) {
  if (!offer) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-white/40 p-8">
        <p className="text-sm font-medium text-[#64748B]">
          Wähle ein Angebot aus der Übersicht.
        </p>
      </div>
    );
  }

  const { subtotal, vat, total } = calculateQuoteTotals(
    offer.lineItems,
    offer.vatRate
  );

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-white/40">
      <div className="border-b border-[#CBD5E1]/50 bg-white/70 px-8 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-[#0F172A]">
                Angebot {offer.number}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "h-6 rounded-full px-2.5 text-[11px] font-semibold",
                  offerStatusStyles[offer.status]
                )}
              >
                {offerStatusLabels[offer.status]}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-[#64748B]">{offer.title}</p>
            {offer.sourceEmail && (
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                Quelle: {offer.sourceEmail}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-[#94A3B8]">Deadline</p>
            <p className="text-[13px] font-semibold text-[#DC2626]">
              {offer.deadline}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Kundendaten
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[#64748B]">
                Firma
              </label>
              <Input
                readOnly
                value={offer.customer.company}
                className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC] text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#64748B]">
                Ansprechpartner
              </label>
              <Input
                readOnly
                value={offer.customer.contact}
                className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC] text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#64748B]">
                E-Mail
              </label>
              <Input
                readOnly
                value={offer.customer.email}
                className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC] text-[13px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[#64748B]">
                Adresse
              </label>
              <Input
                readOnly
                value={offer.customer.address}
                className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC] text-[13px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Angebotspositionen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[#CBD5E1]/30 bg-[#F8FAFC]/80">
                    <th className="px-5 py-3 text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
                      Menge
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
                      Beschreibung
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
                      Einzelpreis
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
                      Gesamtpreis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offer.lineItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#CBD5E1]/20 last:border-0"
                    >
                      <td className="px-5 py-4 text-[13px] font-medium text-[#0F172A]">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[#334155]">
                        {item.description}
                      </td>
                      <td className="px-5 py-4 text-right text-[13px] text-[#64748B]">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-5 py-4 text-right text-[13px] font-semibold text-[#0F172A]">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[#CBD5E1]/30 bg-[#F8FAFC]/50 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#64748B]">Zwischensumme</span>
                  <span className="font-medium text-[#0F172A]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#64748B]">MwSt. ({offer.vatRate} %)</span>
                  <span className="font-medium text-[#0F172A]">
                    {formatCurrency(vat)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#CBD5E1]/40 pt-2 text-[15px]">
                  <span className="font-semibold text-[#0F172A]">
                    Gesamtsumme
                  </span>
                  <span className="font-bold text-[#2563EB]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 pb-6">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-[12px] border-[#CBD5E1]/60 bg-white px-4 text-[12px] font-medium shadow-sm"
          >
            <Save className="size-4" />
            Angebot speichern
          </Button>
          <Button
            variant="outline"
            onClick={onOpenPreview}
            className="h-10 gap-2 rounded-[12px] border-[#CBD5E1]/60 bg-white px-4 text-[12px] font-medium shadow-sm"
          >
            <FileDown className="size-4" />
            PDF Vorschau öffnen
          </Button>
          <Button
            variant="outline"
            onClick={onImproveWithHelpy}
            className="h-10 gap-2 rounded-[12px] border-[#2563EB]/30 bg-[#EFF6FF] px-4 text-[12px] font-medium text-[#2563EB] shadow-sm hover:bg-[#EFF6FF]"
          >
            <Sparkles className="size-4" />
            Mit HELPY verbessern
          </Button>
          <Button className="h-10 gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)]">
            <Send className="size-4" />
            Angebot senden
          </Button>
        </div>
      </div>
    </div>
  );
}
