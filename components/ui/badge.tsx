import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[var(--radius-full)] border px-2.5 text-[var(--text-xs)] font-semibold tracking-[0.02em] whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-primary-mid)] bg-[var(--color-primary-light)] text-[var(--color-primary)]",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-ink-3)]",
        outline:
          "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink-2)]",
        success:
          "border-[color-mix(in_srgb,var(--color-success)_25%,transparent)] bg-[var(--color-success-light)] text-[var(--color-success)]",
        destructive:
          "border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] bg-[var(--color-danger-light)] text-[var(--color-danger)]",
        ghost:
          "border-transparent bg-[var(--color-bg-subtle)] text-[var(--color-ink-3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
