"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, PenLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import {
  buildPayloadFromPreparedDocument,
  canGeneratePdfForDocument,
  type PreparedDocument,
} from "@/features/documents/services";
import { fetchProfessionalPdfBase64 } from "@/features/documents/pdf/client-actions";
import { getDocumentFileName } from "@/features/documents/services/document-overview-utils";
import { sendDocumentForSignature } from "@/features/signatures/services/signature-client-store";
import { useCompanyProfile } from "@/components/company";

type SignerRow = { name: string; email: string };

type SendForSignatureModalProps = {
  document: PreparedDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
};

export function SendForSignatureModal({
  document,
  open,
  onOpenChange,
  onSent,
}: SendForSignatureModalProps) {
  const { profile } = useCompanyProfile();
  const [signers, setSigners] = useState<SignerRow[]>([
    {
      name: document.links?.customerName ?? document.customer,
      email: document.links?.customerEmail ?? "",
    },
  ]);
  const [message, setMessage] = useState(
    "Bitte unterzeichnen Sie das beigefügte Dokument elektronisch. Bei Fragen melden Sie sich gerne."
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSigners([
      {
        name: document.links?.customerName ?? document.customer,
        email: document.links?.customerEmail ?? "",
      },
    ]);
    setError(null);
    setFallbackHint(null);
  }, [document, open]);

  const fileName = getDocumentFileName(document);
  const canSign = canGeneratePdfForDocument(document);

  const handleSend = useCallback(async () => {
    if (!canSign) {
      setError("Für dieses Dokument ist noch keine PDF-Vorlage verfügbar.");
      return;
    }

    const validSigners = signers.filter(
      (signer) => signer.name.trim() && signer.email.trim()
    );

    if (validSigners.length === 0) {
      setError("Bitte mindestens einen Unterzeichner angeben.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const payload =
        document.pdfPayload ?? buildPayloadFromPreparedDocument(document);

      if (!payload) {
        throw new Error("PDF konnte nicht vorbereitet werden.");
      }

      const pdf = await fetchProfessionalPdfBase64({ payload, branding: profile });

      const result = await sendDocumentForSignature({
        documentId: document.id,
        documentTitle: document.title,
        fileName: pdf.fileName,
        pdfBase64: pdf.base64,
        signers: validSigners,
        message,
        vorgangId: document.vorgangId ?? null,
        kundeId: document.links?.customerId ?? null,
        objektId: document.objectId ?? document.links?.objectId ?? null,
      });

      if (!result) {
        throw new Error("Signatur-Anfrage konnte nicht gespeichert werden.");
      }

      onSent?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }, [
    canSign,
    document,
    message,
    onOpenChange,
    onSent,
    profile,
    signers,
  ]);

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Zur Unterschrift senden"
      description="Unterzeichner erhalten eine E-Mail mit Link zur elektronischen Signatur."
      maxWidth="xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            disabled={busy || !canSign}
            onClick={() => void handleSend()}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Wird gesendet…
              </>
            ) : (
              <>
                <PenLine className="size-4" />
                Senden
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
            Dokument
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#0F172A]">{fileName}</p>
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-[#334155]">Unterzeichner</p>
          {signers.map((signer, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={signer.name}
                onChange={(event) => {
                  const next = [...signers];
                  next[index] = { ...next[index], name: event.target.value };
                  setSigners(next);
                }}
                placeholder="Name"
                className="h-10 rounded-[12px]"
              />
              <Input
                value={signer.email}
                onChange={(event) => {
                  const next = [...signers];
                  next[index] = { ...next[index], email: event.target.value };
                  setSigners(next);
                }}
                placeholder="E-Mail"
                type="email"
                className="h-10 rounded-[12px]"
              />
              {signers.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    setSigners(signers.filter((_, rowIndex) => rowIndex !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setSigners([...signers, { name: "", email: "" }])}
          >
            <Plus className="size-3.5" />
            Weiteren hinzufügen
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-[#334155]">Nachricht</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[13px] text-[#0F172A] outline-none focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20"
          />
        </div>

        <div className="rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-[12px] leading-relaxed text-[#1E40AF]">
          ℹ️ Qualifizierte elektronische Signatur (QES) ist für Mietverträge in der
          Schweiz nicht zwingend erforderlich. Einfache E-Signatur ist für die
          meisten Verträge rechtsgültig.
        </div>

        {fallbackHint ? (
          <p className="text-[11px] text-[#B45309]">{fallbackHint}</p>
        ) : null}
        {error ? <p className="text-[11px] text-[#DC2626]">{error}</p> : null}
      </div>
    </Modal>
  );
}
