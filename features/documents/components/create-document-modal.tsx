"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Mail, Sparkles } from "lucide-react";
import { useCompanyProfile } from "@/components/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import {
  buildPayloadFromPreparedDocument,
} from "@/features/documents/pdf/payload-builders";
import {
  downloadProfessionalPdf,
  fetchProfessionalPdfBase64,
} from "@/features/documents/pdf/client-actions";
import type { CreateDocumentKind } from "@/features/documents/services/document-text-generator";
import {
  prepareDocumentFromVorgang,
} from "@/features/documents/services/vorgang-document-engine";
import {
  closeCreateDocumentModal,
  getCreateDocumentModalState,
  getCreateDocumentModalServerSnapshot,
  subscribeCreateDocumentModal,
  type CreateDocumentModalRequest,
} from "@/features/documents/services/create-document-modal-store";
import type { DocumentPreviewSection } from "@/features/documents/services/types";
import {
  upsertPreparedDocument,
  updatePreparedDocumentStatus,
} from "@/features/documents/services/document-engine";
import { sendGmailMessage } from "@/features/gmail/services/gmail-drafts";
import { resolveVorgangSender } from "@/features/workspace/services/vorgaenge/resolve-vorgang-sender";
import { createClient } from "@/lib/supabase/client";
import { useSyncExternalStore } from "react";

const KIND_LABELS: Record<CreateDocumentKind, string> = {
  angebot: "Angebot",
  offerte: "Offerte",
  expose: "Exposé",
};

type CreateDocumentModalProps = {
  request: CreateDocumentModalRequest;
  open: boolean;
  onClose: () => void;
};

function CreateDocumentModalBody({
  request,
  open,
  onClose,
}: CreateDocumentModalProps) {
  const { profile } = useCompanyProfile();
  const sender = useMemo(
    () => resolveVorgangSender(request.vorgang),
    [request.vorgang]
  );

  const [recipientName, setRecipientName] = useState(sender.name);
  const [recipientEmail, setRecipientEmail] = useState(sender.email ?? "");
  const [sections, setSections] = useState<DocumentPreviewSection[]>([]);
  const [busy, setBusy] = useState<"save" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const draft = prepareDocumentFromVorgang({
      kind: request.kind,
      vorgang: request.vorgang,
      object: request.object,
    });
    setRecipientName(sender.name);
    setRecipientEmail(sender.email ?? draft.links?.customerEmail ?? "");
    setSections(draft.previewSections.map((section) => ({ ...section })));
    setError(null);
    setSuccess(null);
  }, [open, request, sender.email, sender.name]);

  const objectLabel =
    request.object?.titel ??
    request.vorgang.titel;

  const buildDocument = useCallback(() => {
    const document = prepareDocumentFromVorgang({
      kind: request.kind,
      vorgang: request.vorgang,
      object: request.object,
      recipientName,
      recipientEmail,
      sections,
    });
    const payload = buildPayloadFromPreparedDocument(document);
    return payload ? { ...document, pdfPayload: payload } : document;
  }, [
    recipientEmail,
    recipientName,
    request.kind,
    request.object,
    request.vorgang,
    sections,
  ]);

  const handleSavePdf = useCallback(async () => {
    setBusy("save");
    setError(null);
    setSuccess(null);
    try {
      const document = buildDocument();
      const payload = document.pdfPayload ?? buildPayloadFromPreparedDocument(document);
      if (!payload) {
        throw new Error("PDF konnte nicht vorbereitet werden.");
      }
      upsertPreparedDocument({ ...document, pdfPayload: payload });
      updatePreparedDocumentStatus(document.id, "freigegeben");
      await downloadProfessionalPdf({ payload, branding: profile });
      setSuccess(`${KIND_LABELS[request.kind]} gespeichert und PDF heruntergeladen.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }, [buildDocument, profile, request.kind]);

  const handleSendGmail = useCallback(async () => {
    if (!recipientEmail.trim()) {
      setError("Bitte Empfänger-E-Mail angeben.");
      return;
    }

    setBusy("send");
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const session = supabase
        ? (await supabase.auth.getSession()).data.session
        : null;
      const accessToken = session?.provider_token;
      if (!accessToken) {
        throw new Error(
          "Gmail nicht verbunden. Bitte Google-Konto verbinden."
        );
      }

      const document = buildDocument();
      const payload = document.pdfPayload ?? buildPayloadFromPreparedDocument(document);
      if (!payload) {
        throw new Error("PDF konnte nicht vorbereitet werden.");
      }

      upsertPreparedDocument({ ...document, pdfPayload: payload, status: "gesendet" });
      const pdf = await fetchProfessionalPdfBase64({ payload, branding: profile });
      const result = await sendGmailMessage({
        accessToken,
        to: recipientEmail.trim(),
        subject: document.title,
        body: `Guten Tag ${recipientName},\n\nanbei erhalten Sie das gewünschte Dokument als PDF.\n\nFreundliche Grüsse\n${profile.companyName}`,
        attachments: [
          {
            filename: pdf.fileName,
            mimeType: pdf.mimeType,
            contentBase64: pdf.base64,
          },
        ],
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      setSuccess(`${KIND_LABELS[request.kind]} per Gmail gesendet.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }, [buildDocument, profile, recipientEmail, recipientName, request.kind]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="xl"
      title={`${KIND_LABELS[request.kind]} erstellen`}
      description="HELPY hat einen Entwurf vorbereitet — bitte prüfen und bestätigen."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void handleSavePdf()}
          >
            {busy === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            PDF speichern
          </Button>
          <Button
            type="button"
            disabled={busy !== null || !recipientEmail.trim()}
            onClick={() => void handleSendGmail()}
          >
            {busy === "send" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Per Gmail senden
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[12px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] text-[#1E40AF]">
            <Sparkles className="size-4 shrink-0" />
            HELPY hat den Text aus Vorgang und Objektdaten vorbereitet.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#64748B]">
              Empfänger
            </label>
            <Input
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              className="h-10 rounded-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#64748B]">
              E-Mail
            </label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="name@firma.de"
              className="h-10 rounded-[12px]"
            />
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
            Objekt
          </p>
          <p className="mt-1 text-[13px] font-medium text-[#0F172A]">
            {objectLabel}
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={section.heading ?? index} className="space-y-1.5">
              {section.heading ? (
                <label className="text-[11px] font-semibold text-[#64748B]">
                  {section.heading}
                </label>
              ) : null}
              <textarea
                value={section.content}
                onChange={(event) => {
                  const next = [...sections];
                  next[index] = { ...next[index], content: event.target.value };
                  setSections(next);
                }}
                rows={Math.min(8, Math.max(3, section.content.split("\n").length + 1))}
                className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#334155] outline-none focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20"
              />
            </div>
          ))}
        </div>

        {error ? <p className="text-[12px] text-[#DC2626]">{error}</p> : null}
        {success ? (
          <p className="text-[12px] font-medium text-[#047857]">{success}</p>
        ) : null}
      </div>
    </Modal>
  );
}

export function CreateDocumentModalHost() {
  const state = useSyncExternalStore(
    subscribeCreateDocumentModal,
    getCreateDocumentModalState,
    getCreateDocumentModalServerSnapshot
  );

  if (!state.open || !state.request) return null;

  return (
    <CreateDocumentModalBody
      open={state.open}
      request={state.request}
      onClose={closeCreateDocumentModal}
    />
  );
}

export { openCreateDocumentModal } from "@/features/documents/services/create-document-modal-store";
