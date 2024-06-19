"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProfileModal_1 = __importDefault(require("../../model/ProfileModal"));
// Create a new instance of the Express Router
const ProfileRoute = (0, express_1.Router)();
// @route    GET api/profile/getAll
// @desc     get profile by paymentAddress
// @access   Public
ProfileRoute.get("/getAll", async (req, res) => {
    try {
        const payload = await ProfileModal_1.default.find();
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
// @route    GET api/profile/get
// @desc     get profile by paymentAddress
// @access   Public
ProfileRoute.get("/get", async (req, res) => {
    try {
        const { paymentAddress } = req.query;
        console.log(paymentAddress);
        if (!paymentAddress)
            return res.status(400).send({
                success: false,
                message: "paymentAddress parameter is empty."
            });
        const payload = await ProfileModal_1.default.findById(paymentAddress);
        console.log('paymentAddress ==> ', payload);
        if (!payload) {
            return res.status(500).send({
                success: false,
                message: "No Profile"
            });
        }
        return res.status(200).send({
            success: true,
            message: "Loading Specific Profile successfully.",
            payload: payload
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/getByPaymentAddress
// @desc     Remove address
// @access   Public
ProfileRoute.get("/getByPaymentAddress", async (req, res) => {
    try {
        const { paymentAddress, } = req.query;
        if (!paymentAddress)
            return res.status(400).send({
                success: false,
                message: "PaymentAddress parameter is empty."
            });
        const allProfiles = await ProfileModal_1.default.find();
        if (!allProfiles) {
            return res.status(500).send({
                success: false,
                message: "There is no profile in Database"
            });
        }
        for (const profile of allProfiles) {
            // console.log('profile ==> ', profile);
            if (profile.address.length == 0)
                continue;
            const findedIndex = profile.address.findIndex((address, index) => address.paymentAddress == paymentAddress);
            console.log('findedIndex ==>', findedIndex);
            if (findedIndex >= 0) {
                return res.status(200).send({
                    success: true,
                    payload: profile,
                    message: "Found wallet address successfully."
                });
            }
        }
        return res.status(200).send({
            success: true,
            payload: null,
            message: "Not found! This address is new one."
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/getByPaymentAddress
// @desc     Remove address
// @access   Public
ProfileRoute.get("/getByProfileId", async (req, res) => {
    try {
        const { profileId, } = req.query;
        if (!profileId)
            return res.status(400).send({
                success: false,
                message: "profileId parameter is empty."
            });
        const profile = await ProfileModal_1.default.findById(profileId);
        if (!profile) {
            return res.status(500).send({
                success: false,
                message: "There is no profile in Database"
            });
        }
        return res.status(200).send({
            success: true,
            payload: profile,
            message: "Fetch profile successfully."
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/saveProfile
// @desc     Is username available
// @access   Public
ProfileRoute.post("/saveProfile", async (req, res) => {
    try {
        const { username, avatar, walletName, paymentAddress, paymentPubkey, ordinalsAddress, ordinalsPubkey, walletType, points } = req.body;
        let error = '';
        if (!username)
            error += 'username, ';
        if (!avatar)
            error += 'avatar, ';
        if (!walletName)
            error += 'walletName, ';
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
        // if(!points) error += 'points, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        console.log("saveProfile endpoint is calling");
        const payload = await ProfileModal_1.default.findOne({
            username
        });
        console.log('username ==> ', payload);
        if (payload) {
            return res.status(500).send({
                success: false,
                message: "This username is already used!"
            });
        }
        let addressArr = null;
        const allProfile = await ProfileModal_1.default.find();
        allProfile.map((profile) => {
            console.log("profile.address ==> ", profile.address);
            if (addressArr == null) {
                addressArr = JSON.parse(JSON.stringify(profile.address));
            }
            else {
                addressArr.push(...profile.address);
            }
            console.log("after addressArr ==> ", addressArr);
        });
        console.log("allProfile ==> ", addressArr);
        if (addressArr) {
            const addressFlag = addressArr.find((address) => paymentAddress == address.paymentAddress);
            console.log("addressFlag ==> ", addressFlag);
            if (addressFlag) {
                return res.status(500).send({
                    success: false,
                    message: "This address is already owned by another users"
                });
            }
        }
        const newProfile = new ProfileModal_1.default({
            username,
            avatar,
            address: [{
                    walletName,
                    paymentAddress,
                    paymentPubkey,
                    ordinalsAddress,
                    ordinalsPubkey,
                    walletType,
                }],
            points
        });
        await newProfile.save();
        return res.status(200).send({
            success: true,
            message: "New profile is saved successfully.",
            payload: await ProfileModal_1.default.find()
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/addWallet
// @desc     Add address
// @access   Public
ProfileRoute.post("/addWallet", async (req, res) => {
    try {
        const { username, paymentAddress, paymentPubkey, ordinalsAddress, ordinalsPubkey, walletName, walletType } = req.body;
        let error = '';
        if (!username)
            error += 'username, ';
        if (!walletName)
            error += 'walletName, ';
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
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        const payloadByUsername = await ProfileModal_1.default.findOne({
            username
        });
        console.log('payloadByUsername ==> ', payloadByUsername);
        if (!payloadByUsername) {
            return res.status(500).send({
                success: false,
                message: "There is no profile with this username"
            });
        }
        if (payloadByUsername.address.length >= 5) {
            return res.status(500).send({
                success: false,
                message: "You can save only 5 addresses."
            });
        }
        const walletNameIndex = payloadByUsername.address.findIndex((address) => address.walletName == walletName);
        console.log("walletNameIndex =");
        if (walletNameIndex >= 0) {
            return res.status(500).send({
                success: false,
                message: "You already used this walletName."
            });
        }
        let addressArr = null;
        const allProfile = await ProfileModal_1.default.find();
        allProfile.map((profile) => {
            console.log("profile.address ==> ", profile.address);
            if (addressArr == null) {
                addressArr = JSON.parse(JSON.stringify(profile.address));
            }
            else {
                addressArr.push(...profile.address);
            }
            console.log("after addressArr ==> ", addressArr);
        });
        console.log("allProfile ==> ", addressArr);
        if (addressArr) {
            const addressFlag = addressArr.find((address) => paymentAddress == address.paymentAddress);
            console.log("addressFlag ==> ", addressFlag);
            if (addressFlag) {
                return res.status(500).send({
                    success: false,
                    message: "This address is already owned."
                });
            }
        }
        payloadByUsername.address.push({
            walletName,
            paymentAddress,
            paymentPubkey,
            ordinalsAddress,
            ordinalsPubkey,
            walletType
        });
        await payloadByUsername.save();
        return res.status(200).send({
            success: true,
            message: "New profile is saved successfully.",
            payload: await ProfileModal_1.default.find()
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/pro`file/removeWallet
// @desc     Remove address
// @access   Public
ProfileRoute.post("/removeWallet", async (req, res) => {
    try {
        const { username, paymentAddress, } = req.body;
        let error = '';
        if (!username)
            error += 'username, ';
        if (!paymentAddress)
            error += 'paymentAddress, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        const payloadByUsername = await ProfileModal_1.default.findOne({
            username
        });
        console.log('payloadByUsername ==> ', payloadByUsername);
        if (!payloadByUsername) {
            return res.status(500).send({
                success: false,
                message: "There is no profile with this username"
            });
        }
        if (payloadByUsername.address.length == 0) {
            return res.status(500).send({
                success: false,
                message: "You have no address"
            });
        }
        const findedIndex = payloadByUsername.address.findIndex((address, index) => address.paymentAddress == paymentAddress);
        console.log('findedIndex ==>', findedIndex);
        if (findedIndex < 0) {
            return res.status(500).send({
                success: false,
                message: "This address is not owned in this profile"
            });
        }
        payloadByUsername.address.splice(findedIndex, 1);
        await payloadByUsername.save();
        return res.status(200).send({
            success: true,
            message: "address is removed successfully",
            payload: await ProfileModal_1.default.find()
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/renameWallet
// @desc     Remove address
// @access   Public
ProfileRoute.post("/renameWallet", async (req, res) => {
    try {
        const { id, walletName, paymentAddress } = req.body;
        let error = '';
        if (!walletName)
            error += 'walletName, ';
        if (!paymentAddress)
            error += 'paymentAddress, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        const payloadById = await ProfileModal_1.default.findById(id);
        console.log('payloadById ==> ', payloadById);
        if (!payloadById) {
            return res.status(500).send({
                success: false,
                message: "There is no profile"
            });
        }
        if (payloadById.address.length == 0) {
            return res.status(500).send({
                success: false,
                message: "You have no address"
            });
        }
        const findedIndex = payloadById.address.findIndex((address, index) => address.paymentAddress == paymentAddress);
        console.log('findedIndex ==>', findedIndex);
        if (findedIndex < 0) {
            return res.status(500).send({
                success: false,
                message: "This address is not owned in this profile"
            });
        }
        if (payloadById.address[findedIndex].walletName == walletName) {
            return res.status(500).send({
                success: false,
                message: "This walletName is not different with recent one"
            });
        }
        payloadById.address[findedIndex].walletName = walletName;
        await payloadById.save();
        return res.status(200).send({
            success: true,
            message: "wallet Name is changed successfully",
            payload: payloadById
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/changeAvatar
// @desc     Change Avatar
// @access   Public
ProfileRoute.post("/changeAvatar", async (req, res) => {
    try {
        const { id, avatar } = req.body;
        let error = '';
        if (!id)
            error += 'id, ';
        if (!avatar)
            error += 'avatar, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        const payloadById = await ProfileModal_1.default.findById(id);
        console.log('payloadById ==> ', payloadById);
        if (!payloadById) {
            return res.status(500).send({
                success: false,
                message: "There is no profile"
            });
        }
        payloadById.avatar = avatar;
        await payloadById.save();
        return res.status(200).send({
            success: true,
            message: "Profile Avatar changed successfully",
            payload: payloadById
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
// @route    POST api/profile/addPoint
// @desc     Add point
// @access   Public
ProfileRoute.post("/addPoint", async (req, res) => {
    try {
        const { id, point } = req.body;
        let error = '';
        if (!id)
            error += 'id, ';
        if (!point)
            error += 'point, ';
        if (error)
            return res.status(400).send({
                success: false,
                message: error + 'is required'
            });
        const payload = await ProfileModal_1.default.findById(id);
        console.log('paymentAddress ==> ', payload);
        if (!payload) {
            return res.status(500).send({
                success: false,
                message: "No Profile"
            });
        }
        payload.points += point;
        await payload.save();
        return res.status(200).send({
            success: true,
            message: "Points is added successflly",
            payload: payload.points
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send({ error });
    }
});
exports.default = ProfileRoute;
