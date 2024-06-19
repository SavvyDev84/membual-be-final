"use strict";
// import express, { Request, Response, Router } from "express";
// import axios, { all } from "axios";
// import dotenv from "dotenv";
// import { Collection } from "mongoose";
// dotenv.config();
// const API_ORDINAL_ENDPOINT = 'https://api-mainnet.magiceden.dev/v2/ord/btc/activities/trades';
// const OrdinalRoute = Router();
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// const fetchOrdinalData = async () => {
//     let allActivities = [];
//     let hasNext = true;
//     let cursor = null;
//     while (hasNext) {
//         try {
//              // Respect the rate limit
//             const params = {
//                 limit: 100,
//                 ...(cursor && { cursor }) // Include cursor if it exists
//             };
//             const response:any = await axios.get(API_ORDINAL_ENDPOINT, {
//                 params,
//                 headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}` }
//             });
//             // console.log("Response data:", response.data);
//             if (response.data.activities && response.data.activities.length > 0) {
//                 for (const activity of response.data.activities) {
//                     // await delay(1000); // Delay each request to avoid rate limits
//                     try {
//                         // Assume the endpoint to get image details or additional info uses the collectionSymbol
//                         const imageResponse = await axios.get('https://api-mainnet.magiceden.dev/v2/ord/btc/tokens/', {
//                             params:{
//                                 tokenIds:activity.tokenId
//                             },
//                             headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}` }
//                         });
//                         activity.imageData = imageResponse.data; // Append image data to activity
//                         console.log("Fetched image data:", imageResponse.data);
//                     } catch (imageError:any) {
//                         console.error("Error fetching image data:", imageError.response ? imageError.response.data : imageError.message);
//                         activity.imageData = {}; // Ensure imageData field is always present
//                     }
//                     allActivities.push(activity);
//                 }
//                 cursor = response.data.nextCursor || null;
//                 hasNext = !!cursor;
//             } else {
//                 hasNext = false;
//             }
//         } catch (error:any) {
//             console.error('Error fetching activities:', error.message);
//             if (error.response) {
//                 console.error('Response data:', error.response.data);
//                 console.error('Response status:', error.response.status);
//                 console.error('Response headers:', error.response.headers);
//             }
//             hasNext = false; // Stop fetching if there's an error
//         }
//     }
//     console.log("Total activities fetched:", allActivities.length);
//     // console.log(allActivities);
//     return allActivities;
// };
// OrdinalRoute.get('/sniper', async (req: Request, res: Response) => {
//     try {
//         const activities = await fetchOrdinalData();
//         res.json(activities);
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Error fetching activities');
//     }
// });
// OrdinalRoute.post('/snipe', async (req: Request, res: Request) => {
//     const { tokenId, paymentAddress } = req.body;
//     console.log(req.body);
//     try {
//         // Step 1: Get the token details from Magic Eden
//         const tokenDetailsResponse = await axios.get('https://api.magiceden.dev/v2/ord/btc/tokens',
//             {
//                 params: { tokenIds: tokenId },
//                 headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}` },
//                 timeout: 100000
//             }
//         );
//         console.log(tokenDetailsResponse.data);
//     } catch (error) {
//         console.error('Failed to complete purchase:', error);
//     }
// })
// export default OrdinalRoute;
