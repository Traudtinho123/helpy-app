"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Mail,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import {
  detectionLabels,
  type ImmoScoutInquiry,
} from "@/features/immoscout24/mock/mock-inquiries";

type HelpyImmoScoutPanelProps = {
  inquiry: ImmoScoutInquiry | null;
};

const ALL_DETECTIONS = [
  "besichtigung",
  "kauf",
  "miete",
  "rueckruf",
  "neu",
] as const;

export function HelpyImmoScoutPanel({ inquiry }: HelpyImmoScoutPanelProps) {
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
        {!inquiry ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 p-8 text-center">
            <HelpyAvatar size="md" />
            <p className="text-sm font-medium text-[#64748B]">
              Ich überwache deine ImmoScout24.ch-Anfragen und bereite Vorgänge vor.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="helpy-fade-in">
              <p className="text-[13px] leading-relaxed text-[#334155]">
                Ich überwache deine ImmoScout24.ch-Anfragen und bereite Vorgänge vor.
              </p>
            </div>

            <Card className="helpy-fade-in rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[#2563EB]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    Ich habe erkannt
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {ALL_DETECTIONS.map((detection) => {
                    const isDetected = inquiry.helpy.detections.includes(detection);

                    return (
                      <li
                        key={detection}
                        className="flex items-center gap-2.5 text-[12px] text-[#334155]"
                      >
                        {isDetected ? (
                          <CheckCircle2
                            className="size-4 shrink-0 text-[#059669]"
                            strokeWidth={2}
                          />
                        ) : (
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            <span className="size-1.5 rounded-full bg-[#CBD5E1]" />
                          </span>
                        )}
                        <span className={isDetected ? "font-medium text-[#0F172A]" : "text-[#94A3B8]"}>
                          {detectionLabels[detection]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card className="helpy-fade-in rounded-[20px] border-[#FDE68A]/60 bg-[#FFFBEB]/50 py-0 shadow-sm backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[#B45309]">
                    Meine Empfehlung
                  </p>
                </div>
                <p className="mt-3 text-[12px] leading-[1.65] text-[#334155]">
                  &ldquo;{inquiry.helpy.recommendation}&rdquo;
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </PanelBody>

      {inquiry && (
        <PanelFooter className="space-y-2">
          <Button className="h-10 w-full gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm">
            <Calendar className="size-3.5" />
            Besichtigung planen
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full gap-2 rounded-[12px] border-[#CBD5E1]/60 text-[12px] font-medium"
          >
            <UserPlus className="size-3.5" />
            Interessent anlegen
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full gap-2 rounded-[12px] border-[#CBD5E1]/60 text-[12px] font-medium"
          >
            <Mail className="size-3.5" />
            Antwort vorbereiten
          </Button>
        </PanelFooter>
      )}
    </Panel>
  );
}
