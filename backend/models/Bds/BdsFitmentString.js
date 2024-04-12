const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bdsFitmentStringSchema = new Schema({
  identifier: { type: String, required: true },
  product_name: { type: String, required: true },
  fitment_string_data: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BdsFitmentString', bdsFitmentStringSchema);