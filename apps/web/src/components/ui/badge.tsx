import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-canvas-border bg-canvas-panel-muted text-canvas-ink",
        accent: "border-canvas-accent/20 bg-canvas-accent/10 text-canvas-accent",
        warning: "border-canvas-warning/20 bg-canvas-warning/10 text-canvas-warning",
        destructive: "border-canvas-danger/20 bg-canvas-danger/10 text-canvas-danger"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
