"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init_escrow_acc = void 0;
var web3_js_1 = require("@solana/web3.js");
var bn_js_1 = __importDefault(require("bn.js"));
var layout_1 = require("./layout");
var connection = new web3_js_1.Connection("https://api.devnet.solana.com", 'singleGossip');
var TextEncoder = require("text-encoding");
var init_escrow_acc = function (privatekey, game_acc, amount, time, asset_id) { return __awaiter(void 0, void 0, void 0, function () {
    var sk_uint8, main_keypair, escrow_acc_keypair, game_acc_key, createIx, _a, _b, initialiseIx, tx, encodedEscrowState, decodedEscrowState, encodedGameAccState, decodedGameAccState, initialiser_rented_asset, initialiser_asset, i;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                sk_uint8 = new TextEncoder.encode(privatekey);
                main_keypair = web3_js_1.Keypair.fromSecretKey(sk_uint8);
                escrow_acc_keypair = new web3_js_1.Keypair();
                game_acc_key = new web3_js_1.PublicKey(game_acc);
                _b = (_a = web3_js_1.SystemProgram).createAccount;
                _c = {
                    programId: layout_1.program_id,
                    fromPubkey: main_keypair.publicKey,
                    newAccountPubkey: escrow_acc_keypair.publicKey,
                    space: layout_1.EscrowAcc_Data_Layout.span
                };
                return [4 /*yield*/, connection.getMinimumBalanceForRentExemption(layout_1.EscrowAcc_Data_Layout.span, 'singleGossip')];
            case 1:
                createIx = _b.apply(_a, [(_c.lamports = (_d.sent()) + amount,
                        _c)]);
                initialiseIx = new web3_js_1.TransactionInstruction({
                    programId: layout_1.program_id,
                    keys: [
                        { pubkey: escrow_acc_keypair.publicKey, isSigner: false, isWritable: true },
                        { pubkey: game_acc_key, isSigner: false, isWritable: false },
                        { pubkey: main_keypair.publicKey, isSigner: false, isWritable: false },
                    ],
                    data: Buffer.from(Uint8Array.of.apply(Uint8Array, __spreadArray(__spreadArray(__spreadArray([0], new bn_js_1.default(amount).toArray("le", 8), false), new bn_js_1.default(time).toArray("le", 8), false), new bn_js_1.default(asset_id).toArray("le", 8), false)))
                });
                tx = new web3_js_1.Transaction().add(createIx, initialiseIx);
                return [4 /*yield*/, connection.sendTransaction(tx, [main_keypair, escrow_acc_keypair], { skipPreflight: false, preflightCommitment: 'singleGossip' })];
            case 2:
                _d.sent();
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
            case 3:
                _d.sent();
                return [4 /*yield*/, connection.getAccountInfo(escrow_acc_keypair.publicKey, 'singleGossip')];
            case 4:
                encodedEscrowState = (_d.sent()).data;
                decodedEscrowState = layout_1.EscrowAcc_Data_Layout.decode(encodedEscrowState);
                return [4 /*yield*/, connection.getAccountInfo(game_acc_key, 'singleGossip')];
            case 5:
                encodedGameAccState = (_d.sent()).data;
                decodedGameAccState = layout_1.GameAcc_Data_Layout.decode(encodedGameAccState);
                initialiser_rented_asset = [];
                initialiser_asset = [];
                for (i = 0; i < layout_1.Asset_Space; i++) {
                    initialiser_rented_asset[i] = new bn_js_1.default(decodedGameAccState.rented.slice(i * 8, (i + 1) * 8)).toNumber();
                    initialiser_asset[i] = new bn_js_1.default(decodedGameAccState.owned.slice(i * 8, (i + 1) * 8)).toNumber();
                }
                return [2 /*return*/, {
                        escrow_acc_pubkey: escrow_acc_keypair.publicKey.toBase58(),
                        is_taken: decodedEscrowState.is_taken === 1 ? 'Taken' : 'Not Taken',
                        amount: new bn_js_1.default(decodedEscrowState.amount, 10, "le").toNumber(),
                        time: new bn_js_1.default(decodedEscrowState.time, 10, "le").toNumber(),
                        asset_id: new bn_js_1.default(decodedEscrowState.asset_id, 10, "le").toNumber(),
                        initialiser_asset: initialiser_asset.toString(),
                        initialiser_rented_asset: initialiser_rented_asset.toString()
                    }];
        }
    });
}); };
exports.init_escrow_acc = init_escrow_acc;
