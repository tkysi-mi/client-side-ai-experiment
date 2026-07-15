import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "mint" | "coral" | "sky" | "yellow" | "danger";
const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-canvas text-muted",
  mint: "border-mint/60 bg-mint-soft text-mint-ink",
  coral: "border-coral/60 bg-coral-soft text-coral-ink",
  sky: "border-sky/60 bg-sky-soft text-sky-ink",
  yellow: "border-yellow/70 bg-yellow-soft text-yellow-ink",
  danger: "border-coral/70 bg-coral-soft text-coral-ink",
};

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold", tones[tone], className)} {...props} />;
}
