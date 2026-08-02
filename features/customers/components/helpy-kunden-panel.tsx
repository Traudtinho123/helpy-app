"use client";

import {
  FileText,
  Lightbulb,
  Mail,
  MessageCircle,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import type { Customer } from "@/features/customers/mock/mock-customers";

type HelpyKundenPanelProps = {
  customer: Customer | null;
};

export function HelpyKundenPanel({ customer }: HelpyKundenPanelProps) {
  return (
    <HelpyPanelShell
      variant="helpy"
      className="flex w-[380px]"
      footer={
        customer ? (
          <Button className="h-11 w-full gap-2 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-300 hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]">
            <MessageCircle className="size-4" />
            Kontakt aufnehmen
          </Button>
        ) : undefined
      }
    >
      {!customer ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
          <HelpyCharacter size={88} pose="wave" animated showLabel={false} />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Wähle einen Kunden — ich kenne deine Akten.
          </p>
        </div>
      ) : (
        <div className="space-y-5 px-1">
            <div className="helpy-fade-in">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                Hallo Viktor 👋
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                Ich kenne diesen Kunden bereits.
              </p>
            </div>

            <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                    Ich habe festgestellt
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  <li className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]">
                    <Mail className="size-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
                    <span>
                      <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                        {customer.helpy.emailCount}
                      </span>{" "}
                      E-Mails
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]">
                    <FileText className="size-3.5 shrink-0 text-[#F59E0B]" strokeWidth={2} />
                    <span>
                      <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                        {customer.helpy.offerCount}
                      </span>{" "}
                      Angebote
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]">
                    <Receipt className="size-3.5 shrink-0 text-[var(--text-secondary)]" strokeWidth={2} />
                    <span>
                      <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                        {customer.helpy.invoiceCount}
                      </span>{" "}
                      Rechnungen
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                    letzter Kontakt vor{" "}
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {customer.helpy.lastContactDays}
                    </span>{" "}
                    {customer.helpy.lastContactDays === 1 ? "Tag" : "Tagen"}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="helpy-fade-in rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-[#10B981]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                    Mein Eindruck
                  </p>
                </div>
                <p className="mt-3 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
                  &ldquo;{customer.helpy.impression}&rdquo;
                </p>
              </CardContent>
            </Card>

            <Card className="helpy-fade-in rounded-[20px] border-[#FDE68A]/60 bg-[#FFFBEB]/50 py-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[#B45309]">
                    Empfehlung
                  </p>
                </div>
                <p className="mt-3 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
                  &ldquo;{customer.helpy.recommendation}&rdquo;
                </p>
              </CardContent>
            </Card>
          </div>
      )}
    </HelpyPanelShell>
  );
}
