"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCheck,
  Eye,
  Loader2,
  Mail,
  Pencil,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/input";
import {
  NURTURING_CAMPAIGN_LABELS,
  type NurturingMailRecord,
} from "@/features/nurturing";
import { cn } from "@/lib/utils";

type PreviewState = {
  mail: NurturingMailRecord;
  mode: "preview" | "edit";
} | null;

export function NurturingWorkdaySection() {
  const [mails, setMails] = useState<NurturingMailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (prepare = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = prepare
        ? "/api/nurturing?prepare=1&status=vorbereitet"
        : "/api/nurturing?status=vorbereitet";
      const response = await fetch(url, { cache: "no-store" });
      const data = (await response.json()) as {
        mails?: NurturingMailRecord[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Nurturing konnte nicht geladen werden.");
        setMails([]);
        return;
      }
      setMails(data.mails ?? []);
    } catch {
      setError("Nurturing konnte nicht geladen werden.");
      setMails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isMonday = new Date().getDay() === 1;
    void reload(isMonday);
  }, [reload]);

  const openPreview = (mail: NurturingMailRecord, mode: "preview" | "edit") => {
    setPreview({ mail, mode });
    setEditSubject(mail.subject);
    setEditBody(mail.body_text);
  };

  const saveEdit = async () => {
    if (!preview) return;
    setSending(preview.mail.id);
    try {
      const response = await fetch(`/api/nurturing/${preview.mail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject,
          body_text: editBody,
        }),
      });
      const data = (await response.json()) as {
        mail?: NurturingMailRecord;
        error?: string;
      };
      if (!response.ok || !data.mail) {
        setError(data.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setMails((prev) =>
        prev.map((item) => (item.id === data.mail!.id ? data.mail! : item))
      );
      setPreview({ mail: data.mail, mode: "preview" });
    } finally {
      setSending(null);
    }
  };

  const sendOne = async (mailId: string) => {
    setSending(mailId);
    setError(null);
    try {
      const response = await fetch(`/api/nurturing/${mailId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send" }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Senden fehlgeschlagen.");
        return;
      }
      setMails((prev) => prev.filter((item) => item.id !== mailId));
      setPreview(null);
    } finally {
      setSending(null);
    }
  };

  const sendAll = async () => {
    if (
      !window.confirm(
        `${mails.length} Nurturing-Mails genehmigen und über Gmail senden?`
      )
    ) {
      return;
    }
    setSending("all");
    setError(null);
    try {
      const response = await fetch("/api/nurturing/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendAll: true }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Massensenden fehlgeschlagen.");
        return;
      }
      await reload(false);
      setPreview(null);
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <section className="flex items-center gap-2 text-[13px] text-[#64748B]">
        <Loader2 className="size-4 animate-spin" />
        Nurturing wird geprüft…
      </section>
    );
  }

  if (mails.length === 0 && !error) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#FEF3C7]">
            <Mail className="size-5 text-[#B45309]" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-[1.2rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              📬 {mails.length} Nurturing-Mails bereit zur Genehmigung
            </h2>
            <p className="mt-0.5 text-[12px] text-[#64748B]">
              HELPY hat vorbereitet — Senden nur nach deiner Freigabe
            </p>
          </div>
        </div>
        {mails.length > 0 ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void sendAll()}
            disabled={sending === "all"}
            className="rounded-[12px] bg-[#0F172A] text-white hover:bg-[#1E293B]"
          >
            {sending === "all" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Alle genehmigen & senden
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {mails.map((mail) => (
          <li
            key={mail.id}
            className="rounded-[20px] border border-[#CBD5E1]/50 bg-white/90 px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#0F172A]">
                    {mail.kunde_name ?? mail.to_email}
                  </p>
                  <Badge
                    variant="outline"
                    className="h-5 rounded-full border-[#FDE68A]/70 bg-[#FFFBEB]/80 px-2 text-[10px] font-semibold text-[#B45309]"
                  >
                    {NURTURING_CAMPAIGN_LABELS[mail.campaign_type]}
                  </Badge>
                </div>
                <p className="truncate text-[12px] text-[#64748B]">
                  {mail.subject}
                </p>
                {mail.objekt_label ? (
                  <p className="text-[11px] text-[#94A3B8]">
                    Objekt: {mail.objekt_label}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[12px]"
                  onClick={() => openPreview(mail, "preview")}
                >
                  <Eye className="size-3.5" />
                  Vorschau
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[12px]"
                  onClick={() => openPreview(mail, "edit")}
                >
                  <Pencil className="size-3.5" />
                  Bearbeiten
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-[12px] bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  disabled={sending === mail.id}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Nurturing-Mail an ${mail.to_email} jetzt über Gmail senden?`
                      )
                    ) {
                      void sendOne(mail.id);
                    }
                  }}
                >
                  {sending === mail.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Senden
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
                  {preview.mode === "edit" ? "Bearbeiten" : "Vorschau"}
                </p>
                <h3 className="text-[16px] font-semibold text-[#0F172A]">
                  {preview.mail.kunde_name}
                </h3>
              </div>
              <button
                type="button"
                className="text-[13px] text-[#64748B]"
                onClick={() => setPreview(null)}
              >
                Schliessen
              </button>
            </div>

            {preview.mode === "edit" ? (
              <div className="space-y-3">
                <Input
                  value={editSubject}
                  onChange={(event) => setEditSubject(event.target.value)}
                  className="rounded-[12px]"
                />
                <Textarea
                  value={editBody}
                  onChange={(event) => setEditBody(event.target.value)}
                  rows={12}
                  className="rounded-[12px] text-[13px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreview(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void saveEdit()}
                    disabled={sending === preview.mail.id}
                  >
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p
                  className={cn(
                    "rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] font-medium text-[#0F172A]"
                  )}
                >
                  {preview.mail.subject}
                </p>
                <pre className="whitespace-pre-wrap rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-3 text-[13px] leading-relaxed text-[#334155]">
                  {preview.mail.body_text}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
