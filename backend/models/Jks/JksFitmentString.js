const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jksFitmentStringSchema = new Schema({
  identifier: { type: String },
  product_name: { type: String },
  fitment_string_data: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JksFitmentString', jksFitmentStringSchema);