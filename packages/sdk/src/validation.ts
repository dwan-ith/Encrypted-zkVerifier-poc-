import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

/**
 * Custom Zod validator for Solana PublicKeys
 */
export const PublicKeySchema = z.custom<PublicKey>(
  (val) => val instanceof PublicKey,
  { message: "Invalid Solana PublicKey object" }
);

/**
 * Configuration schema for the ZkVerifierClient
 */
export const ZkVerifierConfigSchema = z.object({
  programId: PublicKeySchema,
  arciumMxeId: z.string().min(1),
  arciumProgramId: PublicKeySchema,
  circuitWasmPath: z.string().min(1),
  circuitZkeyPath: z.string().min(1),
});

/**
 * Verification input schema
 */
export const VerifyComplianceSchema = z.object({
  age: z.number().int().min(0).max(150),
  circuitId: z.string().min(1).max(32),
});
