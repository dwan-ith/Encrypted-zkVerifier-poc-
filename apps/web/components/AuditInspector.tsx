"use client";

import { useVerificationStore } from "../store/useVerificationStore";
import { Terminal, Copy, Shield } from "lucide-react";

export function AuditInspector() {
  const { proofMetadata } = useVerificationStore();

  if (!proofMetadata) return null;

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center space-x-2 px-1">
        <Shield className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
          Industrial Proof Audit
        </h3>
      </div>
      
      <div className="bg-black/60 rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center space-x-3">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Raw Cryptographic Output
            </span>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(JSON.stringify(proofMetadata, null, 2))}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
          >
            <Copy className="w-3 h-3 text-white/20 group-hover:text-white/60" />
          </button>
        </div>
        
        <div className="p-6 font-mono text-[10px] space-y-4 overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-blue-400/80 font-bold block">PROOF_A_POINT</span>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 break-all text-white/40">
                {JSON.stringify(proofMetadata.proof?.pi_a?.slice(0, 2))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-blue-400/80 font-bold block">PUBLIC_SIGNALS</span>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 break-all text-white/40">
                {JSON.stringify(proofMetadata.publicSignals)}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <span className="text-emerald-400/80 font-bold block">VERIFICATION_KEY_MANIFEST</span>
            <pre className="p-4 bg-black/40 rounded-xl border border-white/5 text-white/30 overflow-x-auto">
              {JSON.stringify(proofMetadata.vkey, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
