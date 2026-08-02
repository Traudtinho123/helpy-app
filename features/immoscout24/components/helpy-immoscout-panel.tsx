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
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
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
    <HelpyPanelShell
      variant="helpy"
      className="flex w-[380px]"
      footer={
        inquiry ? (
          <div className="space-y-2">
            <Button className="h-10 w-full gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm">
              <Calendar className="size-3.5" />
              Besichtigung planen
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full gap-2 rounded-[12px] border-[var(--border)] text-[12px] font-medium"
            >
              <UserPlus className="size-3.5" />
              Interessent anlegen
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full gap-2 rounded-[12px] border-[var(--border)] text-[12px] font-medium"
            >
              <Mail className="size-3.5" />
              Antwort vorbereiten
            </Button>
          </div>
        ) : undefined
      }
    >
      {!inquiry ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
          <HelpyCharacter size={88} pose="wave" animated showLabel={false} />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Ich überwache deine ImmoScout24.ch-Anfragen und bereite Vorgänge vor.
          </p>
        </div>
      ) : (
        <div className="space-y-5 px-1">
            <div className="helpy-fade-in">
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Ich überwache deine ImmoScout24.ch-Anfragen und bereite Vorgänge vor.
              </p>
            </div>

            <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[var(--accent)]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                    Ich habe erkannt
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {ALL_DETECTIONS.map((detection) => {
                    const isDetected = inquiry.helpy.detections.includes(detection);

                    return (
                      <li
                        key={detection}
                        className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]"
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
                        <span className={isDetected ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
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
                <p className="mt-3 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
                  &ldquo;{inquiry.helpy.recommendation}&rdquo;
                </p>
              </CardContent>
            </Card>
          </div>
      )}
    </HelpyPanelShell>
  );
}
