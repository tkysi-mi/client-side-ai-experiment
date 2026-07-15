import type { ComponentType, LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";

export type ExperimentId = "translator" | "survival" | "nano-audio";
export type CapabilityKind = "language-model" | "speech-recognition" | "microphone" | "voice-activity-detection";
export type CapabilityStatus = "checking" | "unavailable" | "downloadable" | "downloading" | "ready" | "error";
export type Accent = "mint" | "coral" | "sky" | "yellow";

export interface CapabilityRequirement {
  kind: CapabilityKind;
  label: string;
  required: boolean;
}

export interface ExperimentDefinition {
  id: ExperimentId;
  path: string;
  title: string;
  shortTitle: string;
  description: string;
  accent: Accent;
  icon: LucideIcon;
  requirements: CapabilityRequirement[];
  component: LazyExoticComponent<ComponentType>;
}

export interface CapabilityState {
  status: CapabilityStatus;
  progress: number;
  message?: string;
}
