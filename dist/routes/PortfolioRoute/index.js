"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProfileModal_1 = __importDefault(require("../../model/ProfileModal"));
const TxModal_1 = __importDefault(require("../../model/TxModal"));
const config_1 = require("../../config/config");
const axios_1 = __importDefault(require("axios"));
// Create a new instance of the Express Router
const PortfolioRoute = (0, express_1.Router)();
// @route    GET api/portfolio/getAll
// @desc     get tx by paymentAddress
// @access   Public
PortfolioRoute.get("/getAll", async (req, res) => {
    try {
        console.log("api/portfolio/getAll ==> ");
        // Donut
        let totalBTC = 0;
        let totalInscription = 0;
        let totalBRC20 = 0;
        let totalRune = 0;
        const payload = await ProfileModal_1.default.find();
        console.log('paymentAddress ==> ', payload);
        if (!payload) {
            return res.status(500).send({
                success: false,
                message: "No Profile exist"
            });
        }
        for (const profile of payload) {
            const addressList = profile.address;
            for (const address of addressList) {
                const config1 = {
                    headers: {
                        Authorization: `Bearer ${config_1.OPENAPI_UNISAT_TOKEN2}`,
                    },
                };
                const addressPayload = await axios_1.default.get(`${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address.paymentAddress}/balance`, config1);
                if (addressPayload.data.code == -1)
                    return;
                console.log("address.paymentAddress ==> ", address.paymentAddress);
                console.log("addressPayload.data ==> ", addressPayload.data);
                totalBTC += (addressPayload.data.data.btcSatoshi + addressPayload.data.data.btcPendingSatoshi);
                const inscriptionPayload = await axios_1.default.get(`${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address.ordinalsAddress}/inscription-utxo-data`, config1);
                console.log("address.paymentAddress ==> ", address.paymentAddress);
                console.log("inscriptionPayload.data ==> ", inscriptionPayload.data);
                const mainUTXO = inscriptionPayload.data.data.utxo;
                console.log("mainUTXO ==> ", mainUTXO);
                mainUTXO.map((utxo) => {
                    if (utxo.inscriptions[0].isBRC20) {
                        totalBRC20 += utxo.satoshi;
                    }
                    else {
                        totalInscription += utxo.satoshi;
                    }
                });
                const runePayload = await axios_1.default.get(`${config_1.OPENAPI_UNISAT_URL}/v1/indexer/address/${address.ordinalsAddress}/runes/balance-list`, config1);
                const runeDetails = runePayload.data.data.detail;
                runeDetails.map((rune) => {
                    totalRune += rune.amount * 1;
                });
            }
        }
        // Draft
        const draftTx = await TxModal_1.default.find({
            isDraft: true
        });
        // Process
        const processTx = await TxModal_1.default.find({
            isDraft: false,
            status: false
        });
        const resultPayload = {
            totalBTC: totalBTC,
            totalInscription,
            totalBRC20,
            totalRune,
            draftCount: draftTx.length,
            process: processTx.length
        };
        return res.status(200).send({
            success: true,
            message: "Loading All Profile successfully.",
            payload: resultPayload
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    GET api/portfolio/getBTCPrice
// @desc     get BTC Price
// @access   Public
PortfolioRoute.get("/getBTCPrice", async (req, res) => {
    try {
        const payload = await axios_1.default.get("https://mempool.space/api/v1/prices");
        console.log("BTC payload ==> ", payload);
        return res.status(200).send({
            success: true,
            payload: payload.data.USD
        });
    }
    catch (error) {
    }
});
exports.default = PortfolioRoute;
