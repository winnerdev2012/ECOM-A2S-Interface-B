const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

const { syncZoneProducts } = require('../../../services/Zone/ZoneProductService');
const { syncZoneToMongo } = require('../../../services/Zone/ZoneShopifyProductBuild');


// @desc    Sync Zone Products to Shopify
// @route   GET /api/zone/products/sync
// @access  Public
const syncProductsToShopify = asyncHandler(async (req, res) => {
  console.log('Syncing products to Shopify...');
  const products = await syncZoneProducts(req);
  res.json({ message: 'Zone Products Synced!', products });
});

// @desc    Sync Zone Product Models to Mongo
// @route   GET /api/zone/products/sync-product-models
// @access  Public
const syncProductModelsToMongo = asyncHandler(async (req, res) => {
  console.log('Syncing products to Mongo...')
  const productModels = await syncZoneToMongo(req);
  res.json({ message: 'Zone Product Models Synced!', productModels });
});

module.exports = {
  syncProductsToShopify,
  syncProductModelsToMongo
}