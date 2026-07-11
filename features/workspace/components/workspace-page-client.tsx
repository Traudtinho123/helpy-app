"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import {
  getMailListeVorgang,
  getMailWorkspaceVorgang,
  hasMailVorgaenge,
  subscribeAllMailVorgaenge,
} from "@/features/mail/unified-mail-source-service";
import {
  buildWorkspaceVorgangFromListe,
  getWorkspaceVorgang,
} from "@/features/workspace/services/workspace/workspace-engine";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type WorkspacePageClientProps = {
  id: string;
};

function resolveWorkspaceVorgang(id: string): Vorgang | null {
  const mailWorkspace = getMailWorkspaceVorgang(id);
  if (mailWorkspace) return mailWorkspace;

  const mailListe = getMailListeVorgang(id);
  if (mailListe) {
    return buildWorkspaceVorgangFromListe(mailListe);
  }

  return getWorkspaceVorgang(id);
}

function WorkspaceMissingState({ id }: { id: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF4FC] px-4">
      <p className="text-lg font-semibold text-[#0F172A]">Vorgang nicht gefunden</p>
      <p className="mt-2 max-w-md text-center text-sm text-[#64748B]">
        {hasMailVorgaenge()
          ? `Der Vorgang „${id}“ konnte nicht geladen werden. Bitte kehre zu Vorgängen zurück und öffne ihn erneut.`
          : "Dieser Arbeitsbereich existiert nicht oder wurde abgeschlossen."}
      </p>
      <Link
        href="/vorgaenge"
        className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
      >
        <ArrowLeft className="size-4" />
        Zurück zu Vorgängen
      </Link>
    </div>
  );
}

export function WorkspacePageClient({ id }: WorkspacePageClientProps) {
  const [vorgang, setVorgang] = useState<Vorgang | null | undefined>(undefined);

  useEffect(() => {
    const resolve = () => {
      setVorgang(resolveWorkspaceVorgang(id));
    };

    resolve();
    return subscribeAllMailVorgaenge(resolve);
  }, [id]);

  if (vorgang === undefined) {
    return null;
  }

  if (!vorgang) {
    return <WorkspaceMissingState id={id} />;
  }

  return <WorkspaceShell vorgang={vorgang} />;
}
