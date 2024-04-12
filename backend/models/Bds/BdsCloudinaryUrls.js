const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bdsCloudinaryUrlSchema = new Schema({
  identifier: { type: String },
  cloudinary_urls: { type: Object },
});

module.exports = mongoose.model('BdsCloudinaryUrl', bdsCloudinaryUrlSchema);