import { PublicKey } from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";

export const Asset_Space = 20;
export const program_id = new PublicKey('GA1ca3KjdsHeXGoikYcd3zn8gKHb1q3WVmSjSXG6Bu2e'); // write program_id here as public key object
// layout for public-key

const publickey = (property : string) => {
    return BufferLayout.blob(32,property)
}

// layout for u64 or i64

const ui64 = (property : string) => {
    return BufferLayout.blob(8,property)
}

// layout for asset space

const asset_arr = (property : string) =>{
    return BufferLayout.blob(8*Asset_Space,property)
}

export const GameAcc_Data_Layout = BufferLayout.struct([
    BufferLayout.u8("Account Type"),
    publickey("UserSpace Owner"),
    asset_arr("Owned"),
    asset_arr("Rented"),
]);

export interface GameAcc_Layout{
    acc_type : number,
    userspace_owner : Uint8Array,
    owned : Uint8Array, 
    rented : Uint8Array,
}

export const EscrowAcc_Data_Layout = BufferLayout.struct([
    BufferLayout.u8("Account Type"),
    BufferLayout.u8("Is Taken?"),
    publickey("Initialsier Main Acc"),
    publickey("Initialsier Game Acc"),
    publickey("Taker Game Acc"),
    ui64("Unix TimeStamp"),
    ui64("Amount"),
    ui64("Time"),
    ui64("Asset ID"),
]);

export interface EscrowAcc_Layout{
    acc_type : number,
    is_taken : number,
    initialiser_main_acc : Uint8Array,
    initialiser_game_acc : Uint8Array,
    taker_game_acc : Uint8Array,
    unix_timestamp : Uint8Array,
    amount : Uint8Array,
    time : Uint8Array,
    asset_id : Uint8Array,
}

