import { Keypair, Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { EscrowAcc_Data_Layout, EscrowAcc_Layout,GameAcc_Data_Layout, GameAcc_Layout, program_id, Asset_Space} from "./layout";

const connection = new Connection("https://api.devnet.solana.com", 'singleGossip');

var TextEncoder = require("text-encoding");

export const init_escrow_acc = async(
    privatekey : string,
    game_acc : string,
    amount : number,
    time : number,
    asset_id : number,
) =>{
    const sk_uint8 = new TextEncoder.encode(privatekey); // secret key in [u8] format
    const main_keypair = Keypair.fromSecretKey(sk_uint8);

    const escrow_acc_keypair = new Keypair();

    const game_acc_key = new PublicKey(game_acc);  //public key of game acc

    // create a new escrow account and program as the owner

    const createIx = SystemProgram.createAccount({
        programId : program_id,
        fromPubkey : main_keypair.publicKey,
        newAccountPubkey : escrow_acc_keypair.publicKey,
        space : EscrowAcc_Data_Layout.span,
        lamports : await connection.getMinimumBalanceForRentExemption(EscrowAcc_Data_Layout.span, 'singleGossip') + amount,
    });

    const initialiseIx = new TransactionInstruction({
        programId : program_id,
        keys : [
            {pubkey : escrow_acc_keypair.publicKey, isSigner : false, isWritable : true},
            {pubkey : game_acc_key, isSigner : false, isWritable : false},
            {pubkey : main_keypair.publicKey, isSigner : false, isWritable : false},
        ],
        data : Buffer.from(Uint8Array.of(0,...new BN(amount).toArray("le",8),...new BN(time).toArray("le",8),...new BN(asset_id).toArray("le",8)))
    })

    const tx = new Transaction().add(createIx,initialiseIx);

    await connection.sendTransaction(tx, [main_keypair,escrow_acc_keypair], {skipPreflight: false, preflightCommitment: 'singleGossip'});

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const encodedEscrowState = (await connection.getAccountInfo(escrow_acc_keypair.publicKey, 'singleGossip'))!.data;
    const decodedEscrowState = EscrowAcc_Data_Layout.decode(encodedEscrowState) as EscrowAcc_Layout;

    const encodedGameAccState = (await connection.getAccountInfo(game_acc_key, 'singleGossip'))!.data;
    const decodedGameAccState = GameAcc_Data_Layout.decode(encodedGameAccState) as GameAcc_Layout;

    var initialiser_rented_asset = [];
    var initialiser_asset = [];

    for(var i=0; i < Asset_Space;i++){
        initialiser_rented_asset[i] = new BN(decodedGameAccState.rented.slice(i*8,(i+1)*8)).toNumber();
        initialiser_asset[i] = new BN(decodedGameAccState.owned.slice(i*8,(i+1)*8)).toNumber();
    }

    return {
        escrow_acc_pubkey : escrow_acc_keypair.publicKey.toBase58(),
        is_taken : decodedEscrowState.is_taken === 1? 'Taken' : 'Not Taken',
        amount : new BN(decodedEscrowState.amount,10,"le").toNumber(),
        time : new BN(decodedEscrowState.time,10,"le").toNumber(),
        asset_id : new BN(decodedEscrowState.asset_id,10,"le").toNumber(),
        initialiser_asset: initialiser_asset.toString(),
        initialiser_rented_asset : initialiser_rented_asset.toString()
    };
}