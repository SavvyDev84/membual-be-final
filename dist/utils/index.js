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
exports.getTxHexById = exports.calculateTxFee = exports.getFeeRate = exports.getBtcUtxoByAddress = exports.getInscriptionWithUtxo = void 0;
const axios_1 = __importDefault(require("axios"));
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const config_1 = require("../config/config");
const config_2 = require("../config/config");
// Get Inscription UTXO
const getInscriptionWithUtxo = async (inscriptionId) => {
    try {
        const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/inscription/info/${inscriptionId}`;
        const config = {
            headers: {
                Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
            },
        };
        const res = await axios_1.default.get(url, config);
        if (res.data.code === -1)
            throw "Invalid inscription id";
        return {
            address: res.data.data.address,
            contentType: res.data.data.contentType,
            inscriptionId: inscriptionId,
            inscriptionNumber: res.data.data.inscriptionNumber,
            txid: res.data.data.utxo.txid,
            value: res.data.data.utxo.satoshi,
            vout: res.data.data.utxo.vout,
            scriptpubkey: res.data.data.utxo.scriptPk,
        };
    }
    catch (error) {
        console.log(`Ordinal api is not working now, please try again later Or invalid inscription id ${inscriptionId}`);
        throw "Invalid inscription id";
    }
};
exports.getInscriptionWithUtxo = getInscriptionWithUtxo;
// Get BTC UTXO
const getBtcUtxoByAddress = async (address) => {
    const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/utxo-data`;
    const config = {
        headers: {
            Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN}`,
        },
    };
    let cursor = 0;
    const size = 5000;
    const utxos = [];
    // while (1) {
    const res = await axios_1.default.get(url, Object.assign(Object.assign({}, config), { params: { cursor, size } }));
    if (res.data.code === -1)
        throw "Invalid Address";
    utxos.push(...res.data.data.utxo.map((utxo) => {
        return {
            scriptpubkey: utxo.scriptPk,
            txid: utxo.txid,
            value: utxo.satoshi,
            vout: utxo.vout,
        };
    }));
    // cursor += res.data.data.utxo.length;
    // if (cursor === res.data.data.total) break;
    // }
    return utxos;
};
exports.getBtcUtxoByAddress = getBtcUtxoByAddress;
// Get Current Network Fee
const getFeeRate = async () => {
    try {
        const url = `https://mempool.space/${config_2.TEST_MODE ? "testnet/" : ""}api/v1/fees/recommended`;
        const res = await axios_1.default.get(url);
        return res.data.fastestFee;
    }
    catch (error) {
        console.log("Ordinal api is not working now. Try again later");
        return -1;
    }
};
exports.getFeeRate = getFeeRate;
// Calc Tx Fee
const calculateTxFee = (psbt, feeRate) => {
    const tx = new Bitcoin.Transaction();
    for (let i = 0; i < psbt.txInputs.length; i++) {
        const txInput = psbt.txInputs[i];
        tx.addInput(txInput.hash, txInput.index, txInput.sequence);
        tx.setWitness(i, [Buffer.alloc(config_1.SIGNATURE_SIZE)]);
    }
    for (let txOutput of psbt.txOutputs) {
        tx.addOutput(txOutput.script, txOutput.value);
    }
    tx.addOutput(psbt.txOutputs[0].script, psbt.txOutputs[0].value);
    tx.addOutput(psbt.txOutputs[0].script, psbt.txOutputs[0].value);
    return tx.virtualSize() * feeRate;
};
exports.calculateTxFee = calculateTxFee;
const getTxHexById = async (txId) => {
    try {
        const { data } = await axios_1.default.get(`https://mempool.space/${config_2.TEST_MODE ? "testnet/" : ""}api/tx/${txId}/hex`);
        return data;
    }
    catch (error) {
        console.log("Mempool api error. Can not get transaction hex");
        throw "Mempool api is not working now. Try again later";
    }
};
exports.getTxHexById = getTxHexById;
