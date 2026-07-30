"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useCompanyProfile } from "@/components/company";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { DocumentPdfActions } from "@/features/documents/components/document-pdf-actions";
import type { RechnungPayload } from "@/features/documents/pdf/types";
import type { ProvisionRow } from "@/features/finanzen/types/finanzen-types";
import {
  PROVISION_STATUS_LABELS,
  PROVISION_STATUS_STYLES,
  formatChf,
  formatChfDetailed,
} from "@/features/finanzen/types/finanzen-types";
import { cn } from "@/lib/utils";

type ProvisionListProps = {
  provisions: ProvisionRow[];
  objektTitles: Map<string, string>;
  onRefresh: () => void;
};

export function ProvisionList({
  provisions,
  objektTitles,
  onRefresh,
}: ProvisionListProps) {
  const { profile } = useCompanyProfile();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [invoicePayload, setInvoicePayload] = useState<RechnungPayload | null>(
    null
  );
  const [invoiceRecipient, setInvoiceRecipient] = useState("");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const handleMarkPaid = useCallback(
    async (dealId: string) => {
      setBusyId(dealId);
      try {
        await fetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mark_paid: true }),
        });
        onRefresh();
      } finally {
        setBusyId(null);
      }
    },
    [onRefresh]
  );

  const handleCreateInvoice = useCallback(
    async (row: ProvisionRow) => {
      setBusyId(row.id);
      try {
        const response = await fetch("/api/finanzen/rechnungen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: row.id }),
        });
        if (!response.ok) {
          const detail = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(detail?.error ?? "Rechnung fehlgeschlagen.");
        }
        const data = (await response.json()) as {
          payload?: RechnungPayload;
        };
        if (data.payload) {
          setInvoicePayload(data.payload);
          setInvoiceRecipient(row.kunde_email ?? "");
          setInvoiceModalOpen(true);
        }
        onRefresh();
      } catch (err) {
        console.error(err);
      } finally {
        setBusyId(null);
      }
    },
    [onRefresh]
  );

  if (provisions.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-16 text-center">
        <p className="text-[var(--text-lg)] font-semibold text-[var(--color-ink)]">
          Noch keine Provisionen erfasst
        </p>
        <p className="mt-2 text-[var(--text-sm)] text-[var(--color-ink-3)]">
          Erfasse Provisionen auf Deal-Karten in der Pipeline.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[11px] uppercase tracking-wide text-[var(--color-ink-4)]">
                <th className="px-4 py-3 font-semibold">Objekt</th>
                <th className="px-4 py-3 font-semibold">Kunde</th>
                <th className="px-4 py-3 font-semibold">Abschluss</th>
                <th className="px-4 py-3 font-semibold text-right">Verkaufspreis</th>
                <th className="px-4 py-3 font-semibold text-right">%</th>
                <th className="px-4 py-3 font-semibold text-right">CHF</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {provisions.map((row) => {
                const objektTitle =
                  objektTitles.get(row.objekt_id) ?? row.objekt_id;
                const abschluss = row.abschluss_datum
                  ? new Date(row.abschluss_datum).toLocaleDateString("de-CH")
                  : "—";
                const isBusy = busyId === row.id;

                return (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                      {objektTitle}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-2)]">
                      {row.kunde_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-3)]">{abschluss}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-ink-2)]">
                      {formatChfDetailed(row.verkaufspreis_chf)}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-ink-2)]">
                      {row.provision_prozent != null
                        ? `${row.provision_prozent} %`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink)]">
                      {formatChf(row.provision_chf)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          PROVISION_STATUS_STYLES[row.provision_status]
                        )}
                      >
                        {PROVISION_STATUS_LABELS[row.provision_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {row.provision_status === "verdient" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => void handleCreateInvoice(row)}
                          >
                            {isBusy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <FileText className="size-3.5" />
                            )}
                            Rechnung
                          </Button>
                        ) : null}
                        {row.provision_status !== "bezahlt" &&
                        (row.provision_status === "verdient" ||
                          row.provision_status === "rechnungsgestellt") ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => void handleMarkPaid(row.id)}
                          >
                            {isBusy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Bezahlt
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Rechnung erstellt"
        description="PDF herunterladen oder per Gmail versenden."
        maxWidth="lg"
      >
        {invoicePayload ? (
          <DocumentPdfActions
            payload={invoicePayload}
            branding={profile}
            defaultRecipient={invoiceRecipient}
            defaultSubject={`Rechnung ${invoicePayload.invoiceNumber}`}
          />
        ) : null}
      </Modal>
    </>
  );
}
