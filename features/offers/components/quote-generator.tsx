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
      <div className="flex h-full flex-1 items-center justify-center bg-[var(--bg-surface)] p-8">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
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
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-surface)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-8 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
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
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{offer.title}</p>
            {offer.sourceEmail && (
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Quelle: {offer.sourceEmail}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Deadline</p>
            <p className="text-[13px] font-semibold text-[#DC2626]">
              {offer.deadline}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-8 py-6">
        <Card className="rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
          <CardHeader className="border-b border-[var(--border)] pb-4">
            <CardTitle className="text-[13px] font-semibold text-[var(--text-primary)]">
              Kundendaten
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Firma
              </label>
              <Input
                readOnly
                value={offer.customer.company}
                className="h-10 rounded-[12px] border-[var(--border)] bg-[var(--bg-elevated)] text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Ansprechpartner
              </label>
              <Input
                readOnly
                value={offer.customer.contact}
                className="h-10 rounded-[12px] border-[var(--border)] bg-[var(--bg-elevated)] text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                E-Mail
              </label>
              <Input
                readOnly
                value={offer.customer.email}
                className="h-10 rounded-[12px] border-[var(--border)] bg-[var(--bg-elevated)] text-[13px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Adresse
              </label>
              <Input
                readOnly
                value={offer.customer.address}
                className="h-10 rounded-[12px] border-[var(--border)] bg-[var(--bg-elevated)] text-[13px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
          <CardHeader className="border-b border-[var(--border)] pb-4">
            <CardTitle className="text-[13px] font-semibold text-[var(--text-primary)]">
              Angebotspositionen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                    <th className="px-5 py-3 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                      Menge
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                      Beschreibung
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                      Einzelpreis
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                      Gesamtpreis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offer.lineItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border)]/20 last:border-0"
                    >
                      <td className="px-5 py-4 text-[13px] font-medium text-[var(--text-primary)]">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-[var(--text-secondary)]">
                        {item.description}
                      </td>
                      <td className="px-5 py-4 text-right text-[13px] text-[var(--text-secondary)]">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-5 py-4 text-right text-[13px] font-semibold text-[var(--text-primary)]">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)]/50 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Zwischensumme</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">MwSt. ({offer.vatRate} %)</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {formatCurrency(vat)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 text-[15px]">
                  <span className="font-semibold text-[var(--text-primary)]">
                    Gesamtsumme
                  </span>
                  <span className="font-bold text-[var(--accent)]">
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
            className="h-10 gap-2 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] px-4 text-[12px] font-medium shadow-sm"
          >
            <Save className="size-4" />
            Angebot speichern
          </Button>
          <Button
            variant="outline"
            onClick={onOpenPreview}
            className="h-10 gap-2 rounded-[12px] border-[var(--border)] bg-[var(--bg-surface)] px-4 text-[12px] font-medium shadow-sm"
          >
            <FileDown className="size-4" />
            PDF Vorschau öffnen
          </Button>
          <Button
            variant="outline"
            onClick={onImproveWithHelpy}
            className="h-10 gap-2 rounded-[12px] border-[var(--border-accent)] bg-[var(--accent-light)] px-4 text-[12px] font-medium text-[var(--accent)] shadow-sm hover:bg-[var(--accent-light)]"
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
