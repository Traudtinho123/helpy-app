"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import {
  NURTURING_CAMPAIGN_LABELS,
  type NurturingCampaignType,
  type NurturingSettings,
} from "@/features/nurturing";
import {
  renderNurturingTemplate,
} from "@/features/nurturing/services/nurturing-templates";

const CAMPAIGNS: NurturingCampaignType[] = [
  "marktupdate",
  "jahrestag",
  "weiterempfehlung",
];

const ENABLE_KEYS: Record<
  NurturingCampaignType,
  keyof Pick<
    NurturingSettings,
    "marktupdateEnabled" | "jahrestagEnabled" | "weiterempfehlungEnabled"
  >
> = {
  marktupdate: "marktupdateEnabled",
  jahrestag: "jahrestagEnabled",
  weiterempfehlung: "weiterempfehlungEnabled",
};

type NurturingSettingsSectionProps = {
  settings: NurturingSettings;
  disabled?: boolean;
  onChange: (next: NurturingSettings) => void;
  companyName?: string;
};

export function NurturingSettingsSection({
  settings,
  disabled = false,
  onChange,
  companyName = "Ihre Firma",
}: NurturingSettingsSectionProps) {
  const [previewType, setPreviewType] =
    useState<NurturingCampaignType | null>(null);

  const updateEnabled = (
    type: NurturingCampaignType,
    enabled: boolean
  ) => {
    const key = ENABLE_KEYS[type];
    onChange({ ...settings, [key]: enabled });
  };

  const updateTemplate = (
    type: NurturingCampaignType,
    field: "subject" | "body",
    value: string
  ) => {
    onChange({
      ...settings,
      templates: {
        ...settings.templates,
        [type]: {
          ...settings.templates[type],
          [field]: value,
        },
      },
    });
  };

  const preview =
    previewType != null
      ? renderNurturingTemplate(settings.templates[previewType], {
          name: "Max Muster",
          objekt: "Musterstrasse 1",
          firma: companyName,
          signatur: "",
        })
      : null;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[15px] font-semibold text-[#0F172A]">
          Bestandskunden-Nurturing
        </h3>
        <p className="mt-1 text-[12px] text-[#64748B]">
          HELPY bereitet Mails vor — Senden nur nach manueller Genehmigung am
          Montag. Platzhalter: {"{{name}}"}, {"{{objekt}}"}, {"{{firma}}"},{" "}
          {"{{signatur}}"}.
        </p>
      </div>

      {CAMPAIGNS.map((type) => {
        const enabledKey = ENABLE_KEYS[type];
        const enabled = settings[enabledKey];
        const template = settings.templates[type];

        return (
          <div
            key={type}
            className="rounded-[16px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/60 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#0F172A]">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={disabled}
                  onChange={(event) =>
                    updateEnabled(type, event.target.checked)
                  }
                  className="size-4 rounded border-[#CBD5E1]"
                />
                {NURTURING_CAMPAIGN_LABELS[type]}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-[10px]"
                onClick={() =>
                  setPreviewType((current) =>
                    current === type ? null : type
                  )
                }
              >
                <Eye className="size-3.5" />
                Vorschau
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#64748B]">
                Betreff
              </label>
              <Input
                value={template.subject}
                disabled={disabled || !enabled}
                onChange={(event) =>
                  updateTemplate(type, "subject", event.target.value)
                }
                className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-white text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#64748B]">
                Text
              </label>
              <Textarea
                value={template.body}
                disabled={disabled || !enabled}
                rows={7}
                onChange={(event) =>
                  updateTemplate(type, "body", event.target.value)
                }
                className="rounded-[12px] border-[#CBD5E1]/60 bg-white text-[13px]"
              />
            </div>

            {previewType === type && preview ? (
              <div className="rounded-[12px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]">
                  Vorschau
                </p>
                <p className="text-[13px] font-medium text-[#0F172A]">
                  {preview.subject}
                </p>
                <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#334155]">
                  {preview.body}
                </pre>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
