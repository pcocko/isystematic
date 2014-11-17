// Load required packages
var mongoose = require('mongoose');

// Define user schema
var CategorySchema   = new mongoose.Schema({
  name: { type: String }
});

// Export the Mongoose model
module.exports = mongoose.model('Category', CategorySchema);