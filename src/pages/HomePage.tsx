import { ArrowRight, AudioLines, Coins, Gauge, Languages, LockKeyhole, WifiOff } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { experiments } from "@/experiments/registry";
import { cn } from "@/lib/utils";

const principles = [
  { icon: LockKeyhole, title: "Privacy", text: "学習者のプロンプトをLLMサーバーへ送らない", color: "bg-mint-soft border-mint" },
  { icon: Gauge, title: "Response", text: "端末内推論による短い待ち時間を検証", color: "bg-sky-soft border-sky" },
  { icon: WifiOff, title: "Offline", text: "ネットワーク依存を抑えた学習体験", color: "bg-yellow-soft border-yellow" },
  { icon: Coins, title: "Cost", text: "推論APIの従量課金に頼らない運用", color: "bg-coral-soft border-coral" },
];

const accentClasses = {
  mint: "border-mint bg-mint-soft",
  coral: "border-coral bg-coral-soft",
  sky: "border-sky bg-sky-soft",
  yellow: "border-yellow bg-yellow-soft",
};

function ExperimentPreview({ id }: { id: string }) {
  if (id === "survival") {
    return <img src="/assets/scenarios/aliens-ticket-gate.png" alt="ピンチ脱出ゲームのシナリオ" width={800} height={500} loading="lazy" decoding="async" className="aspect-[16/10] w-full border-b border-border object-cover" />;
  }
  if (id === "nano-audio") {
    const bars = [28, 48, 72, 42, 88, 64, 36, 78, 54, 30, 62, 44];
    return <div className="flex aspect-[16/10] items-center justify-center gap-1.5 border-b border-border bg-yellow-soft px-8" aria-label="Silero VADで検出する音声波形のプレビュー">{bars.map((height, index) => <span key={index} className="w-2 rounded-full bg-coral" style={{ height: `${height}%` }} />)}<AudioLines className="ml-3 size-7 text-yellow-ink" /></div>;
  }
  return <div className="flex aspect-[16/10] flex-col justify-center gap-3 border-b border-border bg-sky-soft p-5"><div className="rounded-md border border-sky bg-white p-3 text-xs font-bold text-ink">English<br /><span className="font-medium text-muted">How can I explain this?</span></div><div className="rounded-md border border-mint bg-white p-3 text-xs font-bold text-ink">日本語<br /><span className="font-medium text-muted">どう説明すればいい？</span></div></div>;
}

export function HomePage() {
  return (
    <div className="content-width">
      <section className="border-b border-border pb-8 pt-2">
        <Badge tone="mint">EdTech × Client-Side LLM</Badge>
        <h1 className="mt-5 max-w-4xl text-3xl font-black leading-[1.2] text-ink sm:text-5xl">Client-side AI<br className="hidden sm:block" /> Learning Lab</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted">教育におけるオンデバイスLLMの可能性を、実際に触れる学習アクティビティで検証する実験ラボです。プライバシー、速度、制約を実装から考えます。</p>
      </section>

      <section aria-labelledby="experiments-title" className="py-8">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">Try the lab</p><h2 id="experiments-title" className="mt-1 text-2xl font-black text-ink">収録実験</h2></div><span className="text-sm font-bold text-muted">{experiments.length} experiments</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {experiments.map((experiment) => {
            const Icon = experiment.icon;
            const buttonVariant = experiment.accent === "coral" ? "coral" : experiment.accent === "yellow" ? "yellow" : "primary";
            return (
              <article key={experiment.id} className="flex overflow-hidden rounded-lg border border-border bg-white flex-col">
                <ExperimentPreview id={experiment.id} />
                <div className="flex flex-1 flex-col p-5 sm:p-6"><span className={cn("grid size-11 place-items-center rounded-lg border", accentClasses[experiment.accent])}><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-black text-ink">{experiment.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted">{experiment.description}</p><Button asChild variant={buttonVariant} className="mt-5 self-start"><Link to={experiment.path}>実験を開く<ArrowRight /></Link></Button></div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="principles-title" className="border-t border-border py-8"><h2 id="principles-title" className="text-xl font-black text-ink">検証する観点</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{principles.map(({ icon: Icon, title, text, color }) => <div key={title} className={cn("rounded-lg border p-4", color)}><Icon className="size-5" /><h3 className="mt-3 text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-strong">{text}</p></div>)}</div></section>

      <section className="border-t border-border py-8"><div className="flex gap-4"><Languages className="mt-1 size-5 shrink-0 text-muted" /><div><h2 className="text-sm font-black text-ink">実行環境について</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Prompt API対応のChrome 148以降と、モデルを実行できる端末要件が必要です。LLM推論はローカルですが、Web Speech APIの音声処理方式はブラウザやOSに依存します。</p></div></div></section>
    </div>
  );
}
