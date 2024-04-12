const express = require('express');
const router = express.Router();
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { ssgJson, populateDb } = require('../../controllers/Akeneo/AkeneoStagingController');

router.use(cors());

router.get('/ssg-json-export', ssgJson);
router.get('/products-and-fitment', populateDb);

module.exports = router;