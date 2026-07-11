"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  FileText,
  Hammer,
  Landmark,
  Package,
  Scale,
} from "lucide-react";
import {
  CustomerSection,
  DocumentsSection,
  EmailSection,
  GenericFieldsSection,
  NotesSection,
  OfferEditorSection,
  TermineSection,
} from "@/features/workspace/components/workspace-sections";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { HelpySkill, SkillTabId } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { cn } from "@/lib/utils";

type WorkspaceMiddleColumnProps = {
  vorgang: Vorgang;
};

function SkillTabContent({
  vorgang,
  tabId,
  skill,
}: {
  vorgang: Vorgang;
  tabId: SkillTabId;
  skill: HelpySkill;
}) {
  const { kunde, aufgabe, letzteEmail, angebot, termine, dokumente, notizen } =
    vorgang;

  if (skill === "real-estate") {
    switch (tabId) {
      case "objekt":
        return (
          <GenericFieldsSection
            title="Objekt"
            icon={Building2}
            fields={[
              { label: "Objekt / Adresse", value: kunde.adresse },
              { label: "Objekttyp", value: kunde.branche ?? "Gewerbeimmobilie" },
              { label: "Status", value: kunde.status },
              { label: "Ansprechpartner vor Ort", value: kunde.ansprechpartner },
            ]}
          />
        );
      case "besichtigung":
        return <TermineSection termine={termine} />;
      case "interessent":
        return (
          <div className="space-y-5">
            <CustomerSection vorgang={vorgang} />
            <EmailSection vorgang={vorgang} />
          </div>
        );
      case "finanzierung":
        return (
          <GenericFieldsSection
            title="Finanzierung"
            icon={Landmark}
            fields={[
              {
                label: "Finanzierungsstatus",
                value: "In Prüfung",
              },
              {
                label: "Budgetrahmen",
                value: letzteEmail.zusammenfassung.includes("85.000")
                  ? "ca. 85.000 €"
                  : "Noch offen",
              },
              { label: "Bank / Partner", value: "—" },
              { label: "Nächster Schritt", value: aufgabe.empfohleneAktion },
            ]}
          />
        );
      case "expose":
        return (
          <div className="space-y-5">
            <DocumentsSection dokumente={dokumente} />
            {angebot && <OfferEditorSection angebot={angebot} />}
          </div>
        );
      case "notizen":
        return <NotesSection notizen={notizen} />;
      default:
        return null;
    }
  }

  if (skill === "construction") {
    switch (tabId) {
      case "kunde":
        return (
          <div className="space-y-5">
            <CustomerSection vorgang={vorgang} />
            <EmailSection vorgang={vorgang} />
          </div>
        );
      case "baustelle":
        return (
          <GenericFieldsSection
            title="Baustelle"
            icon={Hammer}
            fields={[
              { label: "Standort", value: kunde.adresse },
              { label: "Auftraggeber", value: kunde.firmenname },
              { label: "Ansprechpartner", value: kunde.ansprechpartner },
              { label: "Telefon", value: kunde.telefon, highlight: true },
              { label: "Fortschritt", value: `${aufgabe.fortschritt} %` },
            ]}
          />
        );
      case "material":
        return angebot ? (
          <OfferEditorSection angebot={angebot} />
        ) : (
          <GenericFieldsSection
            title="Material"
            icon={Package}
            fields={[
              { label: "Status", value: "Noch keine Positionen hinterlegt" },
            ]}
          />
        );
      case "termin":
        return <TermineSection termine={termine} />;
      case "offerte":
        return angebot ? (
          <OfferEditorSection angebot={angebot} />
        ) : (
          <GenericFieldsSection
            title="Offerte"
            icon={FileText}
            fields={[{ label: "Status", value: "Noch keine Offerte angelegt" }]}
          />
        );
      case "notizen":
        return <NotesSection notizen={notizen} />;
      default:
        return null;
    }
  }

  if (skill === "consulting-legal") {
    switch (tabId) {
      case "mandant":
        return <CustomerSection vorgang={vorgang} />;
      case "projekt":
        return (
          <div className="space-y-5">
            <GenericFieldsSection
              title="Projekt / Mandat"
              icon={Scale}
              fields={[
                { label: "Mandat", value: aufgabe.titel },
                { label: "Kategorie", value: aufgabe.kategorie },
                { label: "Fortschritt", value: `${aufgabe.fortschritt} %` },
                { label: "Nächster Schritt", value: aufgabe.empfohleneAktion },
              ]}
            />
            <EmailSection vorgang={vorgang} />
          </div>
        );
      case "fristen":
        return (
          <GenericFieldsSection
            title="Fristen"
            icon={Calendar}
            fields={[
              {
                label: "Aktuelle Frist",
                value: aufgabe.deadline ?? "Keine Frist hinterlegt",
                highlight: Boolean(aufgabe.deadline),
              },
              {
                label: "Letzte E-Mail",
                value: letzteEmail.datum,
              },
              {
                label: "Priorität",
                value: aufgabe.deadline ? "Hoch" : "Normal",
              },
            ]}
          />
        );
      case "dokumente":
        return <DocumentsSection dokumente={dokumente} />;
      case "erstgespraech":
        return (
          <div className="space-y-5">
            <TermineSection termine={termine} />
            <EmailSection vorgang={vorgang} />
          </div>
        );
      case "notizen":
        return <NotesSection notizen={notizen} />;
      default:
        return null;
    }
  }

  return null;
}

export function WorkspaceMiddleColumn({ vorgang }: WorkspaceMiddleColumnProps) {
  const skillConfig = getSkillConfig(vorgang.skill);
  const [activeTab, setActiveTab] = useState(skillConfig.tabs[0]?.id ?? "");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2563EB]">
            {skillConfig.label}
          </p>
          <p className="mt-0.5 text-[13px] text-[#64748B]">
            Inhalt passt sich dem Vorgang an
          </p>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-2 rounded-[16px] border border-[#CBD5E1]/40 bg-white/80 p-2 backdrop-blur-sm"
        aria-label="Vorgangs-Bereiche"
      >
        {skillConfig.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-[10px] px-3.5 py-2 text-[12px] font-semibold transition-all duration-300",
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-[0_2px_12px_rgba(37,99,235,0.3)]"
                : "text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="helpy-fade-in" key={`${vorgang.skill}-${activeTab}`}>
        <SkillTabContent
          vorgang={vorgang}
          tabId={activeTab}
          skill={vorgang.skill}
        />
      </div>
    </div>
  );
}
