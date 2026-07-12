"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsShell } from "@/components/settings/settings-shell";

type AdminCompany = {
  id: string;
  name: string;
  requestedSkill: string | null;
  registrationStatus: "pending" | "active" | "suspended";
  createdAt: string;
  adminEmail: string | null;
  adminName: string | null;
};

const SKILL_LABELS: Record<string, string> = {
  "real-estate": "HELPY Real Estate",
  construction: "HELPY Construction",
  "consulting-legal": "HELPY Consulting & Legal",
  friseur: "HELPY Friseur",
  other: "Anderes",
};

function statusLabel(status: AdminCompany["registrationStatus"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "suspended":
      return "Gesperrt";
    default:
      return "Aktiv";
  }
}

export function AdminPanelPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/companies", { cache: "no-store" });
    if (!response.ok) {
      setError("Kein Zugriff auf das Admin-Panel.");
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as { companies?: AdminCompany[] };
    setCompanies(payload.companies ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleActivate = async (company: AdminCompany) => {
    const skill = company.requestedSkill ?? "real-estate";
    const mappedSkill =
      skill === "friseur" || skill === "other" ? "real-estate" : skill;

    setActivatingId(company.id);
    const response = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: company.id,
        skill: mappedSkill,
        adminEmail: company.adminEmail,
      }),
    });
    setActivatingId(null);

    if (!response.ok) {
      setError("Freischaltung fehlgeschlagen.");
      return;
    }

    void reload();
  };

  return (
    <SettingsShell
      title="Super-Admin Panel"
      description="Registrierte Firmen verwalten und Skills freischalten."
    >
        {loading ? (
          <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
            <Loader2 className="size-4 animate-spin" />
            Firmen laden…
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </p>
        ) : companies.length === 0 ? (
          <p className="text-[13px] text-[#64748B]">Keine Firmen gefunden.</p>
        ) : (
          <ul className="space-y-3">
            {companies.map((company) => (
              <li
                key={company.id}
                className="rounded-[16px] border border-[#E2E8F0] bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-[#0F172A]">
                      {company.name}
                    </p>
                    <p className="mt-1 text-[12px] text-[#64748B]">
                      {company.adminName ?? "—"} · {company.adminEmail ?? "—"}
                    </p>
                    <p className="mt-1 text-[12px] text-[#64748B]">
                      Skill:{" "}
                      {SKILL_LABELS[company.requestedSkill ?? ""] ??
                        company.requestedSkill ??
                        "—"}{" "}
                      · Status: {statusLabel(company.registrationStatus)}
                    </p>
                  </div>
                  {company.registrationStatus === "pending" ? (
                    <Button
                      size="sm"
                      disabled={activatingId === company.id}
                      onClick={() => void handleActivate(company)}
                    >
                      {activatingId === company.id ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Wird freigeschaltet…
                        </>
                      ) : (
                        "Skill freischalten"
                      )}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
    </SettingsShell>
  );
}
