"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useCompanyProfile } from "@/components/company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import {
  cloneCompanyKnowledge,
  companyKnowledgeEquals,
} from "@/features/company-knowledge/services/company-knowledge-defaults";
import {
  ensureCompanyKnowledgeLoaded,
  getCompanyKnowledge,
  saveCompanyKnowledge,
} from "@/features/company-knowledge/services/company-knowledge-service";
import { validateCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-validator";
import {
  REPLY_STYLE_LABELS,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type CompanyKnowledge,
  type CompanyKnowledgeFaqEntry,
  type CompanyKnowledgeService,
  type ReplyStyleId,
} from "@/features/company-knowledge/types/company-knowledge-types";
import { DOCUMENT_LANGUAGE_LABELS } from "@/lib/company/company-profile-types";
import { useUserProfileContext } from "@/lib/user/components/user-profile-context";
import { cn } from "@/lib/utils";

const inputClass =
  "h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[13px]";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
      {hint ? <p className="text-[10px] text-[#94A3B8]">{hint}</p> : null}
    </div>
  );
}

export function CompanyKnowledgeForm() {
  const { profile } = useCompanyProfile();
  const { profile: userProfile } = useUserProfileContext();
  const [baseline, setBaseline] = useState<CompanyKnowledge>(() =>
    getCompanyKnowledge(profile.companyId)
  );
  const [draft, setDraft] = useState<CompanyKnowledge>(() =>
    cloneCompanyKnowledge(getCompanyKnowledge(profile.companyId))
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void ensureCompanyKnowledgeLoaded(profile.companyId).then((result) => {
      if (cancelled) return;

      if (!result.ok) {
        setLoadError(result.error);
        setIsLoading(false);
        return;
      }

      const loaded = cloneCompanyKnowledge(result.knowledge);
      setBaseline(loaded);
      setDraft(cloneCompanyKnowledge(loaded));
      setErrors([]);
      setSavedHint(null);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [profile.companyId]);

  const isDirty = useMemo(
    () => !companyKnowledgeEquals(draft, baseline),
    [baseline, draft]
  );

  const updateDraft = useCallback(
    (patch: Partial<CompanyKnowledge>) => {
      setDraft((current) => ({ ...current, ...patch }));
      setSavedHint(null);
    },
    []
  );

  const handleSave = async () => {
    const validation = validateCompanyKnowledge(draft);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    const result = await saveCompanyKnowledge(draft, userProfile.userId);
    setIsSaving(false);

    if (!result.ok) {
      setErrors([result.error]);
      setSavedHint(null);
      return;
    }

    const saved = cloneCompanyKnowledge(result.knowledge);
    setBaseline(result.knowledge);
    setDraft(saved);
    setErrors([]);
    setLoadError(null);
    setSavedHint("Unternehmenswissen gespeichert.");
  };

  const handleDiscard = () => {
    setDraft(cloneCompanyKnowledge(baseline));
    setErrors([]);
    setSavedHint(null);
  };

  const addService = () => {
    const entry: CompanyKnowledgeService = {
      id: createId("svc"),
      name: "",
      description: "",
      priceLabel: "",
    };
    updateDraft({ services: [...draft.services, entry] });
  };

  const updateService = (
    id: string,
    patch: Partial<CompanyKnowledgeService>
  ) => {
    updateDraft({
      services: draft.services.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const removeService = (id: string) => {
    updateDraft({
      services: draft.services.filter((item) => item.id !== id),
    });
  };

  const addLocation = () => {
    updateDraft({ locations: [...draft.locations, ""] });
  };

  const updateLocation = (index: number, value: string) => {
    updateDraft({
      locations: draft.locations.map((item, idx) =>
        idx === index ? value : item
      ),
    });
  };

  const removeLocation = (index: number) => {
    updateDraft({
      locations: draft.locations.filter((_, idx) => idx !== index),
    });
  };

  const addRule = () => {
    updateDraft({ internalRules: [...draft.internalRules, ""] });
  };

  const updateRule = (index: number, value: string) => {
    updateDraft({
      internalRules: draft.internalRules.map((item, idx) =>
        idx === index ? value : item
      ),
    });
  };

  const removeRule = (index: number) => {
    updateDraft({
      internalRules: draft.internalRules.filter((_, idx) => idx !== index),
    });
  };

  const addFaq = () => {
    const entry: CompanyKnowledgeFaqEntry = {
      id: createId("faq"),
      question: "",
      answer: "",
    };
    updateDraft({ faq: [...draft.faq, entry] });
  };

  const updateFaq = (id: string, patch: Partial<CompanyKnowledgeFaqEntry>) => {
    updateDraft({
      faq: draft.faq.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  };

  const removeFaq = (id: string) => {
    updateDraft({
      faq: draft.faq.filter((item) => item.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
          <p className="text-[12px] text-[#64748B]">Firmenwissen wird geladen …</p>
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
          <p className="text-[12px] text-[#B91C1C]">{loadError}</p>
          <p className="mt-1 text-[11px] text-[#991B1B]">
            Ohne Verbindung zu Supabase kann kein Firmenwissen geladen oder
            gespeichert werden.
          </p>
        </div>
      ) : null}

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Unternehmenswissen für HELPY
          </CardTitle>
          <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
            HELPY nutzt dieses Wissen für Antworten, Termine, Dokumente und
            Empfehlungen. Stammdaten wie Firmenname oder Telefon kommen aus den{" "}
            <span className="font-medium text-[#475569]">Firmendaten</span>{" "}
            oben — hier pflegst du nur ergänzendes Wissen.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC]/80 px-3 py-2.5 sm:col-span-2">
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Aus Firmendaten (nur Anzeige)
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p className="text-[12px] text-[#334155]">
                <span className="text-[#64748B]">Firmenname:</span>{" "}
                {profile.companyName || "—"}
              </p>
              <p className="text-[12px] text-[#334155]">
                <span className="text-[#64748B]">Branche:</span>{" "}
                {profile.industry || "—"}
              </p>
              <p className="text-[12px] text-[#334155]">
                <span className="text-[#64748B]">Telefon:</span>{" "}
                {profile.phone || "—"}
              </p>
              <p className="text-[12px] text-[#334155]">
                <span className="text-[#64748B]">E-Mail:</span>{" "}
                {profile.email || "—"}
              </p>
              <p className="text-[12px] text-[#334155]">
                <span className="text-[#64748B]">Website:</span>{" "}
                {profile.website || "—"}
              </p>
              <p className="text-[12px] text-[#334155]">
                <span className="text-[#64748B]">Sprache:</span>{" "}
                {DOCUMENT_LANGUAGE_LABELS[profile.documentLanguage]}
              </p>
            </div>
            <p className="mt-2 text-[10px] text-[#94A3B8]">
              Änderungen an Stammdaten in den Firmendaten-Karten oben auf dieser
              Seite.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Allgemein
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <Field
            label="Unternehmensbeschreibung"
            hint="Kurzbeschreibung für HELPY — wer ihr seid und was ihr anbietet."
          >
            <Textarea
              value={draft.companyDescription}
              onChange={(event) =>
                updateDraft({ companyDescription: event.target.value })
              }
              rows={4}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-[#64748B]">Standorte</p>
              <Button
                type="button"
                variant="outline"
                onClick={addLocation}
                className="h-8 rounded-[10px] px-3 text-[11px]"
              >
                <Plus className="size-3.5" />
                Standort
              </Button>
            </div>
            {draft.locations.length === 0 ? (
              <p className="text-[11px] text-[#94A3B8]">
                Noch keine Standorte. Hauptadresse: {profile.address || "—"}
              </p>
            ) : (
              <div className="space-y-2">
                {draft.locations.map((location, index) => (
                  <div key={`location-${index}`} className="flex gap-2">
                    <Input
                      value={location}
                      onChange={(event) =>
                        updateLocation(index, event.target.value)
                      }
                      className={inputClass}
                      placeholder="z. B. München, Grünwald"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeLocation(index)}
                      className="h-10 shrink-0 rounded-[10px] px-3"
                      aria-label="Standort entfernen"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Dienstleistungen
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={addService}
            className="h-8 rounded-[10px] px-3 text-[11px]"
          >
            <Plus className="size-3.5" />
            Hinzufügen
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {draft.services.length === 0 ? (
            <p className="text-[11px] text-[#94A3B8]">
              Noch keine Dienstleistungen hinterlegt.
            </p>
          ) : (
            draft.services.map((service) => (
              <div
                key={service.id}
                className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC]/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    Dienstleistung
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeService(service.id)}
                    className="h-8 rounded-[10px] px-3 text-[11px]"
                  >
                    Entfernen
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name">
                    <Input
                      value={service.name}
                      onChange={(event) =>
                        updateService(service.id, { name: event.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Preis / Preisspanne (optional)">
                    <Input
                      value={service.priceLabel}
                      onChange={(event) =>
                        updateService(service.id, {
                          priceLabel: event.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="z. B. ab CHF 500 oder CHF 80–120/h"
                    />
                  </Field>
                  <Field label="Beschreibung" className="sm:col-span-2">
                    <Textarea
                      value={service.description}
                      onChange={(event) =>
                        updateService(service.id, {
                          description: event.target.value,
                        })
                      }
                      rows={2}
                    />
                  </Field>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Arbeitszeiten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-5">
          {WEEKDAY_ORDER.map((day) => {
            const hours = draft.businessHours[day];
            return (
              <div
                key={day}
                className="grid items-center gap-2 rounded-[12px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/60 px-3 py-2 sm:grid-cols-[120px_1fr_1fr_auto]"
              >
                <p className="text-[12px] font-medium text-[#334155]">
                  {WEEKDAY_LABELS[day]}
                </p>
                <Input
                  type="time"
                  value={hours.start}
                  disabled={hours.closed}
                  onChange={(event) =>
                    updateDraft({
                      businessHours: {
                        ...draft.businessHours,
                        [day]: { ...hours, start: event.target.value },
                      },
                    })
                  }
                  className={cn(inputClass, "h-9")}
                />
                <Input
                  type="time"
                  value={hours.end}
                  disabled={hours.closed}
                  onChange={(event) =>
                    updateDraft({
                      businessHours: {
                        ...draft.businessHours,
                        [day]: { ...hours, end: event.target.value },
                      },
                    })
                  }
                  className={cn(inputClass, "h-9")}
                />
                <label className="flex items-center gap-2 text-[11px] text-[#64748B]">
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(event) =>
                      updateDraft({
                        businessHours: {
                          ...draft.businessHours,
                          [day]: { ...hours, closed: event.target.checked },
                        },
                      })
                    }
                    className="size-4 rounded border-[#CBD5E1]"
                  />
                  Geschlossen
                </label>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Kommunikation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Antwortstil" className="sm:col-span-2">
            <select
              value={draft.replyStyle}
              onChange={(event) =>
                updateDraft({
                  replyStyle: event.target.value as ReplyStyleId,
                })
              }
              className="h-10 w-full rounded-[12px] border border-[#CBD5E1]/60 bg-[#F8FAFC]/80 px-3 text-[13px] text-[#0F172A] outline-none"
            >
              {(
                Object.entries(REPLY_STYLE_LABELS) as [ReplyStyleId, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          {draft.replyStyle === "custom" ? (
            <Field label="Individueller Antwortstil" className="sm:col-span-2">
              <Textarea
                value={draft.replyStyleCustom}
                onChange={(event) =>
                  updateDraft({ replyStyleCustom: event.target.value })
                }
                rows={2}
              />
            </Field>
          ) : null}
          <Field
            label="E-Mail-Signatur (optional)"
            hint={
              profile.companySignature.trim()
                ? "Leer lassen = Signatur aus Firmendaten wird verwendet."
                : "Optional eigene Signatur für HELPY-Antworten."
            }
            className="sm:col-span-2"
          >
            <Textarea
              value={draft.emailSignatureOverride}
              onChange={(event) =>
                updateDraft({ emailSignatureOverride: event.target.value })
              }
              rows={4}
              placeholder={profile.companySignature || "Mit freundlichen Grüssen …"}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Termine
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Standarddauer Besichtigung (Min.)">
            <Input
              type="number"
              min={5}
              value={draft.appointmentDurationViewingMinutes}
              onChange={(event) =>
                updateDraft({
                  appointmentDurationViewingMinutes:
                    Number(event.target.value) || 0,
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Standarddauer Beratung (Min.)">
            <Input
              type="number"
              min={5}
              value={draft.appointmentDurationConsultationMinutes}
              onChange={(event) =>
                updateDraft({
                  appointmentDurationConsultationMinutes:
                    Number(event.target.value) || 0,
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Standarddauer Vor-Ort-Termin (Min.)">
            <Input
              type="number"
              min={5}
              value={draft.appointmentDurationOnSiteMinutes}
              onChange={(event) =>
                updateDraft({
                  appointmentDurationOnSiteMinutes:
                    Number(event.target.value) || 0,
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Pufferzeit zwischen Terminen (Min.)">
            <Input
              type="number"
              min={0}
              value={draft.defaultBufferMinutes}
              onChange={(event) =>
                updateDraft({
                  defaultBufferMinutes: Number(event.target.value) || 0,
                })
              }
              className={inputClass}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            Interne Regeln
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={addRule}
            className="h-8 rounded-[10px] px-3 text-[11px]"
          >
            <Plus className="size-3.5" />
            Regel
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 p-5">
          {draft.internalRules.length === 0 ? (
            <p className="text-[11px] text-[#94A3B8]">Noch keine Regeln.</p>
          ) : (
            draft.internalRules.map((rule, index) => (
              <div key={`rule-${index}`} className="flex gap-2">
                <Input
                  value={rule}
                  onChange={(event) => updateRule(index, event.target.value)}
                  className={inputClass}
                  placeholder="z. B. Besichtigungen nur Montag bis Freitag."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeRule(index)}
                  className="h-10 shrink-0 rounded-[10px] px-3"
                  aria-label="Regel entfernen"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[#CBD5E1]/30 pb-4">
          <CardTitle className="text-[13px] font-semibold text-[#0F172A]">
            FAQ
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            onClick={addFaq}
            className="h-8 rounded-[10px] px-3 text-[11px]"
          >
            <Plus className="size-3.5" />
            FAQ-Eintrag
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          {draft.faq.length === 0 ? (
            <p className="text-[11px] text-[#94A3B8]">Noch keine FAQ-Einträge.</p>
          ) : (
            draft.faq.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC]/70 p-4"
              >
                <div className="mb-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeFaq(entry.id)}
                    className="h-8 rounded-[10px] px-3 text-[11px]"
                  >
                    Entfernen
                  </Button>
                </div>
                <div className="space-y-3">
                  <Field label="Frage">
                    <Input
                      value={entry.question}
                      onChange={(event) =>
                        updateFaq(entry.id, { question: event.target.value })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Standardantwort">
                    <Textarea
                      value={entry.answer}
                      onChange={(event) =>
                        updateFaq(entry.id, { answer: event.target.value })
                      }
                      rows={3}
                    />
                  </Field>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {errors.length > 0 ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
          {errors.map((error) => (
            <p key={error} className="text-[12px] text-[#B91C1C]">
              {error}
            </p>
          ))}
        </div>
      ) : null}

      {savedHint ? (
        <p className="text-[12px] font-medium text-[#16A34A]">{savedHint}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <p className="text-[10px] text-[#94A3B8]">
          {baseline.updatedAt
            ? `Zuletzt gespeichert: ${new Date(baseline.updatedAt).toLocaleString("de-CH")}${baseline.updatedBy ? ` · ${baseline.updatedBy}` : ""}`
            : "Noch nicht gespeichert"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isLoading || isSaving || Boolean(loadError)}
            onClick={handleDiscard}
            className="h-10 gap-2 rounded-[12px] px-4 text-[12px]"
          >
            <RotateCcw className="size-4" />
            Änderungen verwerfen
          </Button>
          <Button
            type="button"
            disabled={!isDirty || isLoading || isSaving || Boolean(loadError)}
            onClick={() => void handleSave()}
            className="h-10 gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-5 text-[12px] font-semibold text-white shadow-sm disabled:opacity-50"
          >
            <Save className="size-4" />
            {isSaving ? "Speichern …" : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}
