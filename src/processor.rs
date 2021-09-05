use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};

use crate::error::EscrowError;
use crate::instruction::{InitEscData, InstructionType};
use crate::state::{Escrow, GameAcc};
use solana_program::clock::Clock;
use std::convert::TryInto;

pub struct Processor;

impl Processor {
    pub fn process_instruction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = InstructionType::unpack(instruction_data)?;

        match instruction {
            InstructionType::InitEscrow(init_esc_data) => {
                msg!(" Init Escrow instruction");
                Self::process_init_escrow(program_id, accounts, init_esc_data)
            }

            InstructionType::TakeEscrow => {
                msg!(" Take Escrow instruction");
                Self::process_take_escrow(program_id, accounts)
            }

            InstructionType::Revert => Self::revert(program_id, accounts),

            InstructionType::InitGameAcc => Self::process_init_game_acc(program_id, accounts),

            InstructionType::AddAsset(asset_id) => Self::add_asset(program_id, accounts, asset_id),
        }
    }

    fn process_init_escrow(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        init_esc_data: InitEscData,
    ) -> ProgramResult {
        let acc_info_iter = &mut accounts.iter();

        let escrow_acc = next_account_info(acc_info_iter)?;

        if !escrow_acc.is_writable {
            return Err(EscrowError::MissingPermission.into());
        }

        let initialiser_game_acc = next_account_info(acc_info_iter)?;

        if initialiser_game_acc.owner != program_id || escrow_acc.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        let initialiser_main_acc = next_account_info(acc_info_iter)?;

        let rent = Rent::get()?;

        if escrow_acc.lamports()
            < (rent.minimum_balance(escrow_acc.data_len()) + init_esc_data.amount)
        {
            return Err(ProgramError::InsufficientFunds);
        }

        if escrow_acc.data.borrow()[0] == 2 {
            // this implies it is game_acc not escrow
            return Err(EscrowError::IncorrectAcc.into());
        }

        if initialiser_game_acc.data.borrow()[0] != 2 {
            // this implies it is  not game_acc
            return Err(EscrowError::IncorrectAcc.into());
        }

        let mut escrow_info = Escrow::unpack_unchecked(&escrow_acc.data.borrow())?;

        if escrow_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        // let taker_acc still be None it will be updated after take escrow

        escrow_info.acc_type = 1;
        escrow_info.is_taken = false;
        escrow_info.initialiser_main_acc = *initialiser_main_acc.key;
        escrow_info.initialiser_game_acc = *initialiser_game_acc.key;
        escrow_info.amount = init_esc_data.amount;
        escrow_info.time = init_esc_data.time;
        escrow_info.asset_id = init_esc_data.asset_id;

        Escrow::pack(escrow_info, &mut escrow_acc.data.borrow_mut())?;

        Ok(())
    }

    fn process_take_escrow(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let acc_info_iter = &mut accounts.iter();

        let taker_main_acc = next_account_info(acc_info_iter)?;

        if !taker_main_acc.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let escrow_acc = next_account_info(acc_info_iter)?;

        if escrow_acc.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        if escrow_acc.data.borrow()[0] != 1 {
            // this implies it is not escrow
            return Err(EscrowError::IncorrectAcc.into());
        }

        let mut escrow_info = Escrow::unpack_unchecked(&escrow_acc.data.borrow())?;

        if escrow_info.is_taken {
            return Err(EscrowError::EscrowAlreadyTaken.into());
        }

        let initialiser_game_acc = next_account_info(acc_info_iter)?;

        let taker_game_acc = next_account_info(acc_info_iter)?;

        if taker_game_acc.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        if !escrow_acc.is_writable
            || !initialiser_game_acc.is_writable
            || !taker_game_acc.is_writable
        {
            return Err(EscrowError::MissingPermission.into());
        }

        if escrow_info.initialiser_game_acc != *initialiser_game_acc.key {
            return Err(EscrowError::IncorrectAcc.into());
        }

        if taker_game_acc.data.borrow()[0] != 2 {
            return Err(EscrowError::IncorrectAcc.into());
        }

        let mut taker_game_info = GameAcc::unpack_unchecked(&taker_game_acc.data.borrow())?;
        let mut initialiser_game_info =
            GameAcc::unpack_unchecked(&initialiser_game_acc.data.borrow())?;

        if taker_game_info.userspace_owner != *taker_main_acc.key {
            return Err(EscrowError::IncorrectAcc.into());
        }

        // check if has required asset and if transfer is possible do it

        GameAcc::transfer_asset(
            &mut taker_game_info,
            &mut initialiser_game_info,
            escrow_info.asset_id,
        )?;

        msg!("Escrow Taken");

        escrow_info.is_taken = true;
        escrow_info.taker_game_acc = *taker_game_acc.key;

        msg!("sending amount to taker_acc from escrow_acc");

        *(*taker_main_acc.lamports.borrow_mut()) = taker_main_acc
            .lamports()
            .checked_add(escrow_info.amount)
            .ok_or(EscrowError::AmountOverflow)?;

        *(*escrow_acc.lamports.borrow_mut()) = escrow_acc.lamports() - escrow_info.amount;

        let clock = Clock::get()?;
        escrow_info.esc_taken_time = clock.unix_timestamp;

        Escrow::pack(escrow_info, &mut escrow_acc.data.borrow_mut())?;
        GameAcc::pack(
            initialiser_game_info,
            &mut initialiser_game_acc.data.borrow_mut(),
        )?;
        GameAcc::pack(taker_game_info, &mut taker_game_acc.data.borrow_mut())?;

        Ok(())
    }

    fn revert(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let acc_info_iter = &mut accounts.iter();

        let initialiser_main_acc = next_account_info(acc_info_iter)?;

        if !initialiser_main_acc.is_writable {
            return Err(EscrowError::MissingPermission.into());
        }

        let escrow_acc = next_account_info(acc_info_iter)?;

        if escrow_acc.data.borrow()[0] != 1 {
            // this implies it is not escrow
            return Err(EscrowError::IncorrectAcc.into());
        }

        let escrow_info = Escrow::unpack_unchecked(&escrow_acc.data.borrow())?;

        if !escrow_info.is_taken {
            return Err(EscrowError::InvalidInstruction.into());
        }

        let initialiser_game_acc = next_account_info(acc_info_iter)?;

        let taker_game_acc = next_account_info(acc_info_iter)?;

        if !escrow_acc.is_writable
            || !initialiser_game_acc.is_writable
            || !taker_game_acc.is_writable
        {
            return Err(EscrowError::MissingPermission.into());
        }

        if escrow_acc.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        if escrow_info.initialiser_game_acc != *initialiser_game_acc.key
            || escrow_info.taker_game_acc != *taker_game_acc.key 
            || escrow_info.initialiser_main_acc != *initialiser_main_acc.key
        {
            return Err(EscrowError::IncorrectAcc.into());
        }

        // check if given_time has passed

        let clock = Clock::get()?;

        if (clock.unix_timestamp - escrow_info.esc_taken_time)
            <= (escrow_info.time * 60).try_into().unwrap()
        {
            return Err(EscrowError::InvalidInstruction.into());
        }

        let mut taker_game_info = GameAcc::unpack_unchecked(&taker_game_acc.data.borrow())?;
        let mut initialiser_game_info =
            GameAcc::unpack_unchecked(&initialiser_game_acc.data.borrow())?;

        // revert back the asset

        GameAcc::revert_asset(
            &mut initialiser_game_info,
            &mut taker_game_info,
            escrow_info.asset_id,
        )?;

        msg!("sending rent-exempt amount to initialiser_acc from escrow_acc");

        *(*initialiser_main_acc.lamports.borrow_mut()) = initialiser_main_acc
            .lamports()
            .checked_add(escrow_acc.lamports())
            .ok_or(EscrowError::AmountOverflow)?;

        *(*escrow_acc.lamports.borrow_mut()) = 0;

        *escrow_acc.data.borrow_mut() = &mut [];

        Ok(())
    }

    fn process_init_game_acc(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
        let acc_info_iter = &mut accounts.iter();

        let game_acc = next_account_info(acc_info_iter)?;

        if !game_acc.is_writable {
            return Err(EscrowError::MissingPermission.into());
        }

        if game_acc.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        if game_acc.data.borrow()[0] != 0 {
            // this implies it is initialised
            return Err(EscrowError::IncorrectAcc.into());
        }

        let main_acc = next_account_info(acc_info_iter)?;
        let rent = Rent::get()?;

        if game_acc.lamports() < rent.minimum_balance(game_acc.data_len()) {
            return Err(ProgramError::InsufficientFunds);
        }

        let mut game_acc_info = GameAcc::unpack_unchecked(&game_acc.data.borrow())?;

        game_acc_info.userspace_owner = *main_acc.key;
        game_acc_info.acc_type = 2;

        GameAcc::pack(game_acc_info, &mut game_acc.data.borrow_mut())?;

        Ok(())
    }

    fn add_asset(program_id: &Pubkey, accounts: &[AccountInfo], asset_id: u64) -> ProgramResult {
        let acc_info_iter = &mut accounts.iter();

        let game_acc = next_account_info(acc_info_iter)?;

        if !game_acc.is_writable {
            return Err(EscrowError::MissingPermission.into());
        }

        if game_acc.owner != program_id {
            return Err(ProgramError::IncorrectProgramId);
        }

        if game_acc.data.borrow()[0] != 2 {
            // this implies it is not game_acc
            return Err(EscrowError::IncorrectAcc.into());
        }

        let mut game_acc_info = GameAcc::unpack_unchecked(&game_acc.data.borrow())?;

        let mut is_full = true;

        for i in 0..20 {
            if game_acc_info.owned[i] == 0 {
                game_acc_info.owned[i] = asset_id;
                is_full = false;
            }
        }

        if is_full {
            return Err(EscrowError::AssetSpaceFull.into());
        }

        GameAcc::pack(game_acc_info, &mut game_acc.data.borrow_mut())?;

        Ok(())
    }
}
