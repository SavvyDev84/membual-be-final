"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ProfileSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    address: [
        {
            walletName: { type: String, required: true },
            paymentAddress: { type: String, required: true },
            paymentPubkey: { type: String, required: true },
            ordinalsAddress: { type: String, required: true },
            ordinalsPubkey: { type: String, required: true },
            walletType: { type: String, required: true },
        },
    ],
    points: { type: Number, default: 0 }
});
const ProfileModel = mongoose_1.default.model("profile", ProfileSchema);
exports.default = ProfileModel;
