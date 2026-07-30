"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canGeneratePdfForDocument, type PreparedDocument } from "@/features/documents/services";
import { DocumentSignatureStatus } from "@/features/signatures/components/document-signature-status";
import { SendForSignatureModal } from "@/features/signatures/components/send-for-signature-modal";
import { getSignatureForDocument } from "@/features/signatures/services/signature-client-store";
import { cn } from "@/lib/utils";

type DocumentSignatureActionsProps = {
  document: PreparedDocument;
  compact?: boolean;
  className?: string;
};

export function DocumentSignatureActions({
  document,
  compact = false,
  className,
}: DocumentSignatureActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [revision, setRevision] = useState(0);

  const existing = getSignatureForDocument(document.id);
  const canSend =
    canGeneratePdfForDocument(document) &&
    (!existing ||
      existing.signature_status === "entwurf" ||
      existing.signature_status === "abgebrochen" ||
      existing.signature_status === "abgelaufen");

  return (
    <div className={cn("space-y-2", className)}>
      {existing && existing.signature_status !== "entwurf" ? (
        <DocumentSignatureStatus
          documentId={document.id}
          onChange={() => setRevision((value) => value + 1)}
          key={revision}
        />
      ) : null}

      {canSend ? (
        <Button
          type="button"
          variant={compact ? "outline" : "primary"}
          size="sm"
          className={cn(
            compact
              ? "h-9 w-full justify-center gap-1.5 rounded-[10px] text-[11px] font-semibold"
              : "gap-2"
          )}
          onClick={() => setModalOpen(true)}
        >
          <PenLine className="size-3.5" />
          Zur Unterschrift senden
        </Button>
      ) : null}

      <SendForSignatureModal
        document={document}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSent={() => setRevision((value) => value + 1)}
      />
    </div>
  );
}
