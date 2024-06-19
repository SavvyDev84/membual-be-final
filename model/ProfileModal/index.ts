import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
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

const ProfileModel = mongoose.model("profile", ProfileSchema);

export default ProfileModel;
