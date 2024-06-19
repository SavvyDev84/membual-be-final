"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const TxSchema = new mongoose_1.default.Schema({
    profileId: { type: String, required: true },
    paymentAddress: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    type: { type: String, required: true },
    amountToTransfer: { type: Number, default: 0 },
    inscriptionId: { type: String, default: '' },
    isDraft: { type: Boolean, required: true },
    feeRate: { type: Number, required: true },
    txId: { type: String, default: '' },
    status: { type: Boolean, default: false }
});
const TxModel = mongoose_1.default.model("tx", TxSchema);
exports.default = TxModel;
