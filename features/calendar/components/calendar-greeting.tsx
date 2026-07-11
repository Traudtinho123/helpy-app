import { todaySummary } from "@/features/calendar/mock/mock-calendar";

export function CalendarGreeting() {
  return (
    <div className="border-b border-[#CBD5E1]/50 bg-white/70 px-6 py-5 backdrop-blur-sm lg:px-8">
      <div className="flex flex-wrap items-start gap-4">
        <span className="text-2xl" aria-hidden>
          ☀️
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            Guten Morgen Viktor.
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
            Heute warten{" "}
            <span className="font-semibold text-[#0F172A]">
              {todaySummary.appointments} Termine
            </span>
            ,{" "}
            <span className="font-semibold text-[#0F172A]">
              {todaySummary.tasks} Aufgaben
            </span>{" "}
            und{" "}
            <span className="font-semibold text-[#2563EB]">
              {todaySummary.offers} Angebot
            </span>{" "}
            auf dich.
          </p>
        </div>
      </div>
    </div>
  );
}
