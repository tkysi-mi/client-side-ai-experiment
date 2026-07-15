import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return <div className="content-width grid min-h-[60vh] place-items-center"><div className="text-center"><p className="text-sm font-black text-coral-ink">404</p><h1 className="mt-2 text-3xl font-black text-ink">ページが見つかりません</h1><p className="mt-3 text-sm text-muted">URLを確認するか、ホームから実験を選び直してください。</p><Button asChild className="mt-6"><Link to="/"><ArrowLeft />ホームへ戻る</Link></Button></div></div>;
}
