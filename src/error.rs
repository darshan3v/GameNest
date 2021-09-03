use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Clone, Copy)]

pub enum EscrowError {
    #[error("Invalid Instruction")]
    InvalidInstruction,

    #[error("Missing Required Permissions")]
    MissingPermission,

    #[error("Incorrect Acc")]
    IncorrectAcc,

    #[error("Amount Overflow")]
    AmountOverflow,

    #[error("Escrow Taken")]
    EscrowAlreadyTaken,

    #[error("Asset Space Filled")]
    AssetSpaceFull,
}

impl From<EscrowError> for ProgramError {
    fn from(e: EscrowError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
