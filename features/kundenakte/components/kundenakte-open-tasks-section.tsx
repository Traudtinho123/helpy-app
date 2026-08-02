"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ListTodo } from "lucide-react";
import { refreshFollowUp } from "@/features/followup/services/followup-engine";
import {
  EMPTY_KUNDENAKTE_OPEN_TASKS,
  getKundenakteOpenTasks,
  subscribeKundenakteOpenTasks,
  type KundenakteOpenTask,
} from "@/features/kundenakte/services/kundenakte-dashboard";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import { SectionCard } from "@/features/workspace/components/workspace-sections";
import { cn } from "@/lib/utils";

type KundenakteOpenTasksSectionProps = {
  vorgangId: string;
  kundenakte: Kundenakte;
};

export function KundenakteOpenTasksSection({
  vorgangId,
  kundenakte,
}: KundenakteOpenTasksSectionProps) {
  const initializedRef = useRef<string | null>(null);
  const [sourceRevision, setSourceRevision] = useState(0);
  const kundenakteStatus = kundenakte.status;
  const kundenakteStatusLabel = kundenakte.statusLabel;

  useEffect(() => {
    if (initializedRef.current === vorgangId) return;
    initializedRef.current = vorgangId;
    refreshFollowUp(vorgangId);
  }, [vorgangId]);

  useEffect(() => subscribeKundenakteOpenTasks(() => {
    setSourceRevision((revision) => revision + 1);
  }), []);

  const tasks = useMemo(() => {
    if (!vorgangId) {
      return EMPTY_KUNDENAKTE_OPEN_TASKS;
    }
    return getKundenakteOpenTasks(vorgangId, kundenakte);
  }, [kundenakte, kundenakteStatus, kundenakteStatusLabel, sourceRevision, vorgangId]);

  if (tasks.length === 0) {
    return (
      <SectionCard title="Offene Aufgaben" icon={ListTodo}>
        <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
          Keine offenen Aufgaben — alles erledigt für diesen Kunden.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Offene Aufgaben" icon={ListTodo}>
      <ul className="space-y-2.5">
        {tasks.map((task) => (
          <OpenTaskItem key={task.id} task={task} />
        ))}
      </ul>
    </SectionCard>
  );
}

function OpenTaskItem({ task }: { task: KundenakteOpenTask }) {
  return (
    <li>
      <Link
        href={task.href}
        className={cn(
          "block rounded-[12px] border px-3.5 py-3 transition-colors hover:bg-[var(--bg-elevated)]",
          task.urgent
            ? "border-[#FECACA]/70 bg-[#FEF2F2]/50"
            : "border-[var(--border)] bg-[var(--bg-surface)]"
        )}
      >
        <p className="text-[12px] font-semibold text-[var(--text-primary)]">{task.label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {task.detail}
        </p>
      </Link>
    </li>
  );
}
