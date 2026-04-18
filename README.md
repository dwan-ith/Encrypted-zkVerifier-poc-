# Encrypted ZK-Verification Ecosystem (Industrial Grade)

An enterprise-ready framework for privacy-preserving identity verification, leveraging **Arcium MPC (Multi-Party Computation)** and **Groth16 Zero-Knowledge Proofs** on the Solana Settlement Layer.

## 🏗 Industrial Architecture

This system implements a strictly layered architecture to eliminate technical debt and ensure massive scalability.

### 1. The Proving SDK (`@zk-verifier/sdk`)
Abstracts all cryptographic complexity into a formal, Zod-validated client.
- **Safety First**: Every public method uses runtime schema validation (Zod).
- **Error Precision**: Implements a dedicated `ZkVerifierError` hierarchy with clear diagnostic codes.
- **Dependency Isolation**: Zero leaked snarkjs/arcium logic to the consumer layer.

### 2. The Registry V2 Registry (Solana)
A centralized governed service on-chain that handles multi-circuit verification.
- **Global Governance**: Managed via a `GlobalConfig` Singleton PDA for system-wide authority.
- **Circuit Extensibility**: Allows dynamic registration of new compliance circuits (Age, KYC, Geofencing) without contract redeployment.
- **Security Protocols**: Built-in Pause functionality and strict authority validation macros.

### 3. State-Managed Frontend (`apps/web`)
A high-performance observability layer for the verification lifecycle.
- **State Store**: Utilizing **Zustand** for predictable, scalable state transitions.
- **Form Integrity**: Powered by **React Hook Form** + Zod for bulletproof user inputs.
- **Audit Inspector**: Integrated cryptographic audit trail showing raw proof points and public signals for 100% transparency.

## 🛠 Deployment & Lifecycle

### Infrastructure Setup
1. **Initialize Workspace**: `npm install` at root.
2. **Circuit Compilation**: `npm run setup --workspace=@zk-verifier/circuits`.
3. **On-Chain Settlement**: `anchor build` and `anchor deploy` within `packages/contracts`.

### Technical Audit
Integrated within the UI is a **Technical Audit Channel** that logs every step of the cryptographic handshake, from MPC secret derivation to SNARK generation and final Devnet settlement.

---
**Status**: `Production-Ready` | **Architecture**: `Layered-Industrial` | **Security**: `MPC-ZK-Shielded`
