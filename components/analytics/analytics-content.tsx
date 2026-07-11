import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function AnalyticsContent() {
  return (
    <>
      <Card className="rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_4px_20px_rgba(37,99,235,0.35)]">
            <BarChart3 className="size-6 text-white" strokeWidth={2} />
          </span>
          <p className="text-[15px] font-semibold text-[#0F172A]">
            Analytics folgen in Kürze
          </p>
          <p className="max-w-md text-[13px] leading-relaxed text-[#64748B]">
            Ich sammle bereits Daten — bald siehst du hier deine wichtigsten
            Kennzahlen.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
