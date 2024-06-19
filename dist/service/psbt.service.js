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
exports.finalizePsbtInput = exports.pushRawTx = exports.combinePsbt = exports.generateRBF_OrdinalPSBT = exports.generateRBF_PSBT = exports.generateSendBTCPSBT = exports.generateSendOrdinalPSBT = exports.delay = void 0;
const Bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("@bitcoinerlab/secp256k1"));
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const config_2 = require("../config/config");
Bitcoin.initEccLib(ecc);
const network = config_1.TEST_MODE
    ? Bitcoin.networks.testnet
    : Bitcoin.networks.bitcoin;
const RBF_INPUT_SEQUENCE = 0xfffffffd;
const RBF_INPUT_SEQUENCE2 = 0xfffffffe;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.delay = delay;
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
// Get BTC UTXO
const getBtcUtxoByAddress = async (address) => {
    await (0, exports.delay)(2000);
    const url = `${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/utxo-data`;
    console.log("getBtcUtxoByAddress ==>", url);
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
    console.log('res result ==> ', res.data);
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
    cursor += res.data.data.utxo.length;
    // if (cursor === res.data.data.total) break;
    // }
    return utxos;
};
// Get Current Network Fee
const getFeeRate = async () => {
    try {
        const url = `https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/v1/fees/recommended`;
        const res = await axios_1.default.get(url);
        return res.data.fastestFee;
    }
    catch (error) {
        console.log("Ordinal api is not working now. Try again later");
        return 40;
    }
};
// Calc Tx Fee
const calculateTxFee = (psbt, feeRate) => {
    console.log("feeRate ==> ", feeRate);
    const tx = new Bitcoin.Transaction();
    for (let i = 0; i < psbt.txInputs.length; i++) {
        const txInput = psbt.txInputs[i];
        tx.addInput(txInput.hash, txInput.index, txInput.sequence);
        tx.setWitness(i, [Buffer.alloc(config_1.SIGNATURE_SIZE)]);
    }
    if (!psbt.txOutputs)
        return Math.floor(tx.virtualSize() * feeRate);
    console.log("There is output ==> ");
    for (let txOutput of psbt.txOutputs) {
        tx.addOutput(txOutput.script, txOutput.value);
    }
    return Math.floor(tx.virtualSize() * feeRate);
};
const getTxHexById = async (txId) => {
    try {
        const { data } = await axios_1.default.get(`https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx/${txId}/hex`);
        return data;
    }
    catch (error) {
        console.log("Mempool api error. Can not get transaction hex");
        throw "Mempool api is not working now. Try again later";
    }
};
// Get Current Network Fee
const getUTXObyId = async (txId) => {
    try {
        // console.log("delay start ==> ");
        await (0, exports.delay)(1000);
        // console.log("delay end ==> ");
        const url = `https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx/${txId}`;
        const res = await axios_1.default.get(url);
        return {
            success: true,
            payload: res.data
        };
    }
    catch (error) {
        console.log("Ordinal api is not working now. Try again later");
        return {
            success: false,
            payload: null
        };
        ;
    }
};
// Generate Send Ordinal PSBT
const generateSendOrdinalPSBT = async (sellerWalletType, inscriptionId, buyerOrdinalAddress, sellerPaymentAddress, sellerPaymentPubkey, sellerOrdinalPubkey) => {
    console.log("inscription id in generateSendOrdinalPSBT", inscriptionId);
    const sellerInscriptionsWithUtxo = await getInscriptionWithUtxo(inscriptionId);
    const sellerScriptpubkey = Buffer.from(sellerInscriptionsWithUtxo.scriptpubkey, "hex");
    const psbt = new Bitcoin.Psbt({ network: network });
    // Add Inscription Input
    psbt.addInput({
        hash: sellerInscriptionsWithUtxo.txid,
        index: sellerInscriptionsWithUtxo.vout,
        witnessUtxo: {
            value: sellerInscriptionsWithUtxo.value,
            script: sellerScriptpubkey,
        },
        tapInternalKey: sellerWalletType === config_2.WalletTypes.XVERSE ||
            sellerWalletType === config_2.WalletTypes.OKX
            ? Buffer.from(sellerOrdinalPubkey, "hex")
            : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
        sequence: RBF_INPUT_SEQUENCE
    });
    // Add Inscription Output to buyer's address
    psbt.addOutput({
        address: buyerOrdinalAddress,
        value: sellerInscriptionsWithUtxo.value,
    });
    let paymentAddress, paymentoutput;
    if (sellerWalletType === config_2.WalletTypes.XVERSE) {
        const hexedPaymentPubkey = Buffer.from(sellerPaymentPubkey, "hex");
        const p2wpkh = Bitcoin.payments.p2wpkh({
            pubkey: hexedPaymentPubkey,
            network: network,
        });
        const { address, redeem } = Bitcoin.payments.p2sh({
            redeem: p2wpkh,
            network: network,
        });
        paymentAddress = address;
        paymentoutput = redeem === null || redeem === void 0 ? void 0 : redeem.output;
    }
    else if (sellerWalletType === config_2.WalletTypes.UNISAT ||
        sellerWalletType === config_2.WalletTypes.OKX) {
        paymentAddress = buyerOrdinalAddress;
    }
    const btcUtxos = await getBtcUtxoByAddress(sellerPaymentAddress);
    const feeRate = await getFeeRate();
    let amount = 0;
    const fee = calculateTxFee(psbt, feeRate);
    const buyerPaymentsignIndexes = [];
    for (const utxo of btcUtxos) {
        const fee = calculateTxFee(psbt, feeRate);
        if (amount < fee && utxo.value > 10000) {
            amount += utxo.value;
            buyerPaymentsignIndexes.push(psbt.inputCount);
            if (sellerWalletType === config_2.WalletTypes.UNISAT ||
                sellerWalletType === config_2.WalletTypes.OKX) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        value: utxo.value,
                        script: Buffer.from(utxo.scriptpubkey, "hex"),
                    },
                    tapInternalKey: sellerWalletType === config_2.WalletTypes.OKX
                        ? Buffer.from(sellerOrdinalPubkey, "hex")
                        : Buffer.from(sellerOrdinalPubkey, "hex").slice(1, 33),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                    sequence: RBF_INPUT_SEQUENCE
                });
            }
            else if (sellerWalletType === config_2.WalletTypes.XVERSE) {
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
    }
    if (amount < fee)
        throw "You do not have enough bitcoin in your wallet";
    if (amount > fee + 500)
        psbt.addOutput({
            address: sellerPaymentAddress,
            value: amount - fee,
        });
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
};
exports.generateSendOrdinalPSBT = generateSendOrdinalPSBT;
// Generate Send BTC PSBT
const generateSendBTCPSBT = async (walletType, buyerPaymentPubkey, buyerOrdinalAddress, buyerOrdinalPubkey, sellerPaymentAddress, price, feeRate) => {
    console.log(" walletType ===>  ", walletType);
    console.log(" buyerPaymentPubkey ===>  ", buyerPaymentPubkey);
    console.log(" buyerOrdinalAddress ===>  ", buyerOrdinalAddress);
    console.log(" buyerOrdinalPubkey ===>  ", buyerOrdinalPubkey);
    console.log(" sellerPaymentAddress ===>  ", sellerPaymentAddress);
    console.log(" price ===>  ", price);
    console.log(" feeRate ===>  ", feeRate);
    const psbt = new Bitcoin.Psbt({ network: network });
    // Add Inscription Input
    let paymentAddress, paymentoutput;
    if (walletType === config_2.WalletTypes.XVERSE) {
        const hexedPaymentPubkey = Buffer.from(buyerPaymentPubkey, "hex");
        const p2wpkh = Bitcoin.payments.p2wpkh({
            pubkey: hexedPaymentPubkey,
            network: network,
        });
        const { address, redeem } = Bitcoin.payments.p2sh({
            redeem: p2wpkh,
            network: network,
        });
        paymentAddress = address;
        paymentoutput = redeem === null || redeem === void 0 ? void 0 : redeem.output;
    }
    else if (walletType === config_2.WalletTypes.UNISAT ||
        walletType === config_2.WalletTypes.OKX) {
        paymentAddress = buyerOrdinalAddress;
    }
    else if (walletType === config_2.WalletTypes.LEATHER) {
        const hexedPaymentPubkey = Buffer.from(buyerPaymentPubkey, "hex");
        const { address, output } = Bitcoin.payments.p2wpkh({
            pubkey: hexedPaymentPubkey,
            network: network,
        });
        paymentAddress = address;
    }
    console.log(paymentAddress);
    const btcUtxos = await getBtcUtxoByAddress(paymentAddress);
    let amount = 0;
    let fee = 0;
    const buyerPaymentsignIndexes = [];
    fee = calculateTxFee(psbt, Math.floor(feeRate));
    console.log("empty psbt fee ==> ", fee);
    if (price > 0) {
        psbt.addOutput({
            address: sellerPaymentAddress,
            value: parseInt((((price * (100 - 0)) / 100) * 10 ** 8).toString()),
        });
    }
    fee = calculateTxFee(psbt, Math.floor(feeRate));
    console.log("addOutput 1 psbt fee ==> ", fee);
    let tempIndex = 0;
    for (const utxo of btcUtxos) {
        if (amount < price * (10 ** 8) + fee + 2000 && utxo.value > 10000) {
            tempIndex++;
            amount += utxo.value;
            buyerPaymentsignIndexes.push(psbt.inputCount);
            if (walletType === config_2.WalletTypes.UNISAT || walletType === config_2.WalletTypes.OKX) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        value: utxo.value,
                        script: Buffer.from(utxo.scriptpubkey, "hex"),
                    },
                    tapInternalKey: walletType === config_2.WalletTypes.OKX
                        ? Buffer.from(buyerOrdinalPubkey, "hex")
                        : Buffer.from(buyerOrdinalPubkey, "hex").slice(1, 33),
                    sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                    sequence: RBF_INPUT_SEQUENCE
                });
            }
            else if (walletType === config_2.WalletTypes.LEATHER) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        value: utxo.value,
                        script: Buffer.from(utxo.scriptpubkey, "hex"),
                    },
                    sequence: RBF_INPUT_SEQUENCE
                });
            }
            else if (walletType === config_2.WalletTypes.XVERSE) {
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
            fee = calculateTxFee(psbt, Math.floor(feeRate));
            console.log(`${tempIndex}th input fee in`, fee);
        }
    }
    if (amount < (price * 10 ** 8) + fee)
        throw "You do not have enough bitcoin in your wallet";
    console.log("change ==> ", amount - parseInt((price * 10 ** 8).toString()) - fee);
    psbt.addOutput({
        address: paymentAddress,
        value: amount - parseInt((price * 10 ** 8).toString()) - Math.floor(fee * 1.206),
    });
    fee = calculateTxFee(psbt, Math.floor(feeRate));
    console.log(`final output fee in`, fee);
    console.log(psbt.toBase64());
    return {
        psbt: psbt.toHex(),
        buyerPaymentsignIndexes,
    };
};
exports.generateSendBTCPSBT = generateSendBTCPSBT;
// Generate Send BTC PSBT
const generateRBF_PSBT = async (txId, walletType, feeRate) => {
    const psbt = new Bitcoin.Psbt({ network: network });
    const utxo = [];
    while (1) {
        const tempUtxo = await getUTXObyId(txId);
        console.log("tempUtxo ==> ", tempUtxo);
        if (tempUtxo.success == true) {
            console.log('tempUtxo ==> ', tempUtxo);
            utxo.push(tempUtxo.payload);
            break;
        }
        else
            console.log('Network is not working well, try again to fetch UTXO data');
    }
    console.log('result ==> ', utxo[0]);
    console.log('vin ==> ', utxo[0].vin);
    console.log('vout ==> ', utxo[0].vout);
    const { vin, vout } = utxo[0];
    const buyerPaymentsignIndexes = [];
    const senderAddress = vin[0].prevout.scriptpubkey_address;
    // const totalAmount = vin[0].prevout.value;
    let totalAmount = 0;
    for (const oneUtxo of vin) {
        buyerPaymentsignIndexes.push(psbt.inputCount);
        if (walletType === config_2.WalletTypes.UNISAT || walletType === config_2.WalletTypes.OKX) {
            psbt.addInput({
                hash: oneUtxo.txid,
                index: oneUtxo.vout,
                witnessUtxo: {
                    value: oneUtxo.prevout.value,
                    script: Buffer.from(oneUtxo.prevout.scriptpubkey, "hex"),
                },
                // tapInternalKey:
                //   walletType === WalletTypes.OKX
                //     ? Buffer.from(oneUtxo.prevout.scriptpubkey, "hex")
                //     : Buffer.from(oneUtxo.prevout.scriptpubkey, "hex").slice(1, 33),
                sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                sequence: RBF_INPUT_SEQUENCE2
            });
        }
        // else if (walletType === WalletTypes.LEATHER) {
        //   psbt.addInput({
        //     hash: oneUtxo.txid,
        //     index: oneUtxo.vout,
        //     witnessUtxo: {
        //       value: oneUtxo.value,
        //       script: Buffer.from(oneUtxo.scriptpubkey as string, "hex"),
        //     },
        //     sequence: RBF_INPUT_SEQUENCE
        //   });
        // } else if (walletType === WalletTypes.XVERSE) {
        //   const txHex = await getTxHexById(oneUtxo.txid);
        //   psbt.addInput({
        //     hash: oneUtxo.txid,
        //     index: oneUtxo.vout,
        //     redeemScript: paymentoutput,
        //     nonWitnessUtxo: Buffer.from(txHex, "hex"),
        //     sighashType: Bitcoin.Transaction.SIGHASH_ALL,
        //     sequence: RBF_INPUT_SEQUENCE
        //   });
        // }
    }
    for (const oneUtxo of vout) {
        totalAmount += oneUtxo.value;
        if (oneUtxo.scriptpubkey_address != senderAddress)
            psbt.addOutput({
                address: oneUtxo.scriptpubkey_address,
                value: oneUtxo.value
            });
    }
    const fee = calculateTxFee(psbt, feeRate);
    console.log('fee ==> ', fee);
    console.log('totalAmount ==> ', totalAmount);
    psbt.addOutput({
        address: senderAddress,
        value: totalAmount - fee,
    });
    console.log(psbt.toBase64());
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
};
exports.generateRBF_PSBT = generateRBF_PSBT;
const generateRBF_OrdinalPSBT = async (txId, walletType, newfeeRate) => {
    console.log("newfeeRate ==> ", newfeeRate);
    const psbt = new Bitcoin.Psbt({ network: network });
    const utxo = [];
    while (1) {
        const tempUtxo = await getUTXObyId(txId);
        if (tempUtxo.success == true) {
            // console.log('tempUtxo ==> ', tempUtxo);
            utxo.push(tempUtxo.payload);
            break;
        }
        else
            console.log('Network is not working well, try again to fetch UTXO data');
    }
    // console.log('result ==> ', utxo[0]);
    // console.log('vin ==> ', utxo[0].vin);
    // console.log('vout ==> ', utxo[0].vout);
    // console.log(" walletType ===> ", walletType);
    // console.log(" WalletTypes.UNISAT ===> ", WalletTypes.UNISAT);
    // console.log(typeof WalletTypes.UNISAT);
    const { vin, vout } = utxo[0];
    const buyerPaymentsignIndexes = [];
    const senderAddress = vin[0].prevout.scriptpubkey_address;
    const senderPubkey = vin[0].prevout.scriptpubkey;
    let totalAmount = 0;
    for (const oneUtxo of vin) {
        totalAmount += oneUtxo.prevout.value;
        buyerPaymentsignIndexes.push(psbt.inputCount);
        if (walletType === config_2.WalletTypes.UNISAT || walletType === config_2.WalletTypes.OKX) {
            console.log("psbt.addInput ===>>>");
            psbt.addInput({
                hash: oneUtxo.txid,
                index: oneUtxo.vout,
                witnessUtxo: {
                    value: oneUtxo.prevout.value,
                    script: Buffer.from(oneUtxo.prevout.scriptpubkey, "hex"),
                },
                tapInternalKey: walletType === config_2.WalletTypes.OKX
                    ? Buffer.from(senderPubkey, "hex")
                    : Buffer.from(senderPubkey, "hex").slice(1, 33),
                sighashType: Bitcoin.Transaction.SIGHASH_ALL,
                sequence: RBF_INPUT_SEQUENCE2
            });
        }
        // else if (walletType === WalletTypes.LEATHER) {
        //   psbt.addInput({
        //     hash: oneUtxo.txid,
        //     index: oneUtxo.vout,
        //     witnessUtxo: {
        //       value: oneUtxo.value,
        //       script: Buffer.from(oneUtxo.scriptpubkey as string, "hex"),
        //     },
        //     sequence: RBF_INPUT_SEQUENCE
        //   });
        // } else if (walletType === WalletTypes.XVERSE) {
        //   const txHex = await getTxHexById(oneUtxo.txid);
        //   psbt.addInput({
        //     hash: oneUtxo.txid,
        //     index: oneUtxo.vout,
        //     redeemScript: paymentoutput,
        //     nonWitnessUtxo: Buffer.from(txHex, "hex"),
        //     sighashType: Bitcoin.Transaction.SIGHASH_ALL,
        //     sequence: RBF_INPUT_SEQUENCE
        //   });
        // }
    }
    for (const oneUtxo of vout) {
        if (oneUtxo.scriptpubkey_address != senderAddress)
            psbt.addOutput({
                address: oneUtxo.scriptpubkey_address,
                value: oneUtxo.value
            });
    }
    console.log("psbt ==> ", psbt);
    const fee = calculateTxFee(psbt, newfeeRate);
    console.log('fee ==> ', fee);
    psbt.addOutput({
        address: senderAddress,
        value: totalAmount - fee,
    });
    console.log(psbt.toBase64());
    return {
        psbt: psbt,
        buyerPaymentsignIndexes,
    };
};
exports.generateRBF_OrdinalPSBT = generateRBF_OrdinalPSBT;
const combinePsbt = async (hexedPsbt, signedHexedPsbt1, signedHexedPsbt2) => {
    console.log("hexedPsbt ==> ", hexedPsbt);
    console.log("signedHexedPsbt1 ==> ", signedHexedPsbt1);
    try {
        const psbt = Bitcoin.Psbt.fromHex(hexedPsbt);
        const signedPsbt1 = Bitcoin.Psbt.fromHex(signedHexedPsbt1);
        if (signedHexedPsbt2) {
            const signedPsbt2 = Bitcoin.Psbt.fromHex(signedHexedPsbt2);
            psbt.combine(signedPsbt1, signedPsbt2);
        }
        else {
            psbt.combine(signedPsbt1);
        }
        const tx = psbt.extractTransaction();
        const txHex = tx.toHex();
        const txId = await (0, exports.pushRawTx)(txHex);
        return txId;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
};
exports.combinePsbt = combinePsbt;
const pushRawTx = async (rawTx) => {
    const txid = await postData(`https://mempool.space/${config_1.TEST_MODE ? "testnet/" : ""}api/tx`, rawTx);
    console.log("pushed txid", txid);
    return txid;
};
exports.pushRawTx = pushRawTx;
const postData = async (url, json, content_type = "text/plain", apikey = "") => {
    var _a, _b;
    while (1) {
        try {
            const headers = {};
            if (content_type)
                headers["Content-Type"] = content_type;
            if (apikey)
                headers["X-Api-Key"] = apikey;
            const res = await axios_1.default.post(url, json, {
                headers,
            });
            return res.data;
        }
        catch (err) {
            const axiosErr = err;
            console.log("push tx error", (_a = axiosErr.response) === null || _a === void 0 ? void 0 : _a.data);
            if (!((_b = axiosErr.response) === null || _b === void 0 ? void 0 : _b.data).includes('sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'))
                throw new Error("Got an err when push tx");
        }
    }
};
const finalizePsbtInput = (hexedPsbt, inputs) => {
    const psbt = Bitcoin.Psbt.fromHex(hexedPsbt);
    inputs.forEach((input) => psbt.finalizeInput(input));
    return psbt.toHex();
};
exports.finalizePsbtInput = finalizePsbtInput;
