// Need to write mongoose model for ZoneProductTag with the following fields: identifier, product_name, product_tags

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const znAkeneoProductTagSchema = new Schema({
    identifier: { type: String },
    product_name: { type: String },
    product_tags: { type: Array },
});

module.exports = mongoose.model('ZnAkeneoProductTag', znAkeneoProductTagSchema);
