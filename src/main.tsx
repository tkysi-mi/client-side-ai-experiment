import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageModelProvider } from "@/ai/language-model-context";
import { App } from "@/app/App";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TooltipProvider delayDuration={250}>
        <LanguageModelProvider><App /></LanguageModelProvider>
      </TooltipProvider>
    </BrowserRouter>
  </StrictMode>,
);
