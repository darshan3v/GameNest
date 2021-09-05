import { Keypair, Connection, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { GameAcc_Data_Layout, program_id} from "./layout";

const connection = new Connection("https://api.devnet.solana.com", 'singleGossip');

var TextEncoder = require("text-encoding");

export const init_game_acc = async(
    privatekey : string,
) =>{
    const sk_uint8 = new TextEncoder.encode(privatekey); // secret key in [u8] format
    const main_keypair = Keypair.fromSecretKey(sk_uint8);

    const game_acc_keypair = new Keypair();

    // create a game account and program as the owner

    const createIx = SystemProgram.createAccount({
        programId : program_id,
        fromPubkey : main_keypair.publicKey,
        newAccountPubkey : game_acc_keypair.publicKey,
        space : GameAcc_Data_Layout.span,
        lamports : await connection.getMinimumBalanceForRentExemption(GameAcc_Data_Layout.span, 'singleGossip'),
    });

    // initialise game account 

    const initialiseIx = new TransactionInstruction({
        programId : program_id,
        keys : [
            {pubkey : game_acc_keypair.publicKey, isSigner : false, isWritable : true},
            {pubkey : main_keypair.publicKey, isSigner : false, isWritable : false},
        ],
        data : Buffer.from(Uint8Array.of(3))
    })

    const tx = new Transaction().add(createIx,initialiseIx);

    await connection.sendTransaction(tx, [main_keypair,game_acc_keypair], {skipPreflight: false, preflightCommitment: 'singleGossip'});

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return game_acc_keypair.publicKey.toBase58();
}