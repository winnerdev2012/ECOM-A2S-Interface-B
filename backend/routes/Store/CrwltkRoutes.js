const express = require('express');
const router = express.Router();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { syncProductsToShopify, syncProductModelsToShopify } = require('../../controllers/Stores/Crwltk/CrwltkProductsController');

router.use(cors());

router.post('/products/sync', syncProductsToShopify);
router.post('/products/sync-product-models', syncProductModelsToShopify);

module.exports = router;