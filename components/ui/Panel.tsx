import * as React from "react";

import { cn } from "@/lib/utils";

type PanelVariant = "workspace" | "helpy" | "sidebar" | "info";

const panelVariants: Record<PanelVariant, string> = {
  workspace:
    "relative z-10 hidden h-full w-[340px] shrink-0 flex-col border-l border-[#CBD5E1]/50 bg-white/80 shadow-[-4px_0_24px_rgba(15,23,42,0.04)] backdrop-blur-2xl xl:flex",
  helpy:
    "relative hidden h-full w-full shrink-0 flex-col border-l border-[#CBD5E1]/50 bg-white/85 backdrop-blur-2xl xl:flex xl:w-[380px]",
  sidebar:
    "relative z-10 hidden h-full w-[300px] shrink-0 flex-col border-l border-[#CBD5E1]/50 bg-white/80 shadow-[-4px_0_24px_rgba(15,23,42,0.04)] backdrop-blur-2xl xl:flex",
  info:
    "rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 shadow-sm backdrop-blur-sm",
};

type PanelProps = React.ComponentProps<"aside"> & {
  variant?: PanelVariant;
};

function Panel({ className, variant = "helpy", ...props }: PanelProps) {
  return (
    <aside
      data-slot="panel"
      data-variant={variant}
      className={cn(panelVariants[variant], className)}
      {...props}
    />
  );
}

function PanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        "flex h-[4.75rem] items-center justify-between border-b border-[#CBD5E1]/40 px-6",
        className
      )}
      {...props}
    />
  );
}

function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-body"
      className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5", className)}
      {...props}
    />
  );
}

function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-footer"
      className={cn("border-t border-[#CBD5E1]/40 p-5", className)}
      {...props}
    />
  );
}

export { Panel, PanelHeader, PanelBody, PanelFooter };
