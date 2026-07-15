import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "danger";
const styles: Record<AlertTone, string> = {
  info: "border-sky/70 bg-sky-soft text-sky-ink",
  success: "border-mint/70 bg-mint-soft text-mint-ink",
  warning: "border-yellow/80 bg-yellow-soft text-yellow-ink",
  danger: "border-coral/70 bg-coral-soft text-coral-ink",
};
const icons = { info: Info, success: CheckCircle2, warning: AlertCircle, danger: AlertCircle };

export function Alert({ title, tone = "info", children, className, ...props }: HTMLAttributes<HTMLDivElement> & { title: string; tone?: AlertTone; children?: ReactNode }) {
  const Icon = icons[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("grid grid-cols-[20px_1fr] gap-3 rounded-lg border p-4", styles[tone], className)} {...props}>
      <Icon className="mt-0.5 size-5" aria-hidden="true" />
      <div><p className="text-sm font-extrabold">{title}</p>{children && <div className="mt-1 text-sm leading-6">{children}</div>}</div>
    </div>
  );
}
