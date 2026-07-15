import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const accents = { mint: "border-mint bg-mint-soft", coral: "border-coral bg-coral-soft", sky: "border-sky bg-sky-soft", yellow: "border-yellow bg-yellow-soft" };
export function PageHeader({ title, description, icon: Icon, accent, actions }: { title: string; description: string; icon: LucideIcon; accent: keyof typeof accents; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-lg border", accents[accent])}><Icon className="size-6" /></span>
        <div><h1 className="text-2xl font-black leading-tight text-ink sm:text-[28px]">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
