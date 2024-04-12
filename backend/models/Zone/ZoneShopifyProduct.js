const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const znShopifyProductSchema = new Schema({
  store_id: { type: Number },
  store_name: { type: String },
  product_name: { type: String },
  identifier: { type: String },
  zn_finish: { type: String },
  zn_liftType: { type: String },
  zn_material: { type: String },
  zn_wheelSize_1: { type: String },
  zn_wheelSize_2: { type: String },
  zn_wheelSize_3: { type: String },
  zn_backSpacing_1: { type: String },
  zn_backSpacing_2: { type: String },
  zn_backSpacing_3: { type: String },
  zn_maxTireSize_1: { type: String },
  zn_maxTireSize_2: { type: String },
  zn_maxTireSize_3: { type: String },
  zn_liftHeight_rear: { type: String },
  zn_liftMethod_rear: { type: String },
  zn_liftHeight_front: { type: String },
  zn_liftMethod_front: { type: String },
  zn_installation_time: { type: String },
  PVG_InventoryCategory: { type: String },
  PVG_Harmonization_Code: { type: String },
  zn_requiresFitment: { type: Boolean },
  zn_requiresWelding: { type: Boolean },
  zn_requiresMetalCutting: { type: Boolean },
  variants: { type: Array },
});

module.exports = mongoose.model('ZnShopifyProduct', znShopifyProductSchema);