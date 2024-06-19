import { Request, Response, Router } from "express";
import * as Bitcoin from "bitcoinjs-lib";

import ProfileModel from "../../model/ProfileModal";
import TxModel from "../../model/TxModal";

import { generateSendOrdinalPSBT, generateSendBTCPSBT, finalizePsbtInput, combinePsbt, delay } from "../../service/psbt.service";
import { WalletTypes, OPENAPI_UNISAT_TOKEN2, OPENAPI_UNISAT_URL, TEST_MODE, RBF_INPUT_SEQUENCE } from "../../config/config";
import axios from "axios";
import { calculateTxFee, getBtcUtxoByAddress, getFeeRate, getInscriptionWithUtxo, getTxHexById } from "../../utils";
import { IDraft } from "../../type";

const network = TEST_MODE
    ? Bitcoin.networks.testnet
    : Bitcoin.networks.bitcoin;
// Create a new instance of the Express Router
const DraftRoute = Router();

// @route    GET api/draft/send
// @desc     get tx by paymentAddress
// @access   Public
DraftRoute.post("/send", async (req, res) => {
    try {

        const {
            draftList,
            walletType,
            sellerPaymentAddress,
            sellerPaymentPubkey,
            sellerOrdinalPubkey,
            feeRate
        } = req.body;

        const psbt = new Bitcoin.Psbt({ network: network });

        const sellerWalletType = walletType;
        let utxoFlag = 0;
        let btcTotalAmount = 0;

        const btcUtxos = await getBtcUtxoByAddress(sellerPaymentAddress as string);

        let paymentoutput;

        if (sellerWalletType === WalletTypes.XVERSE) {
            const hexedPaymentPubkey = Buffer.from(sellerPaymentPubkey, "hex");
            const p2wpkh = Bitcoin.payments.p2wpkh({
                pubkey: hexedPaymentPubkey,
                network: network,
            });

            const { address, redeem } = Bitcoin.payments.p2sh({
                redeem: p2wpkh,
                network: network,
            });
            paymentoutput = redeem?.output;
        }

        let btcList: any = {};

        console.log("draftList ==> ");

        for (const draft of draftList) {
            if (draft.type != 'BTC') {
                console.log("BTC type ==> ", draft);
                await delay(300);
                const inscriptionId = draft.inscriptionId;
                const buyerOrdinalAddress = draft.destinationAddress;

                const sellerInscriptionsWithUtxo = await getInscriptionWithUtxo(
                    inscriptionId
                );
                const sellerScriptpubkey = Buffer.from(
                    sellerInscriptionsWithUtxo.scriptpubkey,
                    "hex"
                );

                // Add Inscription Input
                psbt.addInput({
                    hash: sellerInscriptionsWithUtxo.txid,
                    index: sellerInscriptionsWithUtxo.vout,
                    witnessUtxo: {
                        value: sellerInscriptionsWithUtxo.value,
                        script: sellerScriptpubkey,
                    },
                    tapInternalKey:
                        sellerWalletType === WalletTypes.XVERSE ||
                            sellerWalletType === WalletTypes.OKX
                            ? Buffer.from(sellerOrdinalPubkey, "hex")
                            : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
                    sequence: RBF_INPUT_SEQUENCE
                });

                // Add Inscription Output to buyer's address
                psbt.addOutput({
                    address: buyerOrdinalAddress,
                    value: sellerInscriptionsWithUtxo.value,
                });
            } else {
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
        Object.keys(btcList).map((field: string) => {
            console.log("field ==> ", field);
            console.log("btcList[field] ==> ", btcList[field]);
            psbt.addOutput({
                address: field,
                value: Math.floor(btcList[field] * (10 ** 8)),
            })
        })

        console.log("utxoFlag ==> ", utxoFlag);

        let amount = 0;
        let fee = 0;

        for (let index in btcUtxos) {
            // if (parseInt(index) > utxoFlag) {
            const utxo = btcUtxos[index];
            fee = calculateTxFee(psbt, feeRate);

            if (amount < fee + btcTotalAmount && utxo.value > 10000) {
                amount += utxo.value;
                if (
                    sellerWalletType === WalletTypes.UNISAT ||
                    sellerWalletType === WalletTypes.OKX
                ) {
                    psbt.addInput({
                        hash: utxo.txid,
                        index: utxo.vout,
                        witnessUtxo: {
                            value: utxo.value,
                            script: Buffer.from(utxo.scriptpubkey as string, "hex"),
                        },
                        tapInternalKey:
                            sellerWalletType === WalletTypes.OKX
                                ? Buffer.from(sellerOrdinalPubkey, "hex")
                                : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
                        sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                        sequence: RBF_INPUT_SEQUENCE
                    });
                } else if (sellerWalletType === WalletTypes.XVERSE) {
                    const txHex = await getTxHexById(utxo.txid);

                    psbt.addInput({
                        hash: utxo.txid,
                        index: utxo.vout,
                        redeemScript: paymentoutput,
                        nonWitnessUtxo: Buffer.from(txHex, "hex"),
                        sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                        sequence: RBF_INPUT_SEQUENCE
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
        })

    } catch (error: any) {
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
        const {
            psbt,
            signedPsbt,
            walletType,
            txIdList,
            feeRate
        } = req.body;

        console.log("req.body ==> ", req.body);

        let sellerSignPSBT;
        if (walletType === WalletTypes.XVERSE) {
            sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPsbt);
            sellerSignPSBT = await finalizePsbtInput(sellerSignPSBT.toHex(), [0]);
        } else if (walletType === WalletTypes.LEATHER) {
            sellerSignPSBT = await finalizePsbtInput(signedPsbt, [0]);
        } else {
            sellerSignPSBT = signedPsbt;
            console.log("Here ==>", sellerSignPSBT);
        }

        console.log('sellerSignPSBT ==> ', sellerSignPSBT);

        const txID = await combinePsbt(psbt, sellerSignPSBT);
        console.log(txID);

        txIdList.map(async (id: string) => {
            const tx = await TxModel.findByIdAndUpdate(id, {
                isDraft: false,
                feeRate,
                txId: txID
            })
            await tx?.save();
        })

        return res
            .status(200)
            .json({ success: true, message: txID });
    } catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
})

export default DraftRoute;
