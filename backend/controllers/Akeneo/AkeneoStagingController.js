const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const { getSsgJsonExtract, getAkeneoStagingProducts }  = require('../../services/Akeneo/AkeneoStagingService');


// @desc    Get SSG JSON Extract from MongoDB SSG Products
// @route   GET /api/akeneo-staging/ssg-json-export
// @access  Public
const ssgJson = asyncHandler(async (req, res) => {
    const ssgJson = await getSsgJsonExtract(req, res);
    res.send(ssgJson);
});

// @desc    Akeneo Products - Populate database with SSG products from Akeneo
// @route   GET /api/akeneo-staging/products-and-fitment
// @access  Public
const populateDb = asyncHandler(async (req, res) => {
    const akeneoSsgProducts = await getAkeneoStagingProducts(req, res);
    res.send(akeneoSsgProducts);
});

module.exports = {
    ssgJson,
    populateDb
}