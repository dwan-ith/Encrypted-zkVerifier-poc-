"use client";

import { useRef, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Key, Lock, Binary, 
  CloudLightning, CheckCircle2, AlertCircle,
  ChevronRight, Terminal, BarChart3
} from "lucide-react";

import { ZkVerifierClient, ValidationError } from "@zk-verifier/sdk";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useVerificationStore } from "../store/useVerificationStore";
import { CONFIG } from "../config";

// Formal input schema
const FormSchema = z.object({
  age: z.coerce.number().int().min(1, "Must be at least 1").max(120, "Invalid age"),
});

type FormData = z.infer<typeof FormSchema>;

export type VerifierStage = "idle" | "exchanging" | "encrypting" | "proving" | "verifying" | "success" | "error";

export function VerifierForm() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  // Zustand Industrial State
  const { stage, logs, error, setStage, addLog, setError, reset } = useVerificationStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // React Hook Form
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const onSubmit = async (data: FormData) => {
    if (!publicKey || !signTransaction) return;

    try {
      reset();
      setStage("exchanging");
      addLog("Initializing Enterprise ZK-Verifier Lifecycle...", "info");
      
      const provider = new anchor.AnchorProvider(connection, { publicKey, signTransaction } as any, {});
      const client = new ZkVerifierClient(provider, {
        programId: CONFIG.SOLANA.PROGRAM_ID,
        arciumMxeId: CONFIG.ARCIUM.MXE_ID,
        arciumProgramId: CONFIG.SOLANA.ARCIUM_PROGRAM_ID,
        circuitWasmPath: CONFIG.ZK.WASM_PATH,
        circuitZkeyPath: CONFIG.ZK.ZKEY_PATH,
      });

      addLog("MPC Handshake: Deriving confidential shared secret...", "info");
      setStage("encrypting");
      addLog("RescueCipher: Shielding input payload with 128-bit security...", "info");
      
      setStage("proving");
      addLog("SnarkJS: Generating local Groth16 Zero-Knowledge Proof...", "info");
      
      const tx = await client.verifyCompliance(data.age, "age-compliance-v1");
      
      addLog(`Solana Devnet Settlement Confirmed: ${tx.substring(0, 16)}...`, "info");
      setStage("success");
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof ValidationError ? "Validation Failed" : err.message;
      setError(msg);
      addLog(`FAIL: ${msg}`, "error");
    }
  };

  const STAGE_ICONS: Record<VerifierStage, React.ReactNode> = {
    idle: <ShieldCheck className="w-6 h-6" />,
    exchanging: <Key className="w-6 h-6 animate-pulse" />,
    encrypting: <Lock className="w-6 h-6 animate-spin" />,
    proving: <Binary className="w-6 h-6 animate-pulse" />,
    verifying: <CloudLightning className="w-6 h-6 animate-bounce" />,
    success: <CheckCircle2 className="w-6 h-6 text-green-400" />,
    error: <AlertCircle className="w-6 h-6 text-red-400" />,
  };

  const getStepStatus = (index: number) => {
    const stageIndex = CONFIG.UI.STEPS.findIndex(s => s.id === stage);
    if (stage === "success") return "complete";
    if (stage === "error" && index >= (stageIndex === -1 ? 0 : stageIndex)) return "error";
    if (index < stageIndex) return "complete";
    if (index === stageIndex) return "active";
    return "pending";
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 p-8 bg-black/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 text-white">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            System Compliance
          </h2>
          <p className="text-xs text-white/40 font-mono">NODE_ENV: production</p>
        </div>
        <BarChart3 className="w-5 h-5 text-white/20" />
      </div>

      {/* Industrial Stepper */}
      <div className="flex justify-between items-center px-4 py-6 bg-white/5 rounded-2xl border border-white/5">
        {CONFIG.UI.STEPS.map((step, i) => {
          const status = getStepStatus(i);
          return (
            <div key={step.id} className="flex flex-col items-center space-y-2 relative">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-700 border ${
                  status === "active" ? "border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                  status === "complete" ? "border-emerald-500 bg-emerald-500/20" :
                  status === "error" ? "border-red-500 bg-red-500/20" :
                  "border-white/10 bg-transparent"
                }`}
              >
                {status === "complete" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : 
                 status === "error" && getStepStatus(i) === "error" ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                 <span className="text-[10px] font-bold opacity-50">{i + 1}</span>}
              </div>
              {i < CONFIG.UI.STEPS.length - 1 && (
                <div className="absolute top-4 -right-10 w-8 h-[1px] bg-white/10" />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {stage === "idle" || stage === "error" ? (
          <motion.form
            key="input-stage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <Input
                  {...register("age")}
                  type="number"
                  placeholder="Declare Private Age..."
                  className={`relative bg-black/60 border-white/10 h-14 text-lg rounded-xl transition-all ${
                    errors.age ? "border-red-500/50 bg-red-500/5" : "focus:border-blue-500/50"
                  }`}
                />
              </div>
              {errors.age && (
                <p className="text-[10px] text-red-400 ml-1 font-medium">{errors.age.message}</p>
              )}
            </div>

            <Button 
              type="submit"
              disabled={!publicKey || !isValid || stage === "verifying"}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-900/10 disabled:opacity-30"
            >
              <ShieldCheck className="mr-2 w-5 h-5" />
              Execute Formal Verification
            </Button>
            {!publicKey && (
              <p className="text-center text-[10px] text-white/30 uppercase tracking-widest">
                Waiting for Wallet authentication...
              </p>
            )}
          </motion.form>
        ) : (
          <motion.div
            key="active-stage"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-4 p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                {STAGE_ICONS[stage]}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm uppercase tracking-wider">{stage} Phase</h3>
                  <span className="text-[10px] text-blue-400 font-mono">PROCESSING</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Crypto Audit Console */}
            <div className="bg-black/60 rounded-2xl border border-white/10 p-4 font-mono">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2 text-[10px] text-white/50 font-bold uppercase tracking-widest">
                  <Terminal className="w-3 h-3" />
                  <span>Log Channel: Secure_SDK_v1</span>
                </div>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                </div>
              </div>
              <div 
                ref={scrollRef}
                className="h-40 overflow-y-auto space-y-1.5 scrollbar-none pr-2"
              >
                {logs.map((log, i) => (
                  <div key={i} className="text-[11px] leading-relaxed group">
                    <span className="text-white/20 select-none mr-3">[{log.timestamp}]</span>
                    <span className={log.type === "error" ? "text-red-400" : "text-white/70"}>
                      <span className="text-blue-500/50 mr-2">➜</span>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === "success" && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Policy Compliant</h3>
          <p className="text-sm text-white/50 max-w-xs mx-auto mb-6">
            Proof of eligibility has been formally verified and immutable stored on the Solana ledger.
          </p>
          <Button 
            variant="ghost" 
            onClick={reset}
            className="text-xs text-white/40 hover:text-white hover:bg-white/5"
          >
            Clear Session State
          </Button>
        </motion.div>
      )}
    </div>
  );
}