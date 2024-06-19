import axios from "axios";
import TxModel from "../model/TxModal";
import { MEMPOOL_API } from "../config/config";
import { delay } from "./psbt.service";

export const chooseWinner = async (array: Array<string>) => {
  const item = array[Math.floor(Math.random() * array.length)];
  return item;
};

export const updateTxStatus = async () => {

  await delay(500);
  console.log("<======= Update tx status ========>")

  const txlist = await TxModel.find({
    status: false
  })

  const txIdList = txlist.filter(tx => tx.txId != '');

  for(const tx of txIdList){
    console.log("url ==> ", `${MEMPOOL_API}/tx/${tx.txId}`);
    const confirmed = (await axios.get(`${MEMPOOL_API}/tx/${tx.txId}`)).data.status.confirmed;
    console.log("confirmed ==> ", confirmed);

    if(confirmed){
      tx.status = true;
      await tx.save();
    }
  }

  console.log("<======= Finish Tx update ========>")

}