import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { x25519, RescueCipher, getMXEPublicKey } from "@arcium-hq/client";
import * as snarkjs from "snarkjs";
import { randomBytes } from "crypto";

export interface ZkVerifierConfig {
  programId: PublicKey;
  arciumMxeId: string;
  arciumProgramId: PublicKey;
  circuitWasmPath: string;
  circuitZkeyPath: string;
}

export class ZkVerifierClient {
  private program: Program;
  
  constructor(
    private provider: anchor.AnchorProvider,
    private config: ZkVerifierConfig
  ) {
    // IDL will be exported from the @zk-verifier/idl package in a real build
    const placeholderIdl = { address: config.programId.toString(), metadata: { name: "zkverifier" }, instructions: [] };
    this.program = new Program(placeholderIdl as any, provider);
  }

  /**
   * Executes the full confidential verification flow:
   * 1. MPC Key Exchange with Arcium
   * 2. Local ZK-Proof Generation
   * 3. On-chain Registry Verification
   */
  async verifyCompliance(age: number, circuitId: string) {
    const { publicKey } = this.provider.wallet;
    if (!publicKey) throw new Error("Wallet not connected");

    // 1. Arcium MPC Shielding
    const privateKey = x25519.utils.randomSecretKey();
    const mxePublicKey = await getMXEPublicKey(this.provider, this.config.arciumProgramId);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);
    const nonce = randomBytes(16);
    const ciphertext = cipher.encrypt([BigInt(age)], nonce);

    // 2. Local ZK Proving
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { age },
      this.config.circuitWasmPath,
      this.config.circuitZkeyPath
    );

    // 3. Solana Registry Verification
    const [circuitRegistry] = PublicKey.findProgramAddressSync(
      [Buffer.from("circuit"), Buffer.from(circuitId)],
      this.config.programId
    );

    const [verificationState] = PublicKey.findProgramAddressSync(
      [Buffer.from("compliance"), publicKey.toBuffer(), circuitRegistry.toBuffer()],
      this.config.programId
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
        signer: publicKey,
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
