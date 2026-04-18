import { create } from "zustand";
import { VerifierStage } from "../components/VerifierForm";

interface VerificationLog {
  timestamp: string;
  message: string;
  type: "info" | "error" | "debug";
}

interface VerificationState {
  stage: VerifierStage;
  logs: VerificationLog[];
  error: string | null;
  proofMetadata: any | null;
  
  // Actions
  setStage: (stage: VerifierStage) => void;
  addLog: (message: string, type?: "info" | "error" | "debug") => void;
  setError: (error: string | null) => void;
  setProofMetadata: (data: any) => void;
  reset: () => void;
}

export const useVerificationStore = create<VerificationState>((set) => ({
  stage: "idle",
  logs: [],
  error: null,
  proofMetadata: null,

  setStage: (stage) => set({ stage }),
  
  addLog: (message, type = "info") => set((state) => ({
    logs: [...state.logs, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]
  })),

  setError: (error) => set({ error, stage: error ? "error" : "idle" }),
  
  setProofMetadata: (proofMetadata) => set({ proofMetadata }),

  reset: () => set({
    stage: "idle",
    logs: [],
    error: null,
    proofMetadata: null
  }),
}));
