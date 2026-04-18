use anchor_lang::prelude::*;
use groth16_solana::groth16::Groth16Verifier;

declare_id!("EupvvHUhNofTocZecsmXczS3EiAtNNKV8SzMsj7K8LDN");

#[program]
pub mod zkverifier {
    use super::*;

    /// Verifies a Groth16 ZK-Proof and updates the on-chain verification state.
    /// Emits a [ProofVerified] event upon success.
    pub fn verify_proof(
        ctx: Context<VerifyProof>, 
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        public_inputs: Vec<[u8; 32]>
    ) -> Result<()> {
        let verifier = Groth16Verifier::new(
            &ctx.accounts.verifier_state.verifying_key,
        ).map_err(|_| ErrorCode::InvalidVerifierState)?;

        // Prepare public input references for the Solana Groth16 syscall/lib
        let public_inputs_ref: Vec<&[u8; 32]> = public_inputs.iter().collect();

        verifier.verify(&proof_a, &proof_b, &proof_c, &public_inputs_ref)
            .map_err(|_| ErrorCode::ProofVerificationFailed)?;

        // Update verification status for the specific user
        let state = &mut ctx.accounts.verification_state;
        state.is_verified = true;
        state.last_verified_at = Clock::get()?.unix_timestamp;
        state.user = ctx.accounts.signer.key();

        emit!(ProofVerified {
            user: ctx.accounts.signer.key(),
            timestamp: state.last_verified_at,
        });

        msg!("ZK-Proof verified successfully for user: {}", ctx.accounts.signer.key());
        Ok(())
    }

    /// Initializes a global verifier state with a pre-computed Verifying Key.
    /// Currently anyone can initialize, but in production this should be restricted to an admin.
    pub fn initialize_verifier(ctx: Context<InitializeVerifier>, vkey: [u8; 1024]) -> Result<()> {
        let verifier_state = &mut ctx.accounts.verifier_state;
        verifier_state.verifying_key = vkey;
        verifier_state.initialized_at = Clock::get()?.unix_timestamp;
        
        msg!("Verifier state initialized at: {}", verifier_state.initialized_at);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyProof<'info> {
    #[account(
        init_if_needed, 
        payer = signer, 
        space = 8 + 1 + 8 + 32, // bool + i64 + pubkey
        seeds = [b"verification", signer.key().as_ref()],
        bump
    )]
    pub verification_state: Account<'info, VerificationState>,
    #[account(mut)]
    pub verifier_state: Account<'info, VerifierState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeVerifier<'info> {
    #[account(init, payer = signer, space = 8 + 1024 + 8)]
    pub verifier_state: Account<'info, VerifierState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VerificationState {
    pub is_verified: bool,
    pub last_verified_at: i64,
    pub user: Pubkey,
}

#[account]
pub struct VerifierState {
    pub verifying_key: [u8; 1024],
    pub initialized_at: i64,
}

#[event]
pub struct ProofVerified {
    pub user: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The verifier state contains an invalid verifying key.")]
    InvalidVerifierState,
    #[msg("The provided Groth16 proof is mathematically incorrect for the circuit.")]
    ProofVerificationFailed,
    #[msg("The verification request has timed out or is outdated.")]
    VerificationTimeout,
}
