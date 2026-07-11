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
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { Customer } from "@/features/customers/mock/mock-customers";

type HelpyKundenPanelProps = {
  customer: Customer | null;
};

export function HelpyKundenPanel({ customer }: HelpyKundenPanelProps) {
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
        {!customer ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 p-8 text-center">
            <HelpyAvatar size="md" />
            <p className="text-sm font-medium text-[#64748B]">
              Wähle einen Kunden — ich kenne deine Akten.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="helpy-fade-in">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
                Hallo Viktor 👋
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
                Ich kenne diesen Kunden bereits.
              </p>
            </div>

            <Card className="helpy-fade-in rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    Ich habe festgestellt
                  </p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  <li className="flex items-center gap-2.5 text-[12px] text-[#334155]">
                    <Mail className="size-3.5 shrink-0 text-[#2563EB]" strokeWidth={2} />
                    <span>
                      <span className="font-semibold tabular-nums text-[#0F172A]">
                        {customer.helpy.emailCount}
                      </span>{" "}
                      E-Mails
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[12px] text-[#334155]">
                    <FileText className="size-3.5 shrink-0 text-[#F59E0B]" strokeWidth={2} />
                    <span>
                      <span className="font-semibold tabular-nums text-[#0F172A]">
                        {customer.helpy.offerCount}
                      </span>{" "}
                      Angebote
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[12px] text-[#334155]">
                    <Receipt className="size-3.5 shrink-0 text-[#64748B]" strokeWidth={2} />
                    <span>
                      <span className="font-semibold tabular-nums text-[#0F172A]">
                        {customer.helpy.invoiceCount}
                      </span>{" "}
                      Rechnungen
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[12px] text-[#334155]">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                    letzter Kontakt vor{" "}
                    <span className="font-semibold tabular-nums text-[#0F172A]">
                      {customer.helpy.lastContactDays}
                    </span>{" "}
                    {customer.helpy.lastContactDays === 1 ? "Tag" : "Tagen"}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="helpy-fade-in rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-[#10B981]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    Mein Eindruck
                  </p>
                </div>
                <p className="mt-3 text-[12px] leading-[1.65] text-[#334155]">
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
                <p className="mt-3 text-[12px] leading-[1.65] text-[#334155]">
                  &ldquo;{customer.helpy.recommendation}&rdquo;
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </PanelBody>

      {customer && (
        <PanelFooter>
          <Button className="h-11 w-full gap-2 rounded-[14px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition-all duration-300 hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]">
            <MessageCircle className="size-4" />
            Kontakt aufnehmen
          </Button>
        </PanelFooter>
      )}
    </Panel>
  );
}
