import { Keypair, Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { EscrowAcc_Data_Layout, EscrowAcc_Layout,GameAcc_Data_Layout,GameAcc_Layout,Asset_Space, program_id} from "./layout";

const connection = new Connection("https://api.devnet.solana.com", 'singleGossip');

export const revert = async(
    escrow_acc : string,
) =>{
    const escrow_acc_key = new PublicKey(escrow_acc);

    const encodedEscrowState = (await connection.getAccountInfo(escrow_acc_key, 'singleGossip'))!.data;
    const decodedEscrowState = EscrowAcc_Data_Layout.decode(encodedEscrowState) as EscrowAcc_Layout;

    const initialiser_main_acc_key = new PublicKey(decodedEscrowState.initialiser_main_acc);
    const initialiser_game_acc_key = new PublicKey(decodedEscrowState.initialiser_game_acc);
    const taker_game_acc_key = new PublicKey(decodedEscrowState.taker_game_acc);

    const revertIX = new TransactionInstruction({
        programId : program_id,
        keys : [
            {pubkey: initialiser_main_acc_key, isSigner: false, isWritable:true},
            {pubkey: escrow_acc_key, isSigner: false, isWritable:true},
            {pubkey: initialiser_game_acc_key, isSigner: false, isWritable:true},
            {pubkey: taker_game_acc_key, isSigner: false, isWritable:true},
        ],
        data : Buffer.from(Uint8Array.of(2))
    })

    const tx = new Transaction().add(revertIX);

    await connection.sendTransaction(tx,[],{skipPreflight: false, preflightCommitment: 'singleGossip'});

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const encodediGameAccState = (await connection.getAccountInfo(initialiser_game_acc_key, 'singleGossip'))!.data;
    const decodediGameAccState = GameAcc_Data_Layout.decode(encodediGameAccState) as GameAcc_Layout;

    const encodedtGameAccState = (await connection.getAccountInfo(taker_game_acc_key, 'singleGossip'))!.data;
    const decodedtGameAccState = GameAcc_Data_Layout.decode(encodedtGameAccState) as GameAcc_Layout;

    var initialiser_asset = [];
    var initialiser_rented_asset = [];

    var taker_asset = [];
    var taker_rented_asset = [];


    for(var i=0; i < Asset_Space;i++){
        initialiser_rented_asset[i] = new BN(decodediGameAccState.rented.slice(i*8,(i+1)*8)).toNumber();
        initialiser_asset[i] = new BN(decodediGameAccState.owned.slice(i*8,(i+1)*8)).toNumber();
        taker_rented_asset[i] = new BN(decodedtGameAccState.rented.slice(i*8,(i+1)*8)).toNumber();
        taker_asset[i] = new BN(decodedtGameAccState.owned.slice(i*8,(i+1)*8)).toNumber();
    }

    return{
        initialiser_asset : initialiser_asset.toString(),
        initialiser_rented_asset : initialiser_rented_asset.toString(),
        taker_asset : taker_asset.toString(),
        taker_rented_asset : taker_rented_asset.toString()
    };

}
