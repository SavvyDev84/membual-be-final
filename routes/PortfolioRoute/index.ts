import { Request, Response, Router } from "express";
import * as Bitcoin from "bitcoinjs-lib";

import ProfileModel from "../../model/ProfileModal";
import TxModel from "../../model/TxModal";

import { generateSendOrdinalPSBT, generateSendBTCPSBT, finalizePsbtInput, combinePsbt } from "../../service/psbt.service";
import { WalletTypes, OPENAPI_UNISAT_TOKEN2, OPENAPI_UNISAT_URL } from "../../config/config";
import axios from "axios";


// Create a new instance of the Express Router
const PortfolioRoute = Router();

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

    const payload = await ProfileModel.find();

    console.log('paymentAddress ==> ', payload);

    if (!payload) {
      return res.status(500).send({
        success: false,
        message: "No Profile exist"
      })
    }

    for (const profile of payload) {
      const addressList = profile.address;
      for (const address of addressList) {
        const config1 = {
          headers: {
            Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN2}`,
          },
        };


        const addressPayload = await axios.get(`${OPENAPI_UNISAT_URL}/v1/indexer/address/${address.paymentAddress}/balance`, config1);
        if (addressPayload.data.code == -1) return
        console.log("address.paymentAddress ==> ", address.paymentAddress);
        console.log("addressPayload.data ==> ", addressPayload.data);
        totalBTC += (addressPayload.data.data.btcSatoshi + addressPayload.data.data.btcPendingSatoshi);


        const inscriptionPayload = await axios.get(`${OPENAPI_UNISAT_URL}/v1/indexer/address/${address.ordinalsAddress}/inscription-utxo-data`, config1);
        console.log("address.paymentAddress ==> ", address.paymentAddress);
        console.log("inscriptionPayload.data ==> ", inscriptionPayload.data);
        const mainUTXO = inscriptionPayload.data.data.utxo;
        console.log("mainUTXO ==> ", mainUTXO);
        mainUTXO.map((utxo: any) => {
          if (utxo.inscriptions[0].isBRC20) {
            totalBRC20 += utxo.satoshi;
          } else {
            totalInscription += utxo.satoshi;
          }
        })

        const runePayload = await axios.get(`${OPENAPI_UNISAT_URL}/v1/indexer/address/${address.ordinalsAddress}/runes/balance-list`, config1);
        const runeDetails = runePayload.data.data.detail;
        runeDetails.map((rune: any) => {
          totalRune += rune.amount * 1;
        })


      }
    }

    // Draft

    const draftTx = await TxModel.find({
      isDraft: true
    })

    // Process

    const processTx = await TxModel.find({
      isDraft: false,
      status: false
    })

    const resultPayload = {
      totalBTC: totalBTC,
      totalInscription,
      totalBRC20,
      totalRune,
      draftCount: draftTx.length,
      process: processTx.length
    }

    return res.status(200).send({
      success: true,
      message: "Loading All Profile successfully.",
      payload: resultPayload
    })

  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
});


// @route    GET api/portfolio/getBTCPrice
// @desc     get BTC Price
// @access   Public
PortfolioRoute.get("/getBTCPrice", async (req, res) => {
  try {
    const payload = await axios.get("https://mempool.space/api/v1/prices");
    console.log("BTC payload ==> ", payload);
    return res.status(200).send({
      success: true,
      payload: payload.data.USD
    })
  } catch (error) {

  }
});

export default PortfolioRoute;
