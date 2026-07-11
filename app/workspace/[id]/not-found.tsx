import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkspaceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF4FC] px-4">
      <p className="text-lg font-semibold text-[#0F172A]">Vorgang nicht gefunden</p>
      <p className="mt-2 text-sm text-[#64748B]">
        Dieser Arbeitsbereich existiert nicht oder wurde abgeschlossen.
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
