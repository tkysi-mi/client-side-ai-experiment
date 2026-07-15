/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CapabilityState, ExperimentId } from "@/experiments/types";

const initialState: CapabilityState = { status: "checking", progress: 0 };

interface LanguageModelContextValue {
  getState(id: ExperimentId): CapabilityState;
  check(id: ExperimentId, options: LanguageModelCreateCoreOptions): Promise<CapabilityState>;
  prepare(id: ExperimentId, options: LanguageModelCreateOptions): Promise<LanguageModel>;
}

const Context = createContext<LanguageModelContextValue | null>(null);

export function LanguageModelProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Partial<Record<ExperimentId, CapabilityState>>>({});
  const update = useCallback((id: ExperimentId, state: CapabilityState) => {
    setStates((current) => ({ ...current, [id]: state }));
    return state;
  }, []);

  const check = useCallback(async (id: ExperimentId, options: LanguageModelCreateCoreOptions) => {
    if (!("LanguageModel" in globalThis)) return update(id, { status: "unavailable", progress: 0, message: "Chrome 148以降の対応環境が必要です。" });
    update(id, { status: "checking", progress: 0 });
    try {
      const availability = await LanguageModel.availability(options);
      const status = availability === "available" ? "ready" : availability;
      return update(id, { status, progress: availability === "available" ? 100 : 0 });
    } catch (error) {
      return update(id, { status: "error", progress: 0, message: error instanceof Error ? error.message : "モデル状態を確認できませんでした。" });
    }
  }, [update]);

  const prepare = useCallback(async (id: ExperimentId, options: LanguageModelCreateOptions) => {
    if (!("LanguageModel" in globalThis)) throw new Error("Prompt APIを利用できません。");
    update(id, { status: "downloading", progress: 0 });
    try {
      const session = await LanguageModel.create({
        ...options,
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            const raw = event.total > 0 ? event.loaded / event.total : event.loaded;
            const progress = Math.round(Math.min(1, raw) * 100);
            update(id, { status: "downloading", progress });
          });
          options.monitor?.(monitor);
        },
      });
      update(id, { status: "ready", progress: 100 });
      return session;
    } catch (error) {
      update(id, { status: "error", progress: 0, message: error instanceof Error ? error.message : "モデルを準備できませんでした。" });
      throw error;
    }
  }, [update]);

  const value = useMemo<LanguageModelContextValue>(() => ({
    getState: (id) => states[id] ?? initialState,
    check,
    prepare,
  }), [check, prepare, states]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLanguageModel() {
  const context = useContext(Context);
  if (!context) throw new Error("useLanguageModel must be used inside LanguageModelProvider");
  return context;
}
