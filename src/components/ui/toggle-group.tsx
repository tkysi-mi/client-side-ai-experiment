import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function ToggleGroup({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return <ToggleGroupPrimitive.Root className={cn("inline-flex rounded-lg border border-border bg-canvas p-1", className)} {...props} />;
}
export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return <ToggleGroupPrimitive.Item className={cn("h-11 min-w-16 rounded-md px-3 text-sm font-bold text-muted transition-colors hover:text-ink data-[state=on]:bg-white data-[state=on]:text-ink data-[state=on]:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/60 sm:h-9 sm:min-w-20 sm:text-xs", className)} {...props} />;
}
