import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { x25519, RescueCipher, getMXEPublicKey } from "@arcium-hq/client";
import * as snarkjs from "snarkjs";
import { randomBytes } from "crypto";
import { ZkVerifierConfigSchema, VerifyComplianceSchema } from "./validation";
import { ValidationError, MpcError, ZkVerifierError, ZkVerifierErrorCode } from "./errors";

export interface ZkVerifierConfig {
  programId: PublicKey;
  arciumMxeId: string;
  arciumProgramId: PublicKey;
  circuitWasmPath: string;
  circuitZkeyPath: string;
}

export class ZkVerifierClient {
  private program: Program;
  private config: ZkVerifierConfig;
  
  constructor(
    private provider: anchor.AnchorProvider,
    config: ZkVerifierConfig
  ) {
    // Industrial check: Runtime configuration validation
    const result = ZkVerifierConfigSchema.safeParse(config);
    if (!result.success) {
      throw new ValidationError("Invalid Client Configuration", result.error.format());
    }

    this.config = config;

    // IDL will be exported from the @zk-verifier/idl package in a real build
    const placeholderIdl = { address: config.programId.toString(), metadata: { name: "zkverifier" }, instructions: [] };
    this.program = new Program(placeholderIdl as any, provider);
  }

  /**
   * High-Level Enterprise Verification Interface
   */
  async verifyCompliance(age: number, circuitId: string) {
    const valid = VerifyComplianceSchema.safeParse({ age, circuitId });
    if (!valid.success) {
      throw new ValidationError("Invalid verification parameters", valid.error.format());
    }

    const { publicKey } = this.provider.wallet;
    if (!publicKey) {
      throw new ZkVerifierError(ZkVerifierErrorCode.PROVIDER_UNAVAILABLE, "Wallet provider not found");
    }

    try {
      // 1. Arcium MPC Shielding (Encapsulated Handshake)
      const sharedSecret = await this.deriveMxeSharedSecret();
      const cipher = new RescueCipher(sharedSecret);
      const nonce = randomBytes(16);
      const ciphertext = cipher.encrypt([BigInt(age)], nonce);

      // 2. Local ZK Proving (Privacy Preservation)
      const { proof, publicSignals } = await this.generateGroth16Proof(age);

      // 3. Solana Registry Logic (Settlement)
      return await this.submitToRegistry(circuitId, proof, publicSignals);
    } catch (err: unknown) {
      if (err instanceof ZkVerifierError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      throw new ZkVerifierError(ZkVerifierErrorCode.ON_CHAIN_VERIFICATION_FAILED, message, err);
    }
  }

  private async deriveMxeSharedSecret() {
    try {
      const privateKey = x25519.utils.randomSecretKey();
      const mxePublicKey = await getMXEPublicKey(this.provider, this.config.arciumProgramId);
      return x25519.getSharedSecret(privateKey, mxePublicKey);
    } catch (err: unknown) {
      throw new MpcError("Failed to derive shared secret with Arcium MXE", err);
    }
  }

  private async generateGroth16Proof(age: number) {
    try {
      return await snarkjs.groth16.fullProve(
        { age },
        this.config.circuitWasmPath,
        this.config.circuitZkeyPath
      );
    } catch (err: unknown) {
      throw new ZkVerifierError(ZkVerifierErrorCode.PROOF_GENERATION_FAILED, "Local SNARK generation failed", err);
    }
  }

  private async submitToRegistry(circuitId: string, proof: { pi_a: string[], pi_b: string[][], pi_c: string[] }, publicSignals: string[]) {
    const [globalConfig] = PublicKey.findProgramAddressSync([Buffer.from("global-config")], this.program.programId);
    const [circuitRegistry] = PublicKey.findProgramAddressSync([Buffer.from("circuit"), Buffer.from(circuitId)], this.program.programId);
    const [verificationState] = PublicKey.findProgramAddressSync(
      [Buffer.from("compliance"), this.provider.wallet.publicKey.toBuffer(), circuitRegistry.toBuffer()],
      this.program.programId
    );

    const proofA = this.packPoint(proof.pi_a.slice(0, 2), 64);
    const proofB = this.packPointB(proof.pi_b.slice(0, 2));
    const proofC = this.packPoint(proof.pi_c.slice(0, 2), 64);
    const publicInputs = publicSignals.map((sig: string) => this.packPoint([sig], 32));

    return await this.program.methods
      .verifyCompliance(
        Array.from(proofA),
        Array.from(proofB),
        Array.from(proofC),
        publicInputs.map((i) => Array.from(i))
      )
      .accounts({
        verificationState,
        circuitRegistry,
        globalConfig,
        signer: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  private packPoint(point: string[], size: number): Uint8Array {
    const bytes = new Uint8Array(size);
    point.forEach((p, i) => {
      const hex = BigInt(p).toString(16).padStart(64, '0');
      bytes.set(anchor.utils.bytes.hex.decode(hex), i * 32);
    });
    return bytes;
  }

  private packPointB(point: string[][]): Uint8Array {
    const bytes = new Uint8Array(128);
    bytes.set(anchor.utils.bytes.hex.decode(BigInt(point[0][0]).toString(16).padStart(64, '0')), 0);
    bytes.set(anchor.utils.bytes.hex.decode(BigInt(point[0][1]).toString(16).padStart(64, '0')), 32);
    bytes.set(anchor.utils.bytes.hex.decode(BigInt(point[1][0]).toString(16).padStart(64, '0')), 64);
    bytes.set(anchor.utils.bytes.hex.decode(BigInt(point[1][1]).toString(16).padStart(64, '0')), 96);
    return bytes;
  }
}
