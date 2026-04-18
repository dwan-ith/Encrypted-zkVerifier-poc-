export enum ZkVerifierErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MPC_HANDSHAKE_FAILED = "MPC_HANDSHAKE_FAILED",
  PROOF_GENERATION_FAILED = "PROOF_GENERATION_FAILED",
  ON_CHAIN_VERIFICATION_FAILED = "ON_CHAIN_VERIFICATION_FAILED",
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export class ZkVerifierError extends Error {
  constructor(
    public readonly code: ZkVerifierErrorCode,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = "ZkVerifierError";
  }
}

export class ValidationError extends ZkVerifierError {
  constructor(message: string, details?: any) {
    super(ZkVerifierErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class MpcError extends ZkVerifierError {
  constructor(message: string, details?: any) {
    super(ZkVerifierErrorCode.MPC_HANDSHAKE_FAILED, message, details);
  }
}
