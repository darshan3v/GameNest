use solana_program::{
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

use crate::error::EscrowError;
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct Escrow {
    pub acc_type: u8, // 0 for unitialsied 1 for Escrow type and 2 for Game type
    pub is_taken: bool,
    pub initialiser_main_acc: Pubkey,
    pub initialiser_game_acc: Pubkey,
    pub taker_game_acc: Pubkey,
    pub esc_taken_time: i64, // it will be unix timestamp
    pub amount: u64,         // in lamports
    pub time: u64,           //  in minutes
    pub asset_id: u64,
}

impl Sealed for Escrow {}

impl IsInitialized for Escrow {
    fn is_initialized(&self) -> bool {
        self.acc_type == 1
    }
}

impl Pack for Escrow {
    const LEN: usize = 130;

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let src = array_ref![src, 0, Escrow::LEN];
        let (
            acc_type,
            is_taken,
            initialiser_main_acc,
            initialiser_game_acc,
            taker_game_acc,
            esc_taken_time,
            amount,
            time,
            asset_id,
        ) = array_refs![src, 1, 1, 32, 32, 32, 8, 8, 8, 8];

        let acc_type: u8 = match acc_type {
            [0] => 0,
            [1] => 1,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        let is_taken = match is_taken {
            [0] => false,
            [1] => true,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        Ok(Escrow {
            acc_type,
            is_taken,
            initialiser_main_acc: Pubkey::new_from_array(*initialiser_main_acc),
            initialiser_game_acc: Pubkey::new_from_array(*initialiser_game_acc),
            taker_game_acc: Pubkey::new_from_array(*taker_game_acc),
            esc_taken_time: i64::from_le_bytes(*esc_taken_time),
            amount: u64::from_le_bytes(*amount),
            time: u64::from_le_bytes(*time),
            asset_id: u64::from_le_bytes(*asset_id),
        })
    }

    fn pack_into_slice(&self, ad: &mut [u8]) {
        // ad - actual data location
        let ad = array_mut_ref![ad, 0, Escrow::LEN];
        let (
            acc_type_ad,
            is_taken_ad,
            initialiser_main_acc_ad,
            initialiser_game_acc_ad,
            taker_game_acc_ad,
            esc_taken_time_ad,
            amount_ad,
            time_ad,
            asset_id_ad,
        ) = mut_array_refs![ad, 1, 1, 32, 32, 32, 8, 8, 8, 8];

        let Escrow {
            acc_type,
            is_taken,
            initialiser_main_acc,
            initialiser_game_acc,
            taker_game_acc,
            esc_taken_time,
            amount,
            time,
            asset_id,
        } = self;

        acc_type_ad[0] = *acc_type;
        is_taken_ad[0] = *is_taken as u8;
        initialiser_main_acc_ad.copy_from_slice(initialiser_main_acc.as_ref());
        initialiser_game_acc_ad.copy_from_slice(initialiser_game_acc.as_ref());
        taker_game_acc_ad.copy_from_slice(taker_game_acc.as_ref());
        *esc_taken_time_ad = esc_taken_time.to_le_bytes();
        *amount_ad = amount.to_le_bytes();
        *time_ad = time.to_le_bytes();
        *asset_id_ad = asset_id.to_le_bytes();
    }
}

pub struct GameAcc {
    pub acc_type: u8,
    pub userspace_owner: Pubkey,
    pub owned: [u64; 20],  //owned by player and using
    pub rented: [u64; 20], // using but taken from others on rent
}

impl Sealed for GameAcc {}

impl IsInitialized for GameAcc {
    fn is_initialized(&self) -> bool {
        self.acc_type == 2
    }
}

impl GameAcc {
    // this will transfer asset from sender's owned to reciever's rented
    //you can't give the rented asset for rent
    pub fn transfer_asset(
        sender_acc_info: &mut GameAcc,
        reciever_acc_info: &mut GameAcc,
        asset_id: u64,
    ) -> Result<(), ProgramError> {
        let mut is_absent = true;
        let mut is_full = true;
        let mut a: usize = 0; // 0 so that compiler doesn't show us of uninitialsied variable

        for i in 0..20 {
            if sender_acc_info.owned[i] == asset_id {
                is_absent = false;
                a = i;
                break;
            }
        }

        if is_absent {
            return Err(EscrowError::IncorrectAcc.into()); // incorrect account as it is not eligible to sender
        }

        for j in 0..20 {
            if reciever_acc_info.rented[j] == 0 {
                reciever_acc_info.rented[j] = asset_id;
                is_full = false;
                break;
            }
        }
        if is_full {
            return Err(EscrowError::AssetSpaceFull.into());
        }

        sender_acc_info.owned[a] = 0;

        Ok(())
    }

    // this will transfer asset from sender's rented to recievers's owned
    pub fn revert_asset(
        sender_acc_info: &mut GameAcc,
        reciever_acc_info: &mut GameAcc,
        asset_id: u64,
    ) -> Result<(), ProgramError> {
        for i in 0..20 {
            if sender_acc_info.rented[i] == asset_id {
                sender_acc_info.rented[i] = 0;
                break;
            }
        }

        for i in 0..20 {
            if reciever_acc_info.owned[i] == 0 {
                reciever_acc_info.owned[i] = asset_id; // currently the error case
                break; //where the taker of escrow has given his assset on rent
                       //but has also filled his owned space then that can't come back, is not handled
            }
        }

        Ok(())
    }
}

impl Pack for GameAcc {
    const LEN: usize = 353;

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let mut owned: [u64; 20] = [0; 20];
        let mut rented: [u64; 20] = [0; 20];
        let src = array_ref![src, 0, GameAcc::LEN];
        let (acc_type, userspace_owner, owned_ref, rented_ref) = array_refs![src, 1, 32, 160, 160];

        let acc_type: u8 = match acc_type {
            [0] => 0,
            [2] => 2,
            _ => return Err(ProgramError::InvalidAccountData),
        };

        for i in 1..=20 {
            owned[i - 1] =
                u64::from_le_bytes(*array_ref![&(owned_ref[((i - 1) * 8)..(i * 8)]), 0, 8]);
            rented[i - 1] =
                u64::from_le_bytes(*array_ref![&(rented_ref[((i - 1) * 8)..(i * 8)]), 0, 8]);
        }

        Ok(GameAcc {
            acc_type: acc_type,
            userspace_owner: Pubkey::new_from_array(*userspace_owner),
            owned: owned,
            rented: rented,
        })
    }

    fn pack_into_slice(&self, ad: &mut [u8]) {
        let ad = array_mut_ref![ad, 0, GameAcc::LEN];
        let (acc_type_ad, userspace_owner_ad, owned_ad, rented_ad) =
            mut_array_refs![ad, 1, 32, 160, 160];

        let GameAcc {
            acc_type,
            userspace_owner,
            owned,
            rented,
        } = self;

        for i in 0..20 {
            for j in 0..8 {
                owned_ad[i * 8 + j] = owned[i].to_le_bytes()[j];
                rented_ad[i * 8 + j] = rented[i].to_le_bytes()[j];
            }
        }

        acc_type_ad[0] = *acc_type;
        userspace_owner_ad.copy_from_slice(userspace_owner.as_ref());
    }
}
