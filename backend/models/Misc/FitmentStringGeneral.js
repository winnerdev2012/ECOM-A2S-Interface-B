const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const generalFitmentStringSchema = new Schema({
  identifier: { type: String },
  product_name: { type: String },
  fitment_string_data: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }

});

module.exports = mongoose.model('FitmentStringGeneral', generalFitmentStringSchema);