const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const { getAkeneoProductsAndFitment } = require('../../services/Akeneo/AkeneoProductsAndFitmentService');


// @desc    Akeneo Products - Populate database with products and fitment from Akeneo
// @route   GET /api/akeneo/products-and-fitment
// @access  Public
const populateDb = asyncHandler(async (req, res) => {
    const akeneoFitment = await getAkeneoProductsAndFitment(req, res);
    res.send(akeneoFitment);
});

module.exports = {
    populateDb
}