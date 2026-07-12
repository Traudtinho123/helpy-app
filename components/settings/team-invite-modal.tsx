"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { TeamInviteInput } from "@/lib/team/types/team-types";
import type { TenantUserRole } from "@/lib/tenant/types/tenant-types";
import { ROLE_LABELS } from "@/lib/team/services/team-permissions";

type TeamInviteModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: TeamInviteInput) => void;
  loading?: boolean;
};

export function TeamInviteModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}: TeamInviteModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TenantUserRole>("EMPLOYEE");

  const handleSubmit = () => {
    onSubmit({ fullName, email, role });
  };

  const handleClose = () => {
    if (loading) return;
    setFullName("");
    setEmail("");
    setRole("EMPLOYEE");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Mitarbeiter einladen"
      description="Die Person erhält eine Einladungs-E-Mail und kann sich anschließend anmelden."
      onClose={handleClose}
      maxWidth="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !fullName.trim() || !email.trim()}
            className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white"
          >
            Einladung senden
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">Name</label>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[13px]"
            placeholder="Vor- und Nachname"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">E-Mail</label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[13px]"
            placeholder="name@unternehmen.de"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[#64748B]">Rolle</label>
          <Select
            value={role}
            onChange={(event) => setRole(event.target.value as TenantUserRole)}
            className="h-10 rounded-[12px] border-[#CBD5E1]/60 bg-[#F8FAFC]/80 text-[13px]"
          >
            <option value="EMPLOYEE">{ROLE_LABELS.EMPLOYEE}</option>
            <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
