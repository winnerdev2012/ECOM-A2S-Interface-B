const express = require('express');
const router = express.Router();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { index, populateYmm } = require('../../controllers/Api/YmmController');

router.use(cors());

router.get('/', index);
router.get('/populate', populateYmm);

module.exports = router;