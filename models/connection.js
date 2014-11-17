// Load required packages
var mongoose = require('mongoose');

// Define user schema
var ConnectionSchema   = new mongoose.Schema({
  user_id: { type: String, ref: 'User' },
  user_id_friend: { type: String, ref: 'User' },
  status: { type: Number, default:2},
  user_views: { type: Number, default:0},
  email: String
});

// Export the Mongoose model
module.exports = mongoose.model('Connection', ConnectionSchema);