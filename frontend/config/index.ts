import { PublicKey } from "@solana/web3.js";

/**
 * Global Configuration for the Encrypted ZK-Verifier
 */
export const CONFIG = {
  SOLANA: {
    CLUSTER: "devnet",
    PROGRAM_ID: new PublicKey("EupvvHUhNofTocZecsmXczS3EiAtNNKV8SzMsj7K8LDN"),
    // In production, this would be computed or fetched from a deployment registry
    VERIFIER_STATE: new PublicKey("J8ZAeX9FNSezzddqdUyHs4ctv35cVfWhRP5iPTbdoEdm"),
    ARCIUM_PROGRAM_ID: new PublicKey("YourArciumProgramId"), // TODO: Replace after arcium deploy
  },
  ARCIUM: {
    MXE_ID: process.env.NEXT_PUBLIC_ARCIUM_MXE_ID || "test-mxe-id",
  },
  ZK: {
    WASM_PATH: "/circuits/build/compliance_js/compliance.wasm",
    ZKEY_PATH: "/circuits/build/compliance_final.zkey",
  },
  UI: {
    STEPS: [
      { id: "idle", label: "Ready" },
      { id: "exchanging", label: "Key Exchange" },
      { id: "encrypting", label: "Arcium Shielding" },
      { id: "proving", label: "ZK Proving" },
      { id: "verifying", label: "Solana Verification" },
      { id: "success", label: "Complete" },
    ],
  },
};
