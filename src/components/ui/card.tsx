import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-base-300 bg-white shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
