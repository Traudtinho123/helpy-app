import { todaySummary } from "@/features/calendar/mock/mock-calendar";

export function CalendarGreeting() {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5 backdrop-blur-sm lg:px-8">
      <div className="flex flex-wrap items-start gap-4">
        <span className="text-2xl" aria-hidden>
          ☀️
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            Guten Morgen Viktor.
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Heute warten{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {todaySummary.appointments} Termine
            </span>
            ,{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {todaySummary.tasks} Aufgaben
            </span>{" "}
            und{" "}
            <span className="font-semibold text-[var(--accent)]">
              {todaySummary.offers} Angebot
            </span>{" "}
            auf dich.
          </p>
        </div>
      </div>
    </div>
  );
}
