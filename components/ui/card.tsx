import * as React from "react";

import { surfaces } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "workspace" | "info" | "action";

const cardVariants: Record<CardVariant, string> = {
  default: surfaces.card,
  workspace: `${surfaces.card} py-0`,
  info: "rounded-[20px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/50 shadow-sm backdrop-blur-sm",
  action:
    "rounded-[16px] border border-[#CBD5E1]/45 bg-white/90 transition-all duration-300 hover:border-[#BFDBFE]/60 hover:shadow-[0_4px_16px_rgba(37,99,235,0.06)]",
};

type CardProps = React.ComponentProps<"div"> & {
  variant?: CardVariant;
  size?: "default" | "sm";
};

function Card({ className, variant = "default", size = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col text-sm text-card-foreground",
        cardVariants[variant],
        size === "sm" && "rounded-[16px]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1 border-b border-[#CBD5E1]/30 px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[12px] text-[#64748B]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto shrink-0 self-start", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-5 py-4", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-[#CBD5E1]/30 bg-[#F8FAFC]/50 px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
