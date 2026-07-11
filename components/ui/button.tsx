import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { surfaces } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-semibold whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: surfaces.primaryButton,
        secondary:
          "rounded-[12px] border border-[#CBD5E1]/60 bg-white text-[#334155] shadow-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF] hover:text-[#2563EB]",
        ghost:
          "rounded-[12px] bg-transparent text-[#64748B] transition-all duration-300 hover:bg-[#F8FAFC] hover:text-[#0F172A]",
        danger:
          "rounded-[12px] border border-[#FECACA]/60 bg-[#FEF2F2] text-[#DC2626] transition-all duration-300 hover:bg-[#FEE2E2]",
        success:
          "rounded-[12px] border border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] transition-all duration-300 hover:bg-[#D1FAE5]",
        /** Shadcn-kompatible Aliase — unverändertes Erscheinungsbild */
        default: "bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg",
        outline:
          "rounded-[12px] border border-[#CBD5E1]/60 bg-white text-[#334155] shadow-sm transition-all duration-300 hover:border-[#BFDBFE]/60 hover:bg-[#EFF6FF]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-9 gap-2 rounded-[12px] px-4 text-[12px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-11 gap-2 rounded-[12px] px-5 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        /** Shadcn-kompatible Aliase */
        default:
          "h-8 gap-1.5 rounded-lg px-2.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-[10px] px-2 text-[10px] [&_svg:not([class*='size-'])]:size-3",
        icon: "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 rounded-[12px] [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
