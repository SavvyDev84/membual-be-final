import { Request, Response, Router } from "express";
import axios from "axios";
import fs from 'fs';
import * as csv from 'csv-writer';

import ProfileModel from "../../model/ProfileModal";

import { MEMPOOL_API, OPENAPI_UNISAT_TOKEN, OPENAPI_UNISAT_URL } from "../../config/config";
import TxModel from "../../model/TxModal";
import { delay } from "../../service/psbt.service";

// Create a new instance of the Express Router
const UtilsRoute = Router();

// @route    GET api/utils/getBtcPrice
// @desc     get getBtcPrice
// @access   Public
UtilsRoute.get("/getBtcPrice", async (req, res) => {
  try {

    const url = `https://mempool.space/api/v1/prices`;
    const recentPrice = await axios(url);
    const payload = recentPrice.data.USD;

    console.log('Recent Bitcoin Price ==> ', payload);

    return res.status(200).send({
      success: true,
      message: "Get Bitcoin Price Successfully",
      payload: payload
    })

  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
});

// @route    GET api/utils/getFeeRate
// @desc     get getFeeRate
// @access   Public
UtilsRoute.get("/getFeeRate", async (req, res) => {
  try {

    const url = `${MEMPOOL_API}/v1/fees/recommended`;
    const recentPrice = await axios(url);
    const payload = recentPrice.data;

    console.log('Recent Bitcoin Price ==> ', payload);

    return res.status(200).send({
      success: true,
      message: "Get Bitcoin FeeRate Successfully",
      payload: payload
    })

  } catch (error: any) {
    console.error(error);
    return res.status(500).send({ error });
  }
});

// @route    GET api/utils/getInscriptions
// @desc     get getInscriptions
// @access   Public
UtilsRoute.get("/getInscriptions", async (req, res) => {
  try {

    const { address } = req.query;

    console.log("address ==>", address);
    const cursor = 0;
    const size = 100;

    let config = {
      method: "get",
      params: { cursor, size },
      url: `${OPENAPI_UNISAT_URL}/v1/indexer/address/${address}/inscription-data`,
      headers: {
        Authorization: `Bearer ${OPENAPI_UNISAT_TOKEN}`,
      },
    };

    const inscriptions = await axios.request(config);

    if (inscriptions.data.code == -1) {
      console.log('Unisat API is not working well, Try again later')
      return res.status(500).send({
        success: false,
        message: "Unisat API is not working well, Try again later",
        payload: null
      })
    }

    console.log("inscription ==> ", inscriptions.data);
    console.log("inscription ==> ", inscriptions.data.data.inscription.length);

    return res.status(200).send({
      success: true,
      message: "Get inscription list successfully",
      payload: inscriptions.data.data.inscription
    })

  } catch (error: any) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: error,
      payload: null
    });
  }
});

// @route    GET api/utils/updateTx
// @desc     updateTx
// @access   Public
UtilsRoute.get("/updateTx", async (req, res) => {

  console.log("<======= Update tx status ========>")

  const txlist = await TxModel.find({
    status: false
  })

  // console.log("txlist ==> ", txlist);

  const txIdList = txlist.filter(tx => tx.txId != '');

  console.log("txIdList ==> ", txIdList);

  for (const tx of txIdList) {
    console.log("url ==> ", `${MEMPOOL_API}/tx/${tx.txId}`)
    const url = `${MEMPOOL_API}/tx/${tx.txId}`;
    delay(2000);
    const payload = await axios.get(url);
    console.log("payload ==>", payload.data);
    const confirmed = payload.data.status.confirmed
    console.log("confirmed ==> ", confirmed);

    if (confirmed) {
      tx.status = true;
      await tx.save();
    }
  }

  return res.status(200).send({
    success: true,
    message: 'Update Transaction successfully!!'
  })
})

// @route    GET api/utils/RBFhistory
// @desc     updateTx
// @access   Public
UtilsRoute.get("/RBFhistory", async (req, res) => {
  const { txID } = req.query;

  const historyArr = [];

  const payload = await axios.get(`https://mempool.space/testnet/api/v1/tx/${txID}/rbf`);
  let main = payload.data.replacements;
  console.log("main ==> ", main);
  if (!main)
    return res.status(200).send({
      success: true,
      message: "There is no RBF history",
      payload: []
    })

  while (1) {
    historyArr.unshift({
      tx: main.tx,
      time: main.time
    });
    if (main.replaces.length == 0) break;
    main = main.replaces[0];
  }

  return res.status(200).send({
    success: true,
    message: "Fetch RBF history successfully",
    payload: historyArr
  })
})

export default UtilsRoute;
