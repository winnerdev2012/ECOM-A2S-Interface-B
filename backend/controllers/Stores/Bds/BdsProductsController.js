const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const { syncBdsProducts } = require('../../../services/Bds/BdsProductService');
const { syncBdsVarients } = require('../../../services/Bds/BdsShopifyProductBuild');

// @desc    Sync Bds Products to Shopify
// @route   GET /api/bds/products/sync
// @access  Public
const syncProductsToShopify = asyncHandler(async (req, res) => {
  console.log('Syncing products to Shopify...');
  const products = await syncBdsProducts(req);
  res.json({ message: 'Bds Products Synced!', products });
});

// @desc    Sync Zone Product Models to Mongo
// @route   GET /api/zone/products/sync-product-models
// @access  Public
const syncProductModelsToShopify = asyncHandler(async (req, res) => {
  console.log('Syncing variants products to Shopify...');
  const productModels = await syncBdsVarients(req);
  res.json({ message: 'Zone Product Models Synced!', productModels });
});

module.exports = {
  syncProductsToShopify,
  syncProductModelsToShopify
}