import { DATA_PRIVACY_STORAGE_INFO } from "@/lib/privacy/data-privacy-copy";

const STORAGE_ROWS = [
  { label: "Hosting", value: DATA_PRIVACY_STORAGE_INFO.hosting },
  { label: "Datenbank", value: DATA_PRIVACY_STORAGE_INFO.database },
  { label: "KI-Verarbeitung", value: DATA_PRIVACY_STORAGE_INFO.aiProcessing },
  { label: "Löschung", value: DATA_PRIVACY_STORAGE_INFO.deletion },
] as const;

export function DataPrivacySettingsPanel() {
  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-[20px] border border-[#CBD5E1]/50 bg-white/90 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <h3 className="text-[15px] font-semibold text-[#0F172A]">
          Wo werden deine Daten gespeichert?
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
          HELPY speichert und verarbeitet Daten bevorzugt in der EU. Die
          folgenden Angaben gelten für den produktiven Betrieb.
        </p>

        <dl className="mt-5 space-y-4">
          {STORAGE_ROWS.map((row) => (
            <div
              key={row.label}
              className="rounded-[14px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/80 px-4 py-3"
            >
              <dt className="text-[11px] font-semibold tracking-[0.04em] text-[#64748B] uppercase">
                {row.label}
              </dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#334155]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-[12px] leading-relaxed text-[#94A3B8]">
        Fragen zum Datenschutz? Wende dich an deinen HELPY-Ansprechpartner oder
        an die in den Unternehmenseinstellungen hinterlegte Kontaktadresse.
      </p>
    </div>
  );
}
