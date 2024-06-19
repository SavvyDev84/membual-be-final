"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBF_INPUT_SEQUENCE2 = exports.RBF_INPUT_SEQUENCE = exports.WalletTypes = exports.RUNE_PRICE = exports.ADMIN_PAYMENT_ADDRESS = exports.SERVICE_FEE_PERCENT = exports.SIGNATURE_SIZE = exports.OPENAPI_UNISAT_TOKEN2 = exports.OPENAPI_UNISAT_TOKEN = exports.OPENAPI_URL = exports.OPENAPI_UNISAT_URL = exports.MEMPOOL_API = exports.JWT_SECRET = exports.PORT = exports.MONGO_URL = exports.TEST_MODE = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
try {
    dotenv_1.default.config();
}
catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}
exports.TEST_MODE = true;
// export const MONGO_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
exports.MONGO_URL = `mongodb+srv://nikolicmiloje0507:byrW1cYDK807qd13@cluster0.z8spqcz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/membula`;
exports.PORT = process.env.PORT || 8000;
exports.JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
exports.MEMPOOL_API = exports.TEST_MODE ? "https://mempool.space/testnet/api" : "https://mempool.space/api";
exports.OPENAPI_UNISAT_URL = exports.TEST_MODE
    ? "https://open-api-testnet.unisat.io"
    : "https://open-api.unisat.io";
exports.OPENAPI_URL = exports.TEST_MODE
    ? "https://api-testnet.unisat.io/wallet-v4"
    : "https://api.unisat.io/wallet-v4";
exports.OPENAPI_UNISAT_TOKEN = process.env.UNISAT_TOKEN;
exports.OPENAPI_UNISAT_TOKEN2 = process.env.UNISAT_TOKEN2;
exports.SIGNATURE_SIZE = 126;
exports.SERVICE_FEE_PERCENT = 3;
exports.ADMIN_PAYMENT_ADDRESS = process.env
    .ADMIN_PAYMENT_ADDRESS;
exports.RUNE_PRICE = 0.000096;
var WalletTypes;
(function (WalletTypes) {
    WalletTypes["UNISAT"] = "Unisat";
    WalletTypes["XVERSE"] = "Xverse";
    WalletTypes["LEATHER"] = "Leather";
    WalletTypes["OKX"] = "Okx";
})(WalletTypes || (exports.WalletTypes = WalletTypes = {}));
exports.RBF_INPUT_SEQUENCE = 0xfffffffd;
exports.RBF_INPUT_SEQUENCE2 = 0xfffffffe;
