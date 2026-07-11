import {
  CalendarPlus,
  Clock,
  Lightbulb,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { helpyCalendarInsights } from "@/features/calendar/mock/mock-calendar";
import { HELPY_PANEL_REVIEW_INTRO } from "@/features/review/services/safety";

export function HelpyCalendarPanel() {
  const { todayImportant, freeTime, detected, suggestion } =
    helpyCalendarInsights;

  return (
    <Panel variant="helpy" className="flex w-[380px]">
      <PanelHeader className="h-auto items-start py-5">
        <div className="flex items-center gap-3">
          <HelpyAvatar />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              HELPY
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              Dein KI-Bürokollege
            </p>
          </div>
        </div>
      </PanelHeader>

      <PanelBody>
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
              Hallo Viktor 👋
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
              {HELPY_PANEL_REVIEW_INTRO}
            </p>
          </div>

          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <ListChecks className="size-4 text-[#2563EB]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  Heute wichtig
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {todayImportant.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-[12px] text-[#334155]"
                  >
                    <span className="size-1.5 rounded-full bg-[#2563EB]" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#10B981]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  Freie Zeit erkannt
                </p>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-[#64748B]">
                Zwischen{" "}
                <span className="font-semibold text-[#0F172A]">
                  {freeTime.from}
                </span>{" "}
                und{" "}
                <span className="font-semibold text-[#0F172A]">
                  {freeTime.to}
                </span>{" "}
                hast du keine Termine.
              </p>
              <Button
                variant="outline"
                className="mt-4 h-9 w-full rounded-[12px] border-[#CBD5E1]/60 text-[12px] font-medium"
              >
                <CalendarPlus className="size-4" />
                Zeit blockieren
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#0F172A]">
                  Ich habe erkannt
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {detected.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[12px] leading-relaxed text-[#334155]"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-4 h-9 w-full rounded-[12px] border-[#2563EB]/30 bg-[#EFF6FF] text-[12px] font-medium text-[#2563EB]"
              >
                Wiedervorlage erstellen
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#FDE68A]/60 bg-[#FFFBEB]/50 py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                <p className="text-[12px] font-semibold text-[#B45309]">
                  Mein Vorschlag
                </p>
              </div>
              <p className="mt-3 text-[12px] leading-[1.65] text-[#334155]">
                &ldquo;{suggestion}&rdquo;
              </p>
            </CardContent>
          </Card>
        </div>
      </PanelBody>
    </Panel>
  );
}
