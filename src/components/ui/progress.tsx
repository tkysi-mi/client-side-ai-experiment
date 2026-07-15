import * as ProgressPrimitive from "@radix-ui/react-progress";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className, ...props }: ComponentProps<typeof ProgressPrimitive.Root>) {
  const numericValue = typeof value === "number" ? value : 0;
  const safeValue = Math.max(0, Math.min(100, numericValue));
  return (
    <ProgressPrimitive.Root className={cn("h-2.5 w-full overflow-hidden rounded-full bg-black/8", className)} value={safeValue} {...props}>
      <ProgressPrimitive.Indicator className="h-full bg-mint-strong transition-transform duration-200" style={{ transform: `translateX(-${100 - safeValue}%)` }} />
    </ProgressPrimitive.Root>
  );
}
