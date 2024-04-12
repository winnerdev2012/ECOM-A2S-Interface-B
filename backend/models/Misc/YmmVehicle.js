const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ymmVehicleSchema = new Schema({
  year: { type: String || Number },
  make: { type: String || Number },
  model: { type: String || Number },
  submodel: { type: String || Number },
  drive_type: { type: String || Number },
  fuel_type: { type: String || Number },
  doors: { type: String || Number },
  type: { type: String || Number },
});

module.exports = mongoose.model('YmmVehicle', ymmVehicleSchema);