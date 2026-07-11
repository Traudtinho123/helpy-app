"use client";

import Link from "next/link";
import {
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  Mail,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getKundenakteWidgetSnapshots,
  subscribeKundenakteWidgets,
  type KundenakteWidgetId,
  type KundenakteWidgetSnapshot,
} from "@/features/kundenakte/services/kundenakte-dashboard";

type KundenakteWidgetGridProps = {
  vorgangId: string;
  customerEmail: string;
};

const WIDGET_ICONS: Record<KundenakteWidgetId, LucideIcon> = {
  objekte: Building2,
  besichtigungen: Calendar,
  dokumente: FileText,
  kalender: CalendarDays,
  antworten: Mail,
  offerten: Receipt,
};

export function KundenakteWidgetGrid({
  vorgangId,
  customerEmail,
}: KundenakteWidgetGridProps) {
  const [sourceRevision, setSourceRevision] = useState(0);

  useEffect(() => subscribeKundenakteWidgets(() => {
    setSourceRevision((revision) => revision + 1);
  }), []);

  const widgets = useMemo(
    () => getKundenakteWidgetSnapshots(vorgangId, customerEmail),
    [customerEmail, sourceRevision, vorgangId]
  );

  return (
    <section aria-label="Kundenübersicht">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {widgets.map((widget) => (
          <KundenakteWidgetTile key={widget.id} widget={widget} />
        ))}
      </div>
    </section>
  );
}

function KundenakteWidgetTile({ widget }: { widget: KundenakteWidgetSnapshot }) {
  const Icon = WIDGET_ICONS[widget.id];

  return (
    <Link
      href={widget.href}
      className="group rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#2563EB]">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <p className="text-[12px] font-semibold text-[#64748B]">{widget.label}</p>
      </div>
      <p className="mt-3 text-[13px] font-semibold leading-snug text-[#0F172A]">
        {widget.status}
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[#64748B]">
        {widget.detail}
      </p>
    </Link>
  );
}
