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
const express_1 = require("express");
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const TxModal_1 = __importDefault(require("../../model/TxModal"));
const psbt_service_1 = require("../../service/psbt.service");
const config_1 = require("../../config/config");
const utils_1 = require("../../utils");
const network = config_1.TEST_MODE
    ? Bitcoin.networks.testnet
    : Bitcoin.networks.bitcoin;
// Create a new instance of the Express Router
const DraftRoute = (0, express_1.Router)();
// @route    GET api/draft/send
// @desc     get tx by paymentAddress
// @access   Public
DraftRoute.post("/send", async (req, res) => {
    try {
        const { draftList, walletType, sellerPaymentAddress, sellerPaymentPubkey, sellerOrdinalPubkey, feeRate } = req.body;
        const psbt = new Bitcoin.Psbt({ network: network });
        const sellerWalletType = walletType;
        let utxoFlag = 0;
        let btcTotalAmount = 0;
        const btcUtxos = await (0, utils_1.getBtcUtxoByAddress)(sellerPaymentAddress);
        let paymentoutput;
        if (sellerWalletType === config_1.WalletTypes.XVERSE) {
            const hexedPaymentPubkey = Buffer.from(sellerPaymentPubkey, "hex");
            const p2wpkh = Bitcoin.payments.p2wpkh({
                pubkey: hexedPaymentPubkey,
                network: network,
            });
            const { address, redeem } = Bitcoin.payments.p2sh({
                redeem: p2wpkh,
                network: network,
            });
            paymentoutput = redeem === null || redeem === void 0 ? void 0 : redeem.output;
        }
        let btcList = {};
        console.log("draftList ==> ");
        for (const draft of draftList) {
            if (draft.type != 'BTC') {
                console.log("BTC type ==> ", draft);
                await (0, psbt_service_1.delay)(300);
                const inscriptionId = draft.inscriptionId;
                const buyerOrdinalAddress = draft.destinationAddress;
                const sellerInscriptionsWithUtxo = await (0, utils_1.getInscriptionWithUtxo)(inscriptionId);
                const sellerScriptpubkey = Buffer.from(sellerInscriptionsWithUtxo.scriptpubkey, "hex");
                // Add Inscription Input
                psbt.addInput({
                    hash: sellerInscriptionsWithUtxo.txid,
                    index: sellerInscriptionsWithUtxo.vout,
                    witnessUtxo: {
                        value: sellerInscriptionsWithUtxo.value,
                        script: sellerScriptpubkey,
                    },
                    tapInternalKey: sellerWalletType === config_1.WalletTypes.XVERSE ||
                        sellerWalletType === config_1.WalletTypes.OKX
                        ? Buffer.from(sellerOrdinalPubkey, "hex")
                        : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
                    sequence: config_1.RBF_INPUT_SEQUENCE
                });
                // Add Inscription Output to buyer's address
                psbt.addOutput({
                    address: buyerOrdinalAddress,
                    value: sellerInscriptionsWithUtxo.value,
                });
            }
            else {
                btcTotalAmount += draft.amountToTransfer;
                console.log("draft.destinationAddress ==> ", draft.destinationAddress);
                const field = draft.destinationAddress;
                if (!btcList[field])
                    btcList[field] = draft.amountToTransfer;
                else
                    btcList[field] += draft.amountToTransfer;
            }
        }
        // btcTotalAmount = parseFloat(btcTotalAmount.toFixed(8));
        // console.log("btcTotalAmount ==> ", btcTotalAmount);
        Object.keys(btcList).map((field) => {
            console.log("field ==> ", field);
            console.log("btcList[field] ==> ", btcList[field]);
            psbt.addOutput({
                address: field,
                value: Math.floor(btcList[field] * (10 ** 8)),
            });
        });
        console.log("utxoFlag ==> ", utxoFlag);
        let amount = 0;
        let fee = 0;
        for (let index in btcUtxos) {
            // if (parseInt(index) > utxoFlag) {
            const utxo = btcUtxos[index];
            fee = (0, utils_1.calculateTxFee)(psbt, feeRate);
            if (amount < fee + btcTotalAmount && utxo.value > 10000) {
                amount += utxo.value;
                if (sellerWalletType === config_1.WalletTypes.UNISAT ||
                    sellerWalletType === config_1.WalletTypes.OKX) {
                    psbt.addInput({
                        hash: utxo.txid,
                        index: utxo.vout,
                        witnessUtxo: {
                            value: utxo.value,
                            script: Buffer.from(utxo.scriptpubkey, "hex"),
                        },
                        tapInternalKey: sellerWalletType === config_1.WalletTypes.OKX
                            ? Buffer.from(sellerOrdinalPubkey, "hex")
                            : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
                        sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                        sequence: config_1.RBF_INPUT_SEQUENCE
                    });
                }
                else if (sellerWalletType === config_1.WalletTypes.XVERSE) {
                    const txHex = await (0, utils_1.getTxHexById)(utxo.txid);
                    psbt.addInput({
                        hash: utxo.txid,
                        index: utxo.vout,
                        redeemScript: paymentoutput,
                        nonWitnessUtxo: Buffer.from(txHex, "hex"),
                        sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                        sequence: config_1.RBF_INPUT_SEQUENCE
                    });
                }
            }
            // }
        }
        if (amount < fee + btcTotalAmount)
            throw "You do not have enough bitcoin in your wallet";
        if (amount > fee + 500)
            psbt.addOutput({
                address: sellerPaymentAddress,
                value: amount - fee,
            });
        console.log("psbt ==> ", psbt);
        return res.status(200).send({
            success: true,
            message: 'Generate PSBT for ordinals sending successfully',
            payload: psbt.toHex()
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/tx/saveTx
// @desc     get tx by paymentAddress
// @access   Public
DraftRoute.post("/draft-exec", async (req, res) => {
    console.log('exec api is calling!!');
    try {
        const { psbt, signedPsbt, walletType, txIdList, feeRate } = req.body;
        console.log("req.body ==> ", req.body);
        let sellerSignPSBT;
        if (walletType === config_1.WalletTypes.XVERSE) {
            sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPsbt);
            sellerSignPSBT = await (0, psbt_service_1.finalizePsbtInput)(sellerSignPSBT.toHex(), [0]);
        }
        else if (walletType === config_1.WalletTypes.LEATHER) {
            sellerSignPSBT = await (0, psbt_service_1.finalizePsbtInput)(signedPsbt, [0]);
        }
        else {
            sellerSignPSBT = signedPsbt;
            console.log("Here ==>", sellerSignPSBT);
        }
        console.log('sellerSignPSBT ==> ', sellerSignPSBT);
        const txID = await (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log(txID);
        txIdList.map(async (id) => {
            const tx = await TxModal_1.default.findByIdAndUpdate(id, {
                isDraft: false,
                feeRate,
                txId: txID
            });
            await (tx === null || tx === void 0 ? void 0 : tx.save());
        });
        return res
            .status(200)
            .json({ success: true, message: txID });
    }
    catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
});
exports.default = DraftRoute;
