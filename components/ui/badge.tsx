import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 text-[11px] font-semibold whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        secondary: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
        outline: "border-[#CBD5E1]/60 bg-white text-[#475569]",
        success: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
        destructive: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
        ghost: "border-transparent bg-[#F1F5F9] text-[#64748B]",
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
