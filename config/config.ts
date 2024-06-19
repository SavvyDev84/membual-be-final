import dotenv from "dotenv";
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

export const TEST_MODE = true;

// export const MONGO_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
export const MONGO_URL = `mongodb+srv://nikolicmiloje0507:byrW1cYDK807qd13@cluster0.z8spqcz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/membula`;
export const PORT = process.env.PORT || 8000
export const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";

export const MEMPOOL_API = TEST_MODE ? "https://mempool.space/testnet/api" : "https://mempool.space/api";

export const OPENAPI_UNISAT_URL = TEST_MODE
  ? "https://open-api-testnet.unisat.io"
  : "https://open-api.unisat.io";

export const OPENAPI_URL = TEST_MODE
  ? "https://api-testnet.unisat.io/wallet-v4"
  : "https://api.unisat.io/wallet-v4";

export const OPENAPI_UNISAT_TOKEN = process.env.UNISAT_TOKEN;
export const OPENAPI_UNISAT_TOKEN2 = process.env.UNISAT_TOKEN2;
export const SIGNATURE_SIZE = 126;
export const SERVICE_FEE_PERCENT = 3;
export const ADMIN_PAYMENT_ADDRESS: string = process.env
  .ADMIN_PAYMENT_ADDRESS as string;

export const RUNE_PRICE = 0.000096;

export enum WalletTypes {
  UNISAT = "Unisat",
  XVERSE = "Xverse",
  LEATHER = "Leather",
  OKX = "Okx",
}

export const RBF_INPUT_SEQUENCE = 0xfffffffd
export const RBF_INPUT_SEQUENCE2 = 0xfffffffe


