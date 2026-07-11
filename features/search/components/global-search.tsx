"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  GitBranch,
  Mail,
  Receipt,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  EMPTY_SEARCH_RESULTS,
  searchGlobal,
  subscribeGlobalSearch,
} from "@/features/search/services/global-search-engine";
import type {
  GlobalSearchCategory,
  GlobalSearchEntry,
} from "@/features/search/types/global-search-types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<GlobalSearchCategory, LucideIcon> = {
  kunde: UserRound,
  objekt: Building2,
  gmail: Mail,
  dokument: FileText,
  besichtigung: Calendar,
  offerte: Receipt,
  kalender: CalendarDays,
  pipeline: GitBranch,
  memory: Brain,
};

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indexRevision, setIndexRevision] = useState(0);

  useEffect(() => subscribeGlobalSearch(() => {
    setIndexRevision((revision) => revision + 1);
  }), []);

  const trimmedQuery = query.trim();

  const results = useMemo(() => {
    if (!trimmedQuery) {
      return EMPTY_SEARCH_RESULTS;
    }
    return searchGlobal(trimmedQuery);
  }, [indexRevision, trimmedQuery]);

  const flatItems = useMemo(
    () => results.groups.flatMap((group) => group.items),
    [results.groups]
  );
  const hasResults = flatItems.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmedQuery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatItems.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current === 0 ? flatItems.length - 1 : current - 1
      );
    }

    if (event.key === "Enter" && flatItems[activeIndex]) {
      event.preventDefault();
      navigateTo(flatItems[activeIndex].href);
    }
  }

  let itemOffset = 0;

  return (
    <div ref={containerRef} className="relative max-w-xl flex-1">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-[17px] -translate-y-1/2 text-[#64748B]"
        strokeWidth={2}
      />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Kunden, Objekte, Mails, Dokumente suchen…"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleInputKeyDown}
        className="h-11 rounded-[14px] border-[#CBD5E1]/60 bg-white/90 pr-[4.5rem] pl-11 text-[13px] text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 placeholder:text-[#64748B] hover:border-[#94A3B8]/50 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] focus-visible:border-[#2563EB]/40 focus-visible:bg-white focus-visible:ring-[#2563EB]/20"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3.5 hidden -translate-y-1/2 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-medium text-[#64748B] shadow-sm sm:inline-block">
        ⌘K
      </kbd>

      {open && trimmedQuery.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-[16px] border border-[#CBD5E1]/60 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {hasResults ? (
            <div className="max-h-[min(420px,70vh)] overflow-y-auto py-2">
              {results.groups.map((group) => (
                <div key={group.category} className="px-2 py-1">
                  <p className="px-2 py-1.5 text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                    {group.label}
                  </p>
                  <ul>
                    {group.items.map((item) => {
                      const index = itemOffset++;
                      const Icon = CATEGORY_ICONS[item.category];
                      const isActive = index === activeIndex;

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => navigateTo(item.href)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors",
                              isActive
                                ? "bg-[#EFF6FF]/90"
                                : "hover:bg-[#F8FAFC]"
                            )}
                          >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#2563EB]">
                              <Icon className="size-4" strokeWidth={2} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold text-[#0F172A]">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-[#64748B]">
                                {item.subtitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[#0F172A]">
                Keine Treffer für „{trimmedQuery}“
              </p>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Versuche Name, Adresse, Budget oder Betreff.
              </p>
            </div>
          )}

          {hasResults && (
            <div className="border-t border-[#CBD5E1]/40 px-4 py-2.5">
              <p className="text-[10px] text-[#64748B]">
                {results.totalCount} Treffer · Pfeiltasten · Enter öffnet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GlobalSearchResultLink({
  item,
  className,
}: {
  item: GlobalSearchEntry;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[item.category];

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-start gap-3 rounded-[12px] px-3 py-2.5 transition-colors hover:bg-[#F8FAFC]",
        className
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#2563EB]">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-[#0F172A]">
          {item.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#64748B]">
          {item.subtitle}
        </span>
      </span>
    </Link>
  );
}
