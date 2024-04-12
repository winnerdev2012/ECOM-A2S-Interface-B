const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ssgForkProductSchema = new Schema({
    sku: { type: String },
    title: { type: String },
    category_level_1: { type: String },
    family: { type: String },
    series: { type: String },
    damper: { type: String },
    travel: { type: String },
    color: { type: String },
    image: { type: String },
    ref_entity: { type: String }
});

module.exports = mongoose.model('SsgForkProduct', ssgForkProductSchema);
