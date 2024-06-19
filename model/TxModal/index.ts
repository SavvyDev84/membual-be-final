import mongoose from "mongoose";

const TxSchema = new mongoose.Schema({
    profileId: { type: String, required: true },
    paymentAddress: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    type: { type: String, required: true },
    amountToTransfer: { type: Number, default: 0},
    inscriptionId: { type: String, default: '' },
    isDraft: { type: Boolean, required: true },
    feeRate: { type: Number, required: true },
    txId: { type: String, default: '' },
    status: { type: Boolean, default: false }
});

const TxModel = mongoose.model("tx", TxSchema);

export default TxModel;
