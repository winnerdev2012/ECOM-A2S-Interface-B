const express = require('express');
const router = express.Router();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { index } = require('../../controllers/Api/SsgProductSelectController');

router.use(cors());

router.get('/', index);

module.exports = router;