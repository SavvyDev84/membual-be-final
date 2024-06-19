"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInscription = void 0;
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const randomstring_1 = __importDefault(require("randomstring"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_fetch_2 = require("node-fetch");
const ord_utils_1 = require("@unisat/ord-utils");
const localWallet_1 = require("./localWallet");
const config_1 = require("../config/config");
const psbt_service_1 = require("./psbt.service");
const key = process.env.ADMIN_PRIVATE_KEY;
if (typeof key !== "string" || key === "") {
    throw new Error("Environment variable PRIVATE_KEY must be set and be a valid string.");
}
const network = config_1.TEST_MODE
    ? Bitcoin.networks.testnet
    : Bitcoin.networks.bitcoin;
const wallet = new localWallet_1.LocalWallet(key, config_1.TEST_MODE ? 1 : 0);
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
async function httpGet(route, params) {
    let url = config_1.OPENAPI_URL + route;
    let c = 0;
    for (const id in params) {
        if (c == 0) {
            url += "?";
        }
        else {
            url += "&";
        }
        url += `${id}=${params[id]}`;
        c++;
    }
    const res = await (0, node_fetch_1.default)(new node_fetch_2.Request(url), {
        method: "GET",
        headers: {
            "X-Client": "UniSat Wallet",
            "x-address": wallet.address,
            "x-udid": randomstring_1.default.generate(12),
        },
    });
    const data = await res.json();
    return data;
}
async function getInscriptionUtxo(inscriptionId) {
    await delay(10000);
    try {
        const data = await httpGet("/inscription/utxo", {
            inscriptionId,
        });
        if (data.status == "0") {
            console.log("Can not get Utxo ", data.message);
            return getInscriptionUtxo(inscriptionId);
        }
        return data.result;
    }
    catch (error) {
        console.log(error);
        throw new Error(error);
    }
}
async function getAddressUtxo(address) {
    await delay(10000);
    try {
        const data = await httpGet("/address/btc-utxo", {
            address,
        });
        if (data.status == "0") {
            console.log("Can not get Utxo ", data.message);
            return getAddressUtxo(address);
        }
        return data.result;
    }
    catch (error) {
        console.log(error);
        throw new Error(error);
    }
}
async function sendInscription(targetAddress, inscriptionId, feeRate, oridnalSize) {
    try {
        const utxo = await getInscriptionUtxo(inscriptionId);
        if (!utxo) {
            throw new Error("UTXO not found.");
        }
        if (utxo.inscriptions.length > 1) {
            throw new Error("Multiple inscriptions are mixed together. Please split them first.");
        }
        const btc_utxos = await getAddressUtxo(wallet.address);
        const utxos = [utxo].concat(btc_utxos);
        const inputUtxos = utxos.map((v) => {
            return {
                txId: v.txId,
                outputIndex: v.outputIndex,
                satoshis: v.satoshis,
                scriptPk: v.scriptPk,
                addressType: v.addressType,
                address: wallet.address,
                ords: v.inscriptions,
            };
        });
        const psbt = await (0, ord_utils_1.createSendOrd)({
            utxos: inputUtxos,
            toAddress: targetAddress,
            toOrdId: inscriptionId,
            wallet: wallet,
            network: network,
            changeAddress: wallet.address,
            pubkey: wallet.pubkey,
            feeRate,
            outputValue: oridnalSize,
            enableRBF: false,
        });
        psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
        const rawTx = psbt.extractTransaction().toHex();
        const txId = await (0, psbt_service_1.pushRawTx)(rawTx);
        return txId;
    }
    catch (error) {
        console.log(error);
        throw new Error(error);
    }
}
exports.sendInscription = sendInscription;
