"use client";

import { MemoryCard } from "@/features/memory/components/MemoryCard";
import { getCustomerMemorySnapshot } from "@/features/memory/services";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";

type CustomerMemorySectionProps = {
  customerId: string;
};

export function CustomerMemorySection({ customerId }: CustomerMemorySectionProps) {
  const { activeSkill } = useActiveSkill();
  const { intro, entries } = getCustomerMemorySnapshot(customerId, activeSkill);

  if (entries.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-5">
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          Was HELPY über diesen Kunden weiß
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">{intro}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <MemoryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
