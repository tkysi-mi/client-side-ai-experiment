import { useState } from "react";
import { Home, Menu, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { experiments } from "@/experiments/registry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";

const accentClasses = {
  mint: "border-mint bg-mint-soft text-ink",
  sky: "border-sky bg-sky-soft text-ink",
  coral: "border-coral bg-coral-soft text-ink",
  yellow: "border-yellow bg-yellow-soft text-ink",
};

function Brand({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return (
    <NavLink to="/" onClick={onNavigate} className="flex h-16 items-center gap-3 px-3 text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/40">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-mint bg-mint-soft"><Sparkles className="size-5" /></span>
      {!compact && <span className="leading-tight"><strong className="block text-sm">Client-side AI</strong><span className="text-xs font-semibold text-muted">Learning Lab</span></span>}
    </NavLink>
  );
}

function Navigation({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const links = [{ path: "/", title: "ホーム", icon: Home, accent: "mint" as const }, ...experiments.map((item) => ({ path: item.path, title: item.shortTitle, icon: item.icon, accent: item.accent }))];
  return (
    <nav aria-label="メインナビゲーション" className="space-y-1 px-2 py-3">
      {!compact && <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">Experiments</p>}
      {links.map(({ path, title, icon: Icon, accent }) => (
        <Tooltip key={path} label={title}>
          <NavLink
            to={path}
            end={path === "/"}
            onClick={onNavigate}
            className={({ isActive }) => cn("flex h-11 items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 text-sm font-bold text-muted transition-colors hover:bg-black/4 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky/40", isActive && accentClasses[accent])}
          >
            <Icon className="size-5 shrink-0" /><span className={cn("truncate", compact && "hidden lg:block")}>{title}</span>
          </NavLink>
        </Tooltip>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <a href="#main-content" className="skip-link">本文へスキップ</a>
      <div className="app-grid">
        <aside className="sticky top-0 z-30 hidden h-screen w-16 border-r border-border bg-white md:flex md:flex-col lg:w-64">
          <div className="hidden lg:block"><Brand /></div><div className="lg:hidden"><Brand compact /></div>
          <Separator />
          <div className="flex-1 overflow-y-auto"><Navigation compact /></div>
          <div className="border-t border-border p-3 text-[11px] leading-5 text-muted lg:block md:hidden">LLM推論はブラウザ内で実行されます。</div>
        </aside>

        <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur-sm md:hidden">
          <Brand />
          <Button variant="ghost" size="icon" aria-label="メニューを開く" onClick={() => setMobileOpen(true)}><Menu /></Button>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent><Brand onNavigate={() => setMobileOpen(false)} /><Separator /><Navigation onNavigate={() => setMobileOpen(false)} /></SheetContent>
        </Sheet>

        <main id="main-content" tabIndex={-1} className="app-main focus:outline-none"><Outlet /></main>
      </div>
    </>
  );
}
