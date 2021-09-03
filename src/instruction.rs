use solana_program::program_error::ProgramError;
use std::convert::TryInto;

use crate::error::EscrowError::InvalidInstruction;

pub struct InitEscData {
    pub amount: u64, // in lamports
    pub time: u64,   // in minutes
    pub asset_id: u64,
}

pub enum InstructionType {
    /// Accounts expected for Init Escrow
    /// 0. [writable] Escrow A/c
    /// 1. [] initialisers Game Program A/c
    /// 2. [] initialisers main A/c
    InitEscrow(InitEscData),

    /// Accounts expected for Taking Escrow
    /// 0. [signer] taker's main A/c (signed) to transfer assets from his game_acc to other game_acc
    /// 1. [writable] Escrow A/c
    /// 2. [writable] initialisers Game Program A/c
    /// 3. [writable] Taker's Game Program A/c
    TakeEscrow,

    /// 0. [writable] initialiser's main A/c to transfer back rent fees
    /// 1. [writable] Escrow A/c
    /// 2. [writable] initialisers Game Program A/c
    /// 3. [writable] Taker's Game Program A/c
    Revert,

    /// 0.[writable] game_account where we will assign user_space ownership
    /// 1.[] game owners main acc to assign him user_space ownership
    InitGameAcc,

    ///  0.[writable] game_account to which asset is to be added
    /// currently restrictions on adding asset are not implemented
    /// u64 is the asset id and it should not be 0 since 0 will be used to represent Null
    AddAsset(u64),
}

impl InstructionType {
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (mode, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match mode {
            0 => Self::InitEscrow(Self::unpack_struct(rest)?),

            1 => Self::TakeEscrow,

            2 => Self::Revert,

            3 => Self::InitGameAcc,

            4 => Self::AddAsset(Self::unpack_asset(rest)?),

            _ => return Err(InvalidInstruction.into()),
        })
    }

    fn unpack_struct(input: &[u8]) -> Result<InitEscData, ProgramError> {
        let amount: u64 = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok()) // convert the slice into u8 array
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        let time: u64 = input
            .get(8..16)
            .and_then(|slice| slice.try_into().ok()) // convert the slice into u8 array
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        let asset_id: u64 = input
            .get(16..24)
            .and_then(|slice| slice.try_into().ok()) // convert the slice into u8 array
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        let data = InitEscData {
            amount: amount,
            time: time,
            asset_id: asset_id,
        };

        Ok(data)
    }

    fn unpack_asset(input: &[u8]) -> Result<u64, ProgramError> {
        let asset_id: u64 = input
            .get(..8)
            .and_then(|slice| slice.try_into().ok()) // convert the slice into u8 array
            .map(u64::from_le_bytes)
            .ok_or(InvalidInstruction)?;

        Ok(asset_id)
    }
}
