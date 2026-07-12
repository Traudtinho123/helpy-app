"use client";

import { cn } from "@/lib/utils";

type HelpyAtDeskProps = {
  className?: string;
  compact?: boolean;
};

export function HelpyAtDesk({ className, compact = false }: HelpyAtDeskProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-[#CBD5E1]/40 bg-gradient-to-b from-[#EEF2FF] via-[#F8FAFC] to-[#E0E7FF]/80",
        compact ? "h-[120px]" : "h-[168px]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(99,102,241,0.12),transparent_55%)]" />

      <svg
        viewBox="0 0 360 180"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* Desk */}
        <rect x="20" y="128" width="320" height="10" rx="4" fill="#CBD5E1" />
        <rect x="30" y="138" width="300" height="42" rx="6" fill="#94A3B8" opacity="0.35" />

        {/* Monitor */}
        <rect x="218" y="36" width="110" height="72" rx="8" fill="#334155" />
        <rect x="224" y="42" width="98" height="56" rx="4" fill="#1E293B" className="helpy-desk-screen" />
        <rect x="262" y="108" width="22" height="20" rx="3" fill="#64748B" />
        <rect x="248" y="126" width="50" height="6" rx="2" fill="#64748B" />

        {/* Screen glow lines */}
        <rect x="232" y="50" width="48" height="4" rx="2" fill="#6366F1" opacity="0.7" className="helpy-desk-code-line" />
        <rect x="232" y="60" width="72" height="3" rx="1.5" fill="#818CF8" opacity="0.5" className="helpy-desk-code-line" style={{ animationDelay: "0.3s" }} />
        <rect x="232" y="68" width="56" height="3" rx="1.5" fill="#A5B4FC" opacity="0.45" className="helpy-desk-code-line" style={{ animationDelay: "0.6s" }} />
        <rect x="232" y="76" width="64" height="3" rx="1.5" fill="#6366F1" opacity="0.4" className="helpy-desk-code-line" style={{ animationDelay: "0.9s" }} />

        {/* Keyboard */}
        <rect x="168" y="118" width="88" height="14" rx="4" fill="#475569" />
        <g className="helpy-desk-keys">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect
              key={i}
              x={174 + i * 10}
              y="121"
              width="7"
              height="8"
              rx="1.5"
              fill="#64748B"
            />
          ))}
        </g>

        {/* Chair */}
        <rect x="48" y="118" width="56" height="8" rx="4" fill="#6366F1" opacity="0.35" />
        <rect x="54" y="96" width="44" height="24" rx="10" fill="#4F46E5" opacity="0.2" />

        {/* Helpy body seated */}
        <g className="helpy-char-idle" style={{ transformOrigin: "108px 90px" }}>
          {/* Torso */}
          <rect x="78" y="82" width="60" height="52" rx="22" fill="#6366F1" />
          <text
            x="108"
            y="112"
            textAnchor="middle"
            fill="white"
            fontSize="13"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            letterSpacing="1.5"
          >
            HELPY
          </text>

          {/* Head */}
          <circle cx="108" cy="58" r="34" fill="#6366F1" />
          <circle cx="108" cy="60" r="25" fill="#1E1B4B" />
          <g className="helpy-char-blink" style={{ transformOrigin: "108px 58px" }}>
            <circle cx="96" cy="58" r="6" fill="#C7D2FE" />
            <circle cx="120" cy="58" r="6" fill="#C7D2FE" />
          </g>
          <path
            d="M 96 70 Q 108 76 120 70"
            fill="none"
            stroke="#C7D2FE"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="108" cy="28" r="5" fill="#A5B4FC" className="helpy-char-node" />

          {/* Arms typing on keyboard */}
          <g className="helpy-char-type-left" style={{ transformOrigin: "88px 108px" }}>
            <rect x="72" y="100" width="16" height="28" rx="8" fill="#818CF8" />
            <circle cx="80" cy="130" r="8" fill="#A5B4FC" />
          </g>
          <g className="helpy-char-type-right" style={{ transformOrigin: "128px 108px" }}>
            <rect x="128" y="100" width="16" height="28" rx="8" fill="#818CF8" />
            <circle cx="136" cy="130" r="8" fill="#A5B4FC" />
          </g>
        </g>

        {/* Chat bubble hint */}
        <rect x="24" y="24" width="88" height="36" rx="12" fill="white" opacity="0.92" />
        <rect x="24" y="24" width="88" height="36" rx="12" fill="none" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="34" y="36" width="52" height="4" rx="2" fill="#CBD5E1" />
        <rect x="34" y="44" width="36" height="4" rx="2" fill="#E2E8F0" />
      </svg>

      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
        <span className="helpy-online-pulse size-1.5 rounded-full bg-[#10B981]" />
        <span className="text-[10px] font-semibold text-[#6366F1]">Arbeitet für dich…</span>
      </div>
    </div>
  );
}
