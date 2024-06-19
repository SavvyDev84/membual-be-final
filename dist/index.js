"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const node_cron_1 = __importDefault(require("node-cron"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const config_1 = require("./config");
const http_1 = __importDefault(require("http"));
const routes_1 = require("./routes");
const utils_service_1 = require("./service/utils.service");
// Load environment variables from .env file
dotenv_1.default.config();
// Connect to the MongoDB database
(0, config_1.connectMongoDB)().then(result => {
    node_cron_1.default.schedule(`*/10 * * * *`, async () => {
        (0, utils_service_1.updateTxStatus)();
    });
});
// Create an instance of the Express application
const app = (0, express_1.default)();
// Set up Cross-Origin Resource Sharing (CORS) options
app.use((0, cors_1.default)());
// Serve static files from the 'public' folder
app.use(express_1.default.static(path_1.default.join(__dirname, './public')));
// Parse incoming JSON requests using body-parser
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use(body_parser_1.default.json({ limit: '50mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '50mb', extended: true }));
const server = http_1.default.createServer(app);
// Define routes for different API endpoints
app.use("/api/profile", routes_1.ProfileRoute);
app.use("/api/tx", routes_1.TxRoute);
app.use("/api/utils", routes_1.UtilsRoute);
app.use("/api/portfolio", routes_1.PortfolioRoute);
app.use("/api/draft", routes_1.DraftRoute);
app.use('/upload', express_1.default.static('upload'));
/////////////////////////////////////////////////////////////////
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == 'image/png' ||
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/jpeg') {
            cb(null, true);
        }
        else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    },
});
const uploadImages = upload.array('image');
app.post('/upload', async (req, res) => {
    uploadImages(req, res, function (err) {
        if (err) {
            return res.status(400).send({ message: err.message });
        }
        // Everything went fine.
        const files = req.files;
        res.json(files);
    });
});
// Define a route to check if the backend server is running
app.get("/", async (req, res) => {
    res.send("Backend Server is Running now!");
});
// Start the Express server to listen on the specified port
server.listen(config_1.PORT, () => {
    console.log(`Server is running on port ${config_1.PORT}`);
});
(0, utils_service_1.updateTxStatus)();
