import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./AppLayout";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { experiments } from "@/experiments/registry";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        {experiments.map(({ path, component: Page }) => (
          <Route key={path} path={path} element={<Suspense fallback={<PageSkeleton />}><Page /></Suspense>} />
        ))}
        <Route path="/experiments" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function PageSkeleton() {
  return <div className="content-width animate-pulse"><div className="h-8 w-64 rounded bg-black/8" /><div className="mt-6 h-40 rounded-lg bg-black/5" /></div>;
}
