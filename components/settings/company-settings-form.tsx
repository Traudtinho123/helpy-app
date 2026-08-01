"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CompanyLogoUploadPlaceholder,
  useCompanyProfile,
} from "@/components/company";
import {
  DOCUMENT_LANGUAGE_LABELS,
  type DocumentLanguage,
} from "@/lib/company/company-profile";
import { SettingsShell } from "@/components/settings/settings-shell";
import { CompanyKnowledgeForm } from "@/features/company-knowledge/components/company-knowledge-form";
import { WeeklyReportSettingsCard } from "@/components/settings/weekly-report-settings-card";
import { useCanEditAISettings } from "@/components/auth/permissions-provider";

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <label className="text-[11px] font-medium text-[#64748B]">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[#94A3B8]">{hint}</p>}
    </div>
  );
}

const inputClass =
  "h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[13px]";

export function CompanySettingsForm() {
  const { profile, updateProfile, saveProfile, isHydrating, hydrationError } =
    useCompanyProfile();
  const canEdit = useCanEditAISettings();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const result = await saveProfile();
    setIsSaving(false);

    if (!result.ok) {
      setSaveError(result.error);
      return;
    }

    setSaveMessage("Gespeichert ✓");
    window.setTimeout(() => setSaveMessage(null), 4000);
  };

  return (
    <SettingsShell
      title="Unternehmen"
      description="Branding und Firmendaten für Angebote, Offerten, Rechnungen und Dokumente."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {isHydrating ? (
          <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            <p className="text-[12px] text-[#64748B]">Firmendaten werden geladen …</p>
          </div>
        ) : null}

        {hydrationError ? (
          <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
            <p className="text-[12px] text-[#B91C1C]">{hydrationError}</p>
            <p className="mt-1 text-[11px] text-[#991B1B]">
              Änderungen werden lokal vorbereitet, aber erst nach erfolgreicher
              Verbindung zu Supabase dauerhaft gespeichert.
            </p>
          </div>
        ) : null}

        {!canEdit ? (
          <div className="rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
            <p className="text-[12px] text-[#92400E]">
              Nur Admins können Firmendaten ändern.
            </p>
          </div>
        ) : null}

        <fieldset disabled={!canEdit || isSaving} className="space-y-6">
        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Firmenlogo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <CompanyLogoUploadPlaceholder
              profile={profile}
              onLogoChange={(logoUrl) => updateProfile({ logoUrl })}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Firmendaten
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Firmenname" hint="Erscheint auf allen Dokumenten">
              <Input
                value={profile.companyName}
                onChange={(e) =>
                  updateProfile({ companyName: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Logo-Kürzel" hint="Wird genutzt, wenn kein Logo hochgeladen ist">
              <Input
                value={profile.logoInitials}
                maxLength={3}
                onChange={(e) =>
                  updateProfile({ logoInitials: e.target.value.toUpperCase() })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Adresse" className="space-y-1.5 sm:col-span-2">
              <Input
                value={profile.address}
                onChange={(e) => updateProfile({ address: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Telefon">
              <Input
                value={profile.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="E-Mail">
              <Input
                value={profile.email}
                onChange={(e) => updateProfile({ email: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Website">
              <Input
                value={profile.website}
                onChange={(e) => updateProfile({ website: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="UID / USt-ID">
              <Input
                value={profile.taxId}
                onChange={(e) => updateProfile({ taxId: e.target.value })}
                className={inputClass}
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Finanzen & Dokumente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Bankverbindung / IBAN">
              <Input
                value={profile.iban}
                onChange={(e) => updateProfile({ iban: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Standard MwSt. (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={profile.defaultVatRate}
                onChange={(e) =>
                  updateProfile({
                    defaultVatRate: Number(e.target.value) || 0,
                  })
                }
                className={inputClass}
              />
            </Field>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[#64748B]">
                Zahlungsbedingungen
              </label>
              <textarea
                value={profile.paymentTerms}
                onChange={(e) =>
                  updateProfile({ paymentTerms: e.target.value })
                }
                rows={3}
                className="w-full resize-none rounded-[12px] border border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-3 py-2.5 text-[13px] text-[#0F172A] outline-none"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[#64748B]">
                Fußzeile
              </label>
              <textarea
                value={profile.footer}
                onChange={(e) => updateProfile({ footer: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-[12px] border border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-3 py-2.5 text-[13px] text-[#0F172A] outline-none"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Erscheint am Ende von Angeboten, Offerten und Dokumenten
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
          <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
            <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
              Erscheinungsbild
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Primärfarbe" hint="Akzente in Dokumentvorschauen">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profile.primaryColor}
                  onChange={(e) =>
                    updateProfile({ primaryColor: e.target.value })
                  }
                  className="size-10 cursor-pointer rounded-[10px] border border-[#CBD5E1]/60 bg-white p-1"
                />
                <Input
                  value={profile.primaryColor}
                  onChange={(e) =>
                    updateProfile({ primaryColor: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </Field>
            <Field label="Dokumentensprache">
              <select
                value={profile.documentLanguage}
                onChange={(e) =>
                  updateProfile({
                    documentLanguage: e.target.value as DocumentLanguage,
                  })
                }
                className="h-10 w-full rounded-[12px] border border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-3 text-[13px] text-[#0F172A] outline-none"
              >
                {(
                  Object.entries(DOCUMENT_LANGUAGE_LABELS) as [
                    DocumentLanguage,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </CardContent>
        </Card>

        <CompanyKnowledgeForm />

        <WeeklyReportSettingsCard />
        </fieldset>

        <div className="flex flex-col items-end gap-2 pb-6">
          {saveMessage ? (
            <p className="text-[12px] font-medium text-[#047857]">{saveMessage}</p>
          ) : null}
          {saveError ? (
            <p className="max-w-md text-right text-[12px] font-medium text-[#B91C1C]">
              {saveError}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={!canEdit || isSaving || isHydrating}
            onClick={() => void handleSave()}
            className="h-10 gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-5 text-[12px] font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving ? "Speichern …" : "Änderungen speichern"}
          </Button>
        </div>
      </div>
    </SettingsShell>
  );
}
