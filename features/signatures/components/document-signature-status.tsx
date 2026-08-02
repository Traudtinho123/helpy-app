"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, PenLine, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchSignatureForDocument,
  remindSignature,
  voidSignature,
} from "@/features/signatures/services/signature-client-store";
import {
  SIGNATURE_STATUS_LABELS,
  SIGNATURE_STATUS_STYLES,
  type DocumentSignatureRecord,
} from "@/features/signatures/types/signature-types";
import { cn } from "@/lib/utils";

type DocumentSignatureStatusProps = {
  documentId: string;
  className?: string;
  onChange?: () => void;
};

function formatSentAt(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentSignatureStatus({
  documentId,
  className,
  onChange,
}: DocumentSignatureStatusProps) {
  const [signature, setSignature] = useState<DocumentSignatureRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"remind" | "void" | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchSignatureForDocument(documentId).then((record) => {
      if (active) {
        setSignature(record);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-[12px] text-[var(--text-muted)]", className)}>
        <Loader2 className="size-3.5 animate-spin" />
        Signatur-Status wird geladen…
      </div>
    );
  }

  if (!signature || signature.signature_status === "entwurf") {
    return null;
  }

  const primarySigner = signature.signers[0];
  const statusStyle = SIGNATURE_STATUS_STYLES[signature.signature_status];

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[var(--border)] bg-[#FAFAF8] px-4 py-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <PenLine className="size-4 text-[#7C3AED]" />
            <Badge
              variant="outline"
              className={cn("h-6 rounded-full px-2.5 text-[10px] font-semibold", statusStyle)}
            >
              {SIGNATURE_STATUS_LABELS[signature.signature_status]}
            </Badge>
          </div>
          {primarySigner ? (
            <p className="text-[12px] text-[var(--text-secondary)]">
              {primarySigner.name} · Gesendet {formatSentAt(signature.signature_sent_at)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {signature.signature_status === "vollstaendig" &&
          signature.signed_document_url ? (
            <a
              href={`/api/signatures/${encodeURIComponent(documentId)}/download`}
              className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
            >
              <Download className="size-3.5" />
              Signiertes PDF
            </a>
          ) : null}

          {signature.signature_status === "gesendet" ||
          signature.signature_status === "teilweise" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                disabled={busy !== null}
                onClick={() => {
                  setBusy("remind");
                  void remindSignature(documentId).finally(() => {
                    setBusy(null);
                    onChange?.();
                  });
                }}
              >
                {busy === "remind" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  "Erinnerung senden"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[11px] text-[#DC2626]"
                disabled={busy !== null}
                onClick={() => {
                  setBusy("void");
                  void voidSignature(documentId).then((ok) => {
                    if (ok) {
                      void fetchSignatureForDocument(documentId).then(setSignature);
                      onChange?.();
                    }
                    setBusy(null);
                  });
                }}
              >
                {busy === "void" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="size-3.5" />
                    Abbrechen
                  </>
                )}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
