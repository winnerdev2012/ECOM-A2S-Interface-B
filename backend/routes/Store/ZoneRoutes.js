const express = require('express');
const router = express.Router();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { syncProductsToShopify, syncProductModelsToMongo } = require('../../controllers/Stores/Zone/ZoneProductsController');

router.use(cors());

router.post('/products/sync', syncProductsToShopify);
router.post('/products/sync-product-models', syncProductModelsToMongo);

module.exports = router;