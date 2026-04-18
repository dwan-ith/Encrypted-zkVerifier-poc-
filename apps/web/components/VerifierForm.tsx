"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Binary, 
  CloudLightning, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Terminal
} from "lucide-react";
import { ZkVerifierClient } from "@zk-verifier/sdk";
import { CONFIG } from "../config";

/**
 * Stage identifiers for the verification process
 */
export type VerifierStage = "idle" | "exchanging" | "encrypting" | "proving" | "verifying" | "success" | "error";

export function VerifierForm() {
  const [age, setAge] = useState<number>(0);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [stage, setStage] = useState<VerifierStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the crypto-console
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleVerify = async () => {
    if (!publicKey || !signTransaction) return;

    try {
      setStage("exchanging");
      addLog("Initializing Enterprise ZK-Verification SDK...");
      
      const provider = new anchor.AnchorProvider(connection, { publicKey, signTransaction } as any, {});
      const client = new ZkVerifierClient(provider, {
        programId: CONFIG.SOLANA.PROGRAM_ID,
        arciumMxeId: CONFIG.ARCIUM.MXE_ID,
        arciumProgramId: CONFIG.SOLANA.ARCIUM_PROGRAM_ID,
        circuitWasmPath: CONFIG.ZK.WASM_PATH,
        circuitZkeyPath: CONFIG.ZK.ZKEY_PATH,
      });

      addLog("Starting Secure Compliance Handshake...");
      // stage transitions are handled manually in this high-level component for UI feedback
      addLog("Deriving shared secret with Arcium MXE...");
      setStage("encrypting");
      addLog("Shielding input payload...");
      setStage("proving");
      addLog("Generating Groth16 ZK-Proof...");
      
      await client.verifyCompliance(age, "age-compliance-v1");
      
      setStage("success");
      addLog("On-chain verification verified. Settlement complete.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Cryptographic verification failed");
      setStage("error");
      addLog(`FATAL ERROR: ${err.message}`);
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
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Confidential Age Verification
        </h2>
        <p className="text-sm text-white/50">
          Industrial Grade MPC & Zero-Knowledge Architecture
        </p>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center px-2">
        {CONFIG.UI.STEPS.map((step, i) => {
          const status = getStepStatus(i);
          return (
            <div key={step.id} className="flex flex-col items-center space-y-2 relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                  status === "active" ? "border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]" :
                  status === "complete" ? "border-emerald-500 bg-emerald-500/20" :
                  status === "error" ? "border-red-500 bg-red-500/20" :
                  "border-white/10 bg-white/5"
                }`}
              >
                {status === "complete" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : 
                 status === "error" && CONFIG.UI.STEPS.findIndex(s => s.id === stage) === i ? <AlertCircle className="w-5 h-5 text-red-400" /> :
                 <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-medium ${
                status === "active" ? "text-blue-400" : "text-white/30"
              }`}>
                {step.label}
              </span>
              {i < CONFIG.UI.STEPS.length - 1 && (
                <div className="absolute top-5 -right-8 w-6 h-[2px] bg-white/5" />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {stage === "idle" || stage === "error" ? (
          <motion.div
            key="input-stage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <Input
                type="number"
                placeholder="Declare your age..."
                value={age || ""}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="relative bg-black/60 border-white/10 h-14 text-lg rounded-xl focus:ring-blue-500/50"
              />
            </div>
            <Button 
              onClick={handleVerify} 
              disabled={!publicKey || age < 1}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-lg font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              {!publicKey ? "Connect Wallet First" : "Launch Secure Verification"}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="active-stage"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  {STAGE_ICONS[stage]}
                </div>
                <div>
                  <h3 className="font-bold text-lg capitalize">{stage} in progress...</h3>
                  <p className="text-sm text-white/50">Computing confidential state</p>
                </div>
              </div>
              {stage !== "success" && stage !== "error" && (
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w.1.5 h-1.5 bg-blue-400 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Crypto Console */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white/30 text-[10px] uppercase tracking-widest font-bold">
                <Terminal className="w-3 h-3" />
                <span>Cryptographic Audit Trail</span>
              </div>
              <div 
                ref={scrollRef}
                className="h-32 bg-black/40 rounded-lg p-3 font-mono text-[11px] overflow-y-auto border border-white/5 scrollbar-thin scrollbar-thumb-white/10"
              >
                {logs.map((log, i) => (
                  <div key={i} className="py-0.5 border-l border-blue-500/30 pl-2 mb-1 text-white/70">
                    <span className="text-blue-400/50 mr-2">$</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400/80 font-medium">{error}</p>
        </motion.div>
      )}

      {stage === "success" && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Identity Verified</h3>
          <p className="text-sm text-white/60">
            Compliance confirmed on-chain without revealing your private data.
          </p>
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="mt-6 text-white/40 hover:text-white"
          >
            Start New Session
          </Button>
        </motion.div>
      )}
    </div>
  );
}