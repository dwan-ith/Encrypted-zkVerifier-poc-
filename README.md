# Encrypted ZK-Verifier

A framework for confidential identity verification using **Arcium MPC (Multi-Party Computation)** and **Groth16 Zero-Knowledge Proofs** on the Solana blockchain.

## Architecture

This project implements a "Shielded Proving" flow where private user data is processed through MPC and verified on-chain via ZK-SNARKs.

### 1. Cryptographic Stack
- **Arcium (MPC)**: Utilizes `x25519` key exchange to derive a shared secret with an MXE (MPC Execution Environment). Inputs are encrypted using the **RescueCipher**.
- **SnarkJS (ZK)**: Locally generates a Groth16 proof that the encrypted input complies with specific rules (e.g., `age >= 18`) without revealing the age to the frontend or the blockchain.
- **Solana (Settlement)**: The `zkverifier` Anchor program performs the final mathematical verification of the SNARK proof using the pre-deployed Verification Key (VK).

### 2. Frontend Engineering (Next.js 15)
- **State Machine**: Verification flow managed by `useZkVerifier` hook (Idle -> Keys -> Proving -> Verifying -> Success).
- **Aesthetics**: Premium Glassmorphism UI with **Framer Motion** animations.
- **Transperancy**: Real-time cryptographic console showing key hashes and proof points.

## Deployment 

### Local Environment Preparation
1. **Enable Windows Developer Mode**: Required for the Solana BPF toolchain to create symbolic links.
2. **Install Circuits**:
   ```bash
   cd circuits
   npm install
   npm run setup
   ```
   *This downloads the PTAU file (Powers of Tau) and generates the Groth16 ZKeys/Verification Keys.*

### Blockchain Deployment (Solana Devnet)
1. **Deploy Contract**:
   ```bash
   cd contracts
   anchor build
   anchor deploy
   ```
2. **Initialize Verifier**:
   Use the administrative script in `scripts/` to upload the `verification_key.json` generated in the previous step to the `VerifierState` account on-chain.

## Security Model
- **Privacy**: The user's raw age never leaves the local environment in unencrypted form.
- **Soundness**: The Groth16 proof guarantees that the encrypted payload *must* satisfy the circuit constraints.
- **Transparency**: Every step of the cryptographic handshake is logged in the UI for auditability.

---
**License**: MIT
