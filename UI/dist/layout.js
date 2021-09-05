"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowAcc_Data_Layout = exports.GameAcc_Data_Layout = exports.program_id = exports.Asset_Space = void 0;
var web3_js_1 = require("@solana/web3.js");
var BufferLayout = __importStar(require("buffer-layout"));
exports.Asset_Space = 20;
exports.program_id = new web3_js_1.PublicKey('GA1ca3KjdsHeXGoikYcd3zn8gKHb1q3WVmSjSXG6Bu2e'); // write program_id here as public key object
// layout for public-key
var publickey = function (property) {
    return BufferLayout.blob(32, property);
};
// layout for u64 or i64
var ui64 = function (property) {
    return BufferLayout.blob(8, property);
};
// layout for asset space
var asset_arr = function (property) {
    return BufferLayout.blob(8 * exports.Asset_Space, property);
};
exports.GameAcc_Data_Layout = BufferLayout.struct([
    BufferLayout.u8("Account Type"),
    publickey("UserSpace Owner"),
    asset_arr("Owned"),
    asset_arr("Rented"),
]);
exports.EscrowAcc_Data_Layout = BufferLayout.struct([
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
