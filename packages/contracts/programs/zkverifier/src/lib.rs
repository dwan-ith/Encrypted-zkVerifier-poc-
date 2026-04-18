use anchor_lang::prelude::*;
use groth16_solana::groth16::Groth16Verifier;

declare_id!("EupvvHUhNofTocZecsmXczS3EiAtNNKV8SzMsj7K8LDN");

#[program]
pub mod zkverifier {
    use super::*;

    /// Registers a new ZK-Circuit verification key in the registry.
    /// This allows the program to support multiple different compliance checks.
    pub fn register_circuit(
        ctx: Context<RegisterCircuit>, 
        circuit_id: String, 
        vkey: [u8; 1024]
    ) -> Result<()> {
        let registry = &mut ctx.accounts.circuit_registry;
        registry.circuit_id = circuit_id;
        registry.verifying_key = vkey;
        registry.authority = ctx.accounts.authority.key();
        registry.created_at = Clock::get()?.unix_timestamp;

        msg!("Registered new ZK-Circuit with ID: {}", registry.circuit_id);
        Ok(())
    }

    /// Verifies a Groth16 ZK-Proof against a registered circuit in the registry.
    pub fn verify_compliance(
        ctx: Context<VerifyCompliance>, 
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        public_inputs: Vec<[u8; 32]>
    ) -> Result<()> {
        let verifier = Groth16Verifier::new(
            &ctx.accounts.circuit_registry.verifying_key,
        ).map_err(|_| ErrorCode::InvalidVerifierState)?;

        let public_inputs_ref: Vec<&[u8; 32]> = public_inputs.iter().collect();

        verifier.verify(&proof_a, &proof_b, &proof_c, &public_inputs_ref)
            .map_err(|_| ErrorCode::ProofVerificationFailed)?;

        // Record the successful verification for the user
        let state = &mut ctx.accounts.verification_state;
        state.is_compliant = true;
        state.last_verified_at = Clock::get()?.unix_timestamp;
        state.circuit_id = ctx.accounts.circuit_registry.circuit_id.clone();
        state.user = ctx.accounts.signer.key();

        emit!(ComplianceVerified {
            user: ctx.accounts.signer.key(),
            circuit_id: state.circuit_id.clone(),
            timestamp: state.last_verified_at,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(circuit_id: String)]
pub struct RegisterCircuit<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 1024 + 32 + 8, // disc + id (string) + key + auth + timestamp
        seeds = [b"circuit", circuit_id.as_bytes()],
        bump
    )]
    pub circuit_registry: Account<'info, CircuitRegistry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyCompliance<'info> {
    #[account(
        init_if_needed, 
        payer = signer, 
        space = 8 + 1 + 8 + 32 + 32, // disc + bool + timestamp + id + user
        seeds = [b"compliance", signer.key().as_ref(), circuit_registry.key().as_ref()],
        bump
    )]
    pub verification_state: Account<'info, UserComplianceState>,
    pub circuit_registry: Account<'info, CircuitRegistry>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct CircuitRegistry {
    pub circuit_id: String,
    pub verifying_key: [u8; 1024],
    pub authority: Pubkey,
    pub created_at: i64,
}

#[account]
pub struct UserComplianceState {
    pub is_compliant: bool,
    pub last_verified_at: i64,
    pub circuit_id: String,
    pub user: Pubkey,
}

#[event]
pub struct ComplianceVerified {
    pub user: Pubkey,
    pub circuit_id: String,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The registry state is corrupt or uninitialized.")]
    InvalidVerifierState,
    #[msg("The provided ZK-Proof failed mathematical verification.")]
    ProofVerificationFailed,
}
