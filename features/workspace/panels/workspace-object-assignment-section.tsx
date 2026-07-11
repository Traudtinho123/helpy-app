"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmPrepareRealEstateObjectForVorgang } from "@/features/real-estate/object/object-service";
import {
  hasFinalObjectDossier,
  subscribeObjectDossiers,
} from "@/features/real-estate/dossier/object-dossier-store";
import { useWorkspaceContext } from "@/features/workspace/context/workspace-context-provider";
import {
  resolveWorkspaceObjectAssignment,
  type WorkspaceObjectAssignment,
} from "@/features/workspace/services/workspace-object-assignment";
import { getObjektPathFromVorgang } from "@/features/workspace/services/navigation/entity-navigation";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import { cn } from "@/lib/utils";

type WorkspaceObjectAssignmentSectionProps = {
  vorgangId: string;
  compact?: boolean;
};

function AssignmentCard({
  assignment,
  vorgangId,
}: {
  assignment: WorkspaceObjectAssignment;
  vorgangId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dossierRevision = useStoreRevision(subscribeObjectDossiers);
  const dossierReady = useMemo(
    () =>
      assignment.kind === "linked"
        ? hasFinalObjectDossier(assignment.objectId)
        : false,
    [assignment, dossierRevision]
  );

  if (assignment.kind === "linked") {
    const objectPath = getObjektPathFromVorgang(assignment.objectId, vorgangId);
    const dossierPath = `${objectPath}${objectPath.includes("?") ? "&" : "?"}tab=dossier`;
    return (
      <div className="space-y-2">
        <Link
          href={getObjektPathFromVorgang(assignment.objectId, vorgangId)}
          className={cn(
            "inline-flex items-center gap-2 rounded-[12px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/70 px-3 py-2",
            "text-[12px] font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF6FF]"
          )}
        >
          <Building2 className="size-4" />
          Zugeordnet zu Objekt: {assignment.title}
        </Link>
        {dossierReady ? (
          <Link
            href={dossierPath}
            className="inline-flex items-center gap-2 rounded-[12px] border border-[#A7F3D0]/60 bg-[#ECFDF5]/70 px-3 py-2 text-[12px] font-semibold text-[#047857] transition-colors hover:bg-[#ECFDF5]"
          >
            <FileText className="size-4" />
            Dossier verfügbar
          </Link>
        ) : null}
      </div>
    );
  }

  if (assignment.kind === "missing") {
    return (
      <div className="rounded-[12px] border border-dashed border-[#CBD5E1]/70 bg-[#F8FAFC]/80 px-3.5 py-3">
        <p className="text-[12px] font-medium text-[#334155]">
          Kein passendes Objekt erkannt
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
          HELPY konnte aus dieser Mail kein Objekt sicher ableiten.
        </p>
      </div>
    );
  }

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = confirmPrepareRealEstateObjectForVorgang(vorgangId);
      if (!created) {
        setError("Objekt konnte nicht vorbereitet werden. Bitte Daten prüfen.");
        return;
      }
      setConfirming(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-[12px] border border-[#CBD5E1]/50 bg-[#F8FAFC]/80 px-3.5 py-3">
      <p className="text-[11px] font-semibold tracking-[0.04em] text-[#94A3B8] uppercase">
        Objekt-Zuordnung
      </p>
      <p className="mt-1.5 text-[12px] font-medium text-[#334155]">
        HELPY-Vorschlag: {assignment.title}
      </p>
      <p className="mt-0.5 text-[11px] text-[#64748B]">
        {assignment.adresse}
        {assignment.preis ? ` · ${assignment.preis}` : ""}
        {assignment.quelle ? ` · ${assignment.quelle}` : ""}
      </p>

      {!confirming ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="mt-3 h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px] font-medium"
        >
          <PlusCircle className="mr-1.5 size-3.5" />
          Neues Objekt anlegen?
        </Button>
      ) : (
        <div className="mt-3 space-y-2 rounded-[10px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/40 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-[#334155]">
            Objekt mit diesen Daten anlegen? Du kannst Details danach in der
            Objektakte prüfen und anpassen.
          </p>
          {error ? (
            <p className="text-[11px] font-medium text-[#DC2626]">{error}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
            >
              {creating ? "Wird angelegt …" : "Objekt anlegen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={creating}
              className="h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px] font-medium"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkspaceObjectAssignmentSection({
  vorgangId,
  compact = false,
}: WorkspaceObjectAssignmentSectionProps) {
  const context = useWorkspaceContext();
  const assignment = useMemo(
    () => resolveWorkspaceObjectAssignment(context),
    [context]
  );

  if (compact && assignment.kind === "missing") {
    return null;
  }

  return (
    <section className={compact ? "mb-4" : "mb-5"}>
      <AssignmentCard assignment={assignment} vorgangId={vorgangId} />
    </section>
  );
}
