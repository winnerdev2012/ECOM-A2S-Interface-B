const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

const { handleQuery } = require('../../services/SsgApp/SsgProductSelect');


// @desc    SSG Product Selection
// @route   GET /api/ssg-product-select
// @access  Public
const index = asyncHandler(async (req, res) => {
    const ssgSelection = await handleQuery(req);
    res.json(ssgSelection);
});

module.exports = {
    index
}