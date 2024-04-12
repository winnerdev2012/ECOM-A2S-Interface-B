const express = require('express');
const router = express.Router();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { populateDb } = require('../../controllers/Akeneo/AkeneoProductsController');

router.use(cors());

router.get('/products-and-fitment', populateDb);

module.exports = router;