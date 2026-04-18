import { create } from "zustand";
export type VerifierStage = "idle" | "exchanging" | "encrypting" | "proving" | "verifying" | "success" | "error";

interface VerificationLog {
  timestamp: string;
  message: string;
  type: "info" | "error" | "debug";
}

export interface ProofMetadata {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
  vkey: any; // Keep vkey permissive as we don't strictly care about its internal structure here
}

interface VerificationState {
  stage: VerifierStage;
  logs: VerificationLog[];
  error: string | null;
  proofMetadata: ProofMetadata | null;
  
  // Actions
  setStage: (stage: VerifierStage) => void;
  addLog: (message: string, type?: "info" | "error" | "debug") => void;
  setError: (error: string | null) => void;
  setProofMetadata: (data: ProofMetadata) => void;
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
