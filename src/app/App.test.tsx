import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LanguageModelProvider } from "@/ai/language-model-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App } from "./App";

function renderRoute(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><TooltipProvider><LanguageModelProvider><App /></LanguageModelProvider></TooltipProvider></MemoryRouter>);
}

describe("application routes", () => {
  it("renders the purpose-led home page", () => {
    renderRoute("/");
    expect(screen.getByRole("heading", { level: 1, name: /Client-side AI Learning Lab/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "収録実験" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /実験を開く/ })).toHaveLength(3);
  });

  it("renders a useful not-found page", () => {
    renderRoute("/missing-page");
    expect(screen.getByRole("heading", { name: "ページが見つかりません" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ホームへ戻る/ })).toHaveAttribute("href", "/");
  });
});
