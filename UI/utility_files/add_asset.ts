import { Connection, Transaction,PublicKey, TransactionInstruction } from "@solana/web3.js";
import { GameAcc_Data_Layout,GameAcc_Layout,Asset_Space, program_id} from "./layout";
import BN from "bn.js";

const connection = new Connection("https://api.devnet.solana.com", 'singleGossip');

export const add_asset = async(
    game_acc : string,
    asset_id : number,
) =>{
    const game_acc_key = new PublicKey(game_acc);

    const add_assetIX = new TransactionInstruction({
        programId : program_id,
        keys : [
            {pubkey: game_acc_key, isSigner: false, isWritable:true},
        ],
        data : Buffer.from(Uint8Array.of(4,...new BN(asset_id).toArray("le",8)))
    })

    const tx = new Transaction().add(add_assetIX);

    await connection.sendTransaction(tx,[],{skipPreflight: false, preflightCommitment: 'singleGossip'});

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const encodedGameAccState = (await connection.getAccountInfo(game_acc_key, 'singleGossip'))!.data;
    const decodedGameAccState = GameAcc_Data_Layout.decode(encodedGameAccState) as GameAcc_Layout;

    var initialiser_asset = [];

    for(var i=0; i < Asset_Space;i++){
        initialiser_asset[i] = new BN(decodedGameAccState.owned.slice(i*8,(i+1)*8)).toNumber();
    }

    return initialiser_asset.toString();

}
