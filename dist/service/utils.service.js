"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTxStatus = exports.chooseWinner = void 0;
const axios_1 = __importDefault(require("axios"));
const TxModal_1 = __importDefault(require("../model/TxModal"));
const config_1 = require("../config/config");
const psbt_service_1 = require("./psbt.service");
const chooseWinner = async (array) => {
    const item = array[Math.floor(Math.random() * array.length)];
    return item;
};
exports.chooseWinner = chooseWinner;
const updateTxStatus = async () => {
    await (0, psbt_service_1.delay)(500);
    console.log("<======= Update tx status ========>");
    const txlist = await TxModal_1.default.find({
        status: false
    });
    const txIdList = txlist.filter(tx => tx.txId != '');
    for (const tx of txIdList) {
        console.log("url ==> ", `${config_1.MEMPOOL_API}/tx/${tx.txId}`);
        const confirmed = (await axios_1.default.get(`${config_1.MEMPOOL_API}/tx/${tx.txId}`)).data.status.confirmed;
        console.log("confirmed ==> ", confirmed);
        if (confirmed) {
            tx.status = true;
            await tx.save();
        }
    }
    console.log("<======= Finish Tx update ========>");
};
exports.updateTxStatus = updateTxStatus;
