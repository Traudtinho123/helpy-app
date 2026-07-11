"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, ShieldCheck, Users } from "lucide-react";
import { SettingsShell } from "@/components/settings/settings-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { HELPY_SKILLS, HELPY_SKILL_ORDER } from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { cn } from "@/lib/utils";

type CompanySummary = {
  id: string;
  name: string;
  industry: string | null;
  createdAt: string;
  memberCount: number;
  activeSkillCount: number;
};

type MemberRow = {
  userId: string;
  email: string | null;
  fullName: string;
  role: string;
  allowedSkills: HelpySkill[];
  hasAccess: boolean;
  isPlatformOperator: boolean;
};

const SKILL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "— Kein Skill (Zugang gesperrt) —" },
  ...HELPY_SKILL_ORDER.map((skill) => ({
    value: skill,
    label: HELPY_SKILLS[skill].label,
  })),
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OperatorAccessPanel() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adminConfigured, setAdminConfigured] = useState(true);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const loadCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    setError(null);
    try {
      const statusResponse = await fetch("/api/operator/status", {
        cache: "no-store",
      });
      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as {
          adminConfigured?: boolean;
        };
        setAdminConfigured(Boolean(status.adminConfigured));
      }

      const response = await fetch("/api/operator/companies", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        companies?: CompanySummary[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unternehmen konnten nicht geladen werden.");
      }

      const list = data.companies ?? [];
      setCompanies(list);
      setSelectedCompanyId((current) => current ?? list[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const loadMembers = useCallback(async (companyId: string) => {
    setLoadingMembers(true);
    setError(null);
    try {
      const response = await fetch(`/api/operator/companies/${companyId}/members`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        members?: MemberRow[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Mitglieder konnten nicht geladen werden.");
      }

      setMembers(data.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setMembers([]);
      return;
    }
    void loadMembers(selectedCompanyId);
  }, [loadMembers, selectedCompanyId]);

  const handleSkillChange = async (member: MemberRow, nextValue: string) => {
    setSavingUserId(member.userId);
    setFeedback(null);
    setError(null);

    const allowedSkills = nextValue ? [nextValue as HelpySkill] : [];

    try {
      const response = await fetch(
        `/api/operator/members/${member.userId}/allowed-skills`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allowedSkills }),
        }
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Speichern fehlgeschlagen.");
      }

      setMembers((current) =>
        current.map((row) =>
          row.userId === member.userId
            ? {
                ...row,
                allowedSkills,
                hasAccess: allowedSkills.length > 0,
              }
            : row
        )
      );

      setCompanies((current) =>
        current.map((company) => {
          if (company.id !== selectedCompanyId) return company;
          const activeDelta =
            (allowedSkills.length > 0 ? 1 : 0) - (member.hasAccess ? 1 : 0);
          return {
            ...company,
            activeSkillCount: Math.max(0, company.activeSkillCount + activeDelta),
          };
        })
      );

      setFeedback(
        allowedSkills.length > 0
          ? `${member.fullName}: ${HELPY_SKILLS[allowedSkills[0]].label} freigeschaltet.`
          : `${member.fullName}: Zugang entzogen.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    setCreatingCompany(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/operator/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });
      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Unternehmen konnte nicht angelegt werden.");
      }

      setNewCompanyName("");
      await loadCompanies();
      setSelectedCompanyId(data.id);
      setFeedback(`Unternehmen „${newCompanyName.trim()}“ angelegt.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setCreatingCompany(false);
    }
  };

  return (
    <SettingsShell
      title="Betreiber — Skill-Zugang"
      description="Unternehmen und Nutzerprofile verwalten. Hier schaltest du pro Person den HELPY-Skill frei."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {!adminConfigured && (
          <p className="rounded-[12px] border border-[#FDE68A]/60 bg-[#FFFBEB]/80 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#92400E]">
            Hinweis: Trage <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
            <code className="font-mono">.env.local</code> ein, damit E-Mail-Adressen der
            Nutzer geladen werden können (Supabase Dashboard → Project Settings → API).
          </p>
        )}

        {(feedback || error) && (
          <p
            className={cn(
              "rounded-[12px] px-3.5 py-2.5 text-[12px] leading-relaxed",
              error
                ? "border border-[#FECACA]/60 bg-[#FEF2F2]/70 text-[#B91C1C]"
                : "border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 text-[#047857]"
            )}
          >
            {error ?? feedback}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
            <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-[#0F172A]">
                <Building2 className="size-4 text-[#2563EB]" />
                Unternehmen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {loadingCompanies ? (
                <div className="flex items-center gap-2 px-2 py-4 text-[12px] text-[#64748B]">
                  <Loader2 className="size-4 animate-spin" />
                  Lade Unternehmen…
                </div>
              ) : companies.length === 0 ? (
                <p className="px-2 py-4 text-[12px] text-[#64748B]">
                  Noch keine Unternehmen vorhanden.
                </p>
              ) : (
                companies.map((company) => {
                  const active = company.id === selectedCompanyId;
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={cn(
                        "w-full rounded-[12px] px-3 py-2.5 text-left transition-colors",
                        active
                          ? "bg-[#EFF6FF] ring-1 ring-[#BFDBFE]/70"
                          : "hover:bg-[#F8FAFC]"
                      )}
                    >
                      <p className="text-[12px] font-semibold text-[#0F172A]">
                        {company.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#64748B]">
                        {company.memberCount} Nutzer · {company.activeSkillCount} freigeschaltet
                      </p>
                    </button>
                  );
                })
              )}

              <div className="border-t border-[#CBD5E1]/30 pt-3">
                <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                  Neues Unternehmen
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newCompanyName}
                    onChange={(event) => setNewCompanyName(event.target.value)}
                    placeholder="Firmenname"
                    className="h-9 rounded-[10px] text-[12px]"
                  />
                  <Button
                    type="button"
                    disabled={creatingCompany || !newCompanyName.trim()}
                    onClick={() => void handleCreateCompany()}
                    className="h-9 shrink-0 rounded-[10px] px-3 text-[11px]"
                  >
                    {creatingCompany ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Anlegen"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm">
            <CardHeader className="border-b border-[#CBD5E1]/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold text-[#0F172A]">
                <Users className="size-4 text-[#2563EB]" />
                {selectedCompany
                  ? `Nutzer — ${selectedCompany.name}`
                  : "Nutzerprofile"}
              </CardTitle>
              {selectedCompany && (
                <p className="text-[11px] text-[#64748B]">
                  Angelegt am {formatDate(selectedCompany.createdAt)}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!selectedCompanyId ? (
                <p className="px-5 py-8 text-[12px] text-[#64748B]">
                  Wähle links ein Unternehmen aus.
                </p>
              ) : loadingMembers ? (
                <div className="flex items-center gap-2 px-5 py-8 text-[12px] text-[#64748B]">
                  <Loader2 className="size-4 animate-spin" />
                  Lade Nutzer…
                </div>
              ) : members.length === 0 ? (
                <p className="px-5 py-8 text-[12px] text-[#64748B]">
                  Dieses Unternehmen hat noch keine Nutzerprofile.
                </p>
              ) : (
                <div className="divide-y divide-[#CBD5E1]/30">
                  {members.map((member) => (
                    <div key={member.userId} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#0F172A]">
                            {member.fullName}
                            {member.isPlatformOperator && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-medium text-[#2563EB]">
                                <ShieldCheck className="size-3" />
                                Betreiber
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#64748B]">
                            {member.email ?? "Keine E-Mail"}
                          </p>
                          <p className="mt-1 text-[10px] text-[#94A3B8]">
                            Rolle: {member.role}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                            member.hasAccess
                              ? "bg-[#ECFDF5] text-[#047857]"
                              : "bg-[#FEF2F2] text-[#B91C1C]"
                          )}
                        >
                          {member.hasAccess ? "Freigeschaltet" : "Zugang ausstehend"}
                        </span>
                      </div>

                      <div className="mt-3 max-w-sm">
                        <label className="mb-1 block text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                          HELPY-Skill
                        </label>
                        <Select
                          value={member.allowedSkills[0] ?? ""}
                          disabled={savingUserId === member.userId}
                          onChange={(event) =>
                            void handleSkillChange(member, event.target.value)
                          }
                          className="h-10 w-full rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[12px]"
                        >
                          {SKILL_OPTIONS.map((option) => (
                            <option key={option.value || "none"} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsShell>
  );
}
