const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jksAkeneoProductSchema = new Schema({
  store_id: { type: Number },
  store_name: { type: String },
  product_name: { type: String },
  identifier: { type: String },
  jks_product_type: { type: String },
  PVG_InventoryCategory: { type: String },
  PVG_Harmonization_Code: { type: String },
  jks_door_number: { type: Array || String },
  jks_jrating_tag: { type: Array || String },
  jks_lift_height: { type: Array || String },
  jks_Product_Type_II: { type: Array || String },
  tire_specs: { type: Array || String },
});

module.exports = mongoose.model('JksAkeneoProduct', jksAkeneoProductSchema);
