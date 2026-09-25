import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        ref={ref}
        className={cn(
          "min-h-24 w-full rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink transition-colors outline-none placeholder:text-ink-muted focus-visible:border-brand-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
