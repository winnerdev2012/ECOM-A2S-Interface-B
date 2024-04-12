const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

const { syncCrwltkProducts } = require('../../../services/Crwltk/CrwltkProductService');
const { syncCrwltkVarients } = require('../../../services/Crwltk/CrwltkShopifyProductBuild');


// @desc    Sync Crwltk Products to Shopify
// @route   GET /api/crwltk/products/sync
// @access  Public
const syncProductsToShopify = asyncHandler(async (req, res) => {
  console.log('Syncing products to Shopify...');
  const products = await syncCrwltkProducts(req);
  res.json({ message: 'CrawlTek Products Synced!', products });
});

// @desc    Sync Zone Product Models to Mongo
// @route   GET /api/zone/products/sync-product-models
// @access  Public
const syncProductModelsToShopify = asyncHandler(async (req, res) => {
  console.log('Syncing products to Mongo...')
  const productModels = await syncCrwltkVarients(req);
  res.json({ message: 'Zone Product Models Synced!', productModels });
});

module.exports = {
  syncProductsToShopify,
  syncProductModelsToShopify
}