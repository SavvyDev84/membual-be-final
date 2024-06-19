import bodyParser from "body-parser";
import cron from "node-cron";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from 'path';
import multer from 'multer';
import { PORT, connectMongoDB } from "./config";
import http from "http";
import { DraftRoute, PortfolioRoute, ProfileRoute, TxRoute, UtilsRoute } from "./routes";
import { updateTxStatus } from "./service/utils.service";

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectMongoDB().then(result => {
  cron.schedule(`*/10 * * * *`, async () => {
    updateTxStatus();
  });
});

// Create an instance of the Express application
const app = express();

// Set up Cross-Origin Resource Sharing (CORS) options
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, './public')));

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);

// Define routes for different API endpoints

app.use("/api/profile", ProfileRoute)
app.use("/api/tx", TxRoute)
app.use("/api/utils", UtilsRoute)
app.use("/api/portfolio", PortfolioRoute)
app.use("/api/draft", DraftRoute)
app.use('/upload', express.static('upload'))

/////////////////////////////////////////////////////////////////
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, 'upload');
  },
  filename: function (req: any, file: any, cb: any) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req: any, file: any, cb: any) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});

const uploadImages = upload.array('image');

app.post('/upload', async (req: any, res: any) => {
  uploadImages(req, res, function (err: any) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }
    // Everything went fine.
    const files = req.files;
    res.json(files);
  });
});


// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Backend Server is Running now!");
});

// Start the Express server to listen on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

updateTxStatus();

