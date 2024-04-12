const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

const { handleQuery, populateYmmCollection } = require('../../services/PvgYmm/YmmService');


// @desc    Ymm
// @route   GET /api/ymm
// @access  Public
const index = asyncHandler(async (req, res) => {
    const ymm = await handleQuery(req);
    res.json(ymm);
});

// @desc    Populate YmmVehicle collection
// @route   GET /api/ymm/populate
// @access  Public
const populateYmm = asyncHandler(async (req, res) => {
    console.log('Populating YmmVehicle collection...')
        const fitmentStrings = await populateYmmCollection(req);
        res.json(fitmentStrings);
});

module.exports = {
    index,
    populateYmm
}