import * as React from "react";

import { typography } from "@/lib/design/typography";
import { cn } from "@/lib/utils";

type SectionProps = React.ComponentProps<"section"> & {
  title?: string;
  description?: string;
};

function Section({ className, title, description, children, ...props }: SectionProps) {
  return (
    <section data-slot="section" className={cn("space-y-4", className)} {...props}>
      {(title || description) && (
        <header className="space-y-1.5">
          {title && (
            <h2 className={typography.sectionTitle}>{title}</h2>
          )}
          {description && (
            <p className={typography.muted}>{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function SectionLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="section-label"
      className={cn(typography.label, className)}
      {...props}
    />
  );
}

export { Section, SectionLabel };
