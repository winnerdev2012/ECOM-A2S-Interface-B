const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { promisifyAll } = require('bluebird');
// const bodyParser = require('body-parser');
const redis = require('redis');
const dotenv = require('dotenv');
dotenv.config();

// MongoDB Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log("Connected to Database"));

const port = process.env.PORT || 5006;

const app = express();

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

// Redis Connection
let redisClient;
async function connectRedis() {
  redisClient = redis.createClient({
    url: `redis://127.0.0.1:6378`,
    legacyMode: true,
  });

  redisClient.on("connect", () => {
    console.log("Redis client connected");
  });
  redisClient.on("error", (error) => {
    console.error(error);
  });

  promisifyAll(redisClient);

  await redisClient.connect();
}

connectRedis();

module.exports = {
  redisClient,
};

// Routes

// API Routes
app.use('/api/ymm', require('./routes/Api/YmmRoutes'));
app.use('/api/ssg-product-select', require('./routes/Api/SsgProductSelectRoutes'));

// Admin Routes
// app.use('/api/auth', require('./routes/Admin/AuthRoutes'));

// Akeneo Routes
app.use('/api/akeneo', require('./routes/Akeneo/ProductsAndFitmentRoutes'));
app.use('/api/akeneo-staging', require('./routes/Akeneo/ProductsAndFitmentStagingRoutes'));

// Store Routes
app.use('/api/bds', require('./routes/Store/BdsRoutes'));
// app.use('/api/jks', require('./routes/Store/JksRoutes'));
app.use('/api/zone', require('./routes/Store/ZoneRoutes'));
app.use('/api/crwltk', require('./routes/Store/CrwltkRoutes'));

app.listen(port, () => { console.log("Server is running on port " + port) });