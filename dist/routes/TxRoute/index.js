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
const axios_1 = __importDefault(require("axios"));
// Create a new instance of the Express Router
const TxRoute = (0, express_1.Router)();
// @route    GET api/tx/getAll
// @desc     get tx by paymentAddress
// @access   Public
TxRoute.get("/getAll", async (req, res) => {
    try {
        const payload = await TxModal_1.default.find();
        console.log('paymentAddress ==> ', payload);
        if (!payload) {
            return res.status(500).send({
                success: false,
                message: "No Profile exist"
            });
        }
        return res.status(200).send({
            success: true,
            message: "Loading All Profile successfully.",
            payload: payload
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    GET api/tx/getById
// @desc     get tx by paymentAddress
// @access   Public
TxRoute.get("/getById", async (req, res) => {
    try {
        const { id } = req.query;
        console.log('id ==> ', id);
        if (!id)
            return res.status(400).send({
                success: false,
                message: 'There is no transaction of this id here',
            });
        const payload = await TxModal_1.default.findById(id);
        if (!payload) {
            return res.status(500).send({
                success: false,
                message: "No transaction exist"
            });
        }
        return res.status(200).send({
            success: true,
            message: "Loading All Transaction successfully.",
            payload: payload
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
TxRoute.post("/saveTx", async (req, res) => {
    try {
        const { profileId, paymentAddress, paymentPubkey, ordinalsAddress, ordinalsPubkey, walletType, destinationAddress, type, amountToTransfer, inscriptionId, isDraft, feeRate, } = req.body;
        let error = '';
        if (!profileId)
            error += 'username, ';
        if (!paymentAddress)
            error += 'paymentAddress, ';
        if (!paymentPubkey)
            error += 'paymentPubkey, ';
        if (!ordinalsAddress)
            error += 'ordinalsAddress, ';
        if (!ordinalsPubkey)
            error += 'ordinalsPubkey, ';
        if (!walletType)
            error += 'walletType, ';
        if (!type)
            error += 'type, ';
        if (!amountToTransfer && type == "BTC")
            error += 'amountToTransfer, ';
        if (!inscriptionId && type == "Ordinals")
            error += 'inscriptionId, ';
        // if (!isDraft) error += 'isDraft, ';
        if (!feeRate && !isDraft)
            error += 'feeRate ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        console.log("req.body ==> ", req.body);
        // const payload = await TxModel.find();
        if (isDraft == true) {
            const newTx = new TxModal_1.default({
                profileId,
                paymentAddress,
                destinationAddress,
                type,
                amountToTransfer,
                inscriptionId,
                isDraft,
                feeRate,
                txId: ''
            });
            await newTx.save();
            res.status(200).send({
                success: true,
                message: 'Transaction is saved successfully.',
                payload: newTx
            });
        }
        else {
            if (type == 'BTC') {
                console.log("BTC api is called ==> ");
                const { psbt } = await (0, psbt_service_1.generateSendBTCPSBT)(walletType, paymentPubkey, ordinalsAddress, ordinalsPubkey, destinationAddress, amountToTransfer, feeRate);
                console.log('BTC type ==> ', psbt);
                return res.status(200).send({
                    success: true,
                    message: 'Generate PSBT for btc sending successfully',
                    payload: psbt
                });
            }
            else {
                console.log("Ordinals transaction ==> ");
                const { psbt, buyerPaymentsignIndexes } = await (0, psbt_service_1.generateSendOrdinalPSBT)(walletType, inscriptionId, destinationAddress, paymentAddress, paymentPubkey, ordinalsPubkey);
                console.log('Ordinals type ==> ', psbt);
                return res.status(200).send({
                    success: true,
                    message: 'Generate PSBT for ordinals sending successfully',
                    payload: psbt.toHex()
                });
            }
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/tx/saveTx
// @desc     get tx by paymentAddress
// @access   Public
TxRoute.post("/exec", async (req, res) => {
    console.log('exec api is calling!!');
    try {
        const { psbt, signedPSBT, walletType, profileId, paymentAddress, paymentPubkey, ordinalsAddress, ordinalsPubkey, destinationAddress, type, amountToTransfer, inscriptionId, isDraft, feeRate, } = req.body;
        let error = '';
        if (!psbt)
            error += 'psbt, ';
        if (!signedPSBT)
            error += 'signedPSBT, ';
        if (!profileId)
            error += 'profileId, ';
        if (!paymentAddress)
            error += 'paymentAddress, ';
        if (!paymentPubkey)
            error += 'paymentPubkey, ';
        if (!ordinalsAddress)
            error += 'ordinalsAddress, ';
        if (!ordinalsPubkey)
            error += 'ordinalsPubkey, ';
        if (!walletType)
            error += 'walletType, ';
        if (!type)
            error += 'type, ';
        if (!amountToTransfer && type == "BTC")
            error += 'amountToTransfer, ';
        if (!inscriptionId && type == "Ordinals")
            error += 'inscriptionId, ';
        // if (!isDraft) error += 'isDraft, ';
        if (!feeRate && !isDraft)
            error += 'feeRate ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        let sellerSignPSBT;
        if (walletType === config_1.WalletTypes.XVERSE) {
            sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPSBT);
            sellerSignPSBT = await (0, psbt_service_1.finalizePsbtInput)(sellerSignPSBT.toHex(), [0]);
        }
        else if (walletType === config_1.WalletTypes.LEATHER) {
            sellerSignPSBT = await (0, psbt_service_1.finalizePsbtInput)(signedPSBT, [0]);
        }
        else {
            sellerSignPSBT = signedPSBT;
        }
        console.log('sellerSignPSBT ==> ', sellerSignPSBT);
        const txID = await (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log(txID);
        const newTx = new TxModal_1.default({
            profileId,
            paymentAddress,
            destinationAddress,
            type,
            amountToTransfer,
            inscriptionId,
            isDraft,
            feeRate,
            txId: txID
        });
        await newTx.save();
        return res
            .status(200)
            .json({ success: true, msg: txID });
    }
    catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
});
// @route    POST api/tx/rbf
// @desc     Implement RBF
// @access   Public
TxRoute.post("/rbf", async (req, res) => {
    try {
        const { txId, type, newFeeRate } = req.body;
        let error = '';
        if (!txId)
            error += 'txId, ';
        if (!type)
            error += 'type, ';
        if (!newFeeRate)
            error += 'newFeeRate, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        console.log('req.body ==> ', req.body);
        // const { psbt, buyerPaymentsignIndexes } = await generateRBF_OrdinalPSBT(
        //   txId,
        //   type,
        //   newFeeRate
        // );
        const { psbt, buyerPaymentsignIndexes } = await (0, psbt_service_1.generateRBF_PSBT)(txId, type, newFeeRate);
        return res.status(200).send({
            success: true,
            psbtHex: psbt.toHex(),
            psbtBase64: psbt.toBase64(),
            buyerPaymentsignIndexes,
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
TxRoute.post("/rbf-exec", async (req, res) => {
    console.log('exec api is calling!!');
    try {
        const { psbt, signedPSBT, walletType, txId, feeRate, } = req.body;
        let error = '';
        if (!psbt)
            error += 'psbt, ';
        if (!signedPSBT)
            error += 'signedPSBT, ';
        if (!txId)
            error += 'txId, ';
        if (!walletType)
            error += 'walletType, ';
        if (!feeRate)
            error += 'feeRate, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        let sellerSignPSBT;
        if (walletType === config_1.WalletTypes.XVERSE) {
            sellerSignPSBT = Bitcoin.Psbt.fromBase64(signedPSBT);
            sellerSignPSBT = await (0, psbt_service_1.finalizePsbtInput)(sellerSignPSBT.toHex(), [0]);
        }
        else if (walletType === config_1.WalletTypes.LEATHER) {
            sellerSignPSBT = await (0, psbt_service_1.finalizePsbtInput)(signedPSBT, [0]);
        }
        else {
            sellerSignPSBT = signedPSBT;
        }
        console.log('sellerSignPSBT ==> ', sellerSignPSBT);
        const newtxID = await (0, psbt_service_1.combinePsbt)(psbt, sellerSignPSBT);
        console.log("newtxID ==> ", newtxID);
        const tx = await TxModal_1.default.findById(txId);
        if (!tx) {
            return res.status(500).send({
                success: false,
                msg: "There is no transaction"
            });
        }
        tx.txId = newtxID;
        tx.feeRate = feeRate;
        await tx.save();
        return res
            .status(200)
            .json({ success: true, msg: newtxID });
    }
    catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
});
// @route    POST api/tx/overwriteTx
// @desc     overwiteTx
// @access   Public
TxRoute.post("/overwriteTx", async (req, res) => {
    console.log('exec api is calling!!');
    try {
        const { previousId, destinationAddress, isdraft, paymentAddress, paymentPubkey, ordinalsAddress, ordinalsPubkey, walletType, type, amountToTransfer, inscriptionId, isDraft, feeRate, } = req.body;
        let error = '';
        if (!previousId)
            error += 'previousId, ';
        if (!paymentAddress)
            error += 'paymentAddress, ';
        if (!paymentPubkey)
            error += 'paymentPubkey, ';
        if (!ordinalsAddress)
            error += 'ordinalsAddress, ';
        if (!ordinalsPubkey)
            error += 'ordinalsPubkey, ';
        if (!walletType)
            error += 'walletType, ';
        if (!type)
            error += 'type, ';
        if (!amountToTransfer && type == "BTC")
            error += 'amountToTransfer, ';
        if (!inscriptionId && type == "Ordinals")
            error += 'inscriptionId, ';
        // if (!isDraft) error += 'isDraft, ';
        if (!feeRate && !isDraft)
            error += 'feeRate ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        console.log('Overwrite API is working well!!');
        if (isdraft) {
            const updateTx = await TxModal_1.default.findByIdAndUpdate(previousId, {
                destinationAddress
            });
            console.log('updateTx ==> ', updateTx);
            if (!updateTx) {
                return res.send(400).send({
                    success: false,
                    message: 'inscription replaced successfully',
                    payload: null
                });
            }
            await updateTx.save();
            return res
                .status(200)
                .json({ success: true, message: 'Inscription is saved successfully!!', payload: updateTx });
        }
        else {
            console.log("previousId ==> ", previousId);
            const removeTx = await TxModal_1.default.findById(previousId);
            if (!removeTx) {
                return res.send(400).send({
                    success: false,
                    message: 'inscription replaced successfully',
                    payload: null
                });
            }
            await removeTx.deleteOne();
            // await removeTx.save();
            const { psbt, buyerPaymentsignIndexes } = await (0, psbt_service_1.generateSendOrdinalPSBT)(walletType, inscriptionId, destinationAddress, paymentAddress, paymentPubkey, ordinalsPubkey);
            console.log('Ordinals type ==> ', psbt);
            return res.status(200).send({
                success: true,
                message: 'Generate PSBT for ordinals sending successfully',
                payload: psbt.toHex()
            });
        }
    }
    catch (error) {
        console.log("Buy Ticket and Combine PSBT Error : ", error);
        return res.status(500).json({ success: false });
    }
});
// @route    GET api/tx/checkInscRepeat
// @desc     get profile by profileId and paymentAddress
// @access   Public
TxRoute.get("/checkInscRepeat", async (req, res) => {
    try {
        const { profileId, paymentAddress, inscriptionId } = req.query;
        let error = '';
        if (!profileId)
            error += 'profileId, ';
        if (!paymentAddress)
            error += 'paymentAddress, ';
        if (!inscriptionId)
            error += 'inscriptionId, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        console.log(" req.query ==> ", req.query);
        const txList = await TxModal_1.default.findOne({
            profileId,
            paymentAddress,
            isDraft: true,
            inscriptionId
        });
        if (!txList)
            return res.status(200).send({
                success: false,
                message: 'This inscription is new',
                payload: null
            });
        return res.status(200).send({
            success: true,
            message: 'This inscription already stored in draft transaction',
            payload: txList
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    GET api/tx/getDraftTx
// @desc     get profile by profileId and paymentAddress
// @access   Public
TxRoute.get("/getDraftTx", async (req, res) => {
    const { profileId } = req.query;
    let error = '';
    if (!profileId)
        error += 'profileId ';
    if (error)
        return res.status(400).send({
            success: false,
            message: error + 'is required'
        });
    const draftPayload = await TxModal_1.default.find({
        profileId,
        isDraft: true
    });
    // console.log("draftPayload ==> ", draftPayload);
    if (!draftPayload.length) {
        return res.status(200).send({
            success: false,
            message: 'There is no transaction of this profile',
            payload: []
        });
    }
    return res.status(200).send({
        success: true,
        message: 'fetch tx successfully',
        payload: draftPayload
    });
});
// @route    GET api/tx/getProcessTx
// @desc     get profile by profileId and paymentAddress
// @access   Public
TxRoute.get("/getProcessTx", async (req, res) => {
    const { profileId } = req.query;
    let error = '';
    if (!profileId)
        error += 'profileId ';
    if (error)
        return res.status(400).send({
            success: false,
            message: error + 'is required'
        });
    const draftPayload = await TxModal_1.default.find({
        profileId,
        isDraft: false,
        status: false
    });
    // console.log("draftPayload ==> ", draftPayload);
    if (!draftPayload.length) {
        return res.status(200).send({
            success: false,
            message: 'There is no transaction of this profile',
            payload: []
        });
    }
    return res.status(200).send({
        success: true,
        message: 'fetch tx successfully',
        payload: draftPayload
    });
});
// @route    GET api/tx/txDetails
// @desc     get profile by profileId and paymentAddress
// @access   Public
TxRoute.get("/txDetails", async (req, res) => {
    const { txId } = req.query;
    console.log("txId ==> ", txId);
    let error = '';
    if (!txId)
        error += 'txId, ';
    if (error)
        return res.status(400).send({
            success: false,
            message: error + 'is required'
        });
    const payload = await axios_1.default.get(`${config_1.MEMPOOL_API}/tx/${txId}`);
    const main = payload.data;
    // console.log("main ==> ", main);
    const resultOfFeature = {
        segwit: false,
        taproot: false,
        rbf: false,
        firstSeen: 0,
        fee: 0,
        feeRate: 0,
        btcPricePayload: 0,
        txDetails: main
    };
    resultOfFeature.segwit = main.vin[0].witness ? true : false;
    console.log("main.vin[0].prevout.scriptpubkey_asm ==> ", typeof main.vin[0].prevout.scriptpubkey_asm);
    resultOfFeature.taproot = await (main.vin[0].prevout.scriptpubkey_asm).search("OP_PUSHBYTES_32") ? true : false;
    resultOfFeature.rbf = main.vin[0].sequence <= 4294967293 ? true : false;
    console.log("resultOfFeature ==> ", resultOfFeature);
    const url = `${config_1.MEMPOOL_API}/v1/transaction-times?txId[]=${txId}`;
    const firstTime = (await axios_1.default.get(url)).data[0];
    console.log("firstTime ==> ", firstTime);
    console.log("new Date(firstTime * 1000).getMilliseconds() ==> ", new Date(firstTime * 1000));
    console.log("new Date(firstTime * 1000).getMilliseconds()new Date().getMilliseconds() ==> ", new Date(firstTime * 1000));
    if (firstTime) {
        let timeBetween = new Date() - new Date(firstTime * 1000);
        resultOfFeature.firstSeen = timeBetween / 1000 / 60;
    }
    else {
        resultOfFeature.firstSeen = 0;
    }
    console.log("resultOfFeature", resultOfFeature);
    resultOfFeature.fee = main.fee;
    resultOfFeature.feeRate = main.fee / (main.weight / 4);
    console.log("resultOfFeature", resultOfFeature);
    const btcPriceUrl = `https://mempool.space/api/v1/prices`;
    const recentPrice = await (0, axios_1.default)(btcPriceUrl);
    const btcPricePayload = recentPrice.data.USD;
    resultOfFeature.btcPricePayload = btcPricePayload;
    return res.status(200).send({
        success: true,
        message: "fetch data successfully!!",
        payload: resultOfFeature,
    });
});
// @route    GET api/tx/txDetails
// @desc     get profile by profileId and paymentAddress
// @access   Public
TxRoute.get("/txById", async (req, res) => {
    const { txId } = req.query;
    if (!txId)
        res.status(400).send({
            success: false,
            message: 'TxId is missing',
            payload: null
        });
    const tx = await TxModal_1.default.findOne({
        txId
    });
    console.log("tx ==>", tx);
    return res.status(200).send({
        success: true,
        message: 'Fetching transaction successfully',
        payload: tx
    });
});
exports.default = TxRoute;
