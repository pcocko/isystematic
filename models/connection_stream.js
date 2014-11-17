// Load required packages
var mongoose = require('mongoose');

// Define user schema
var ConnectionStreamSchema   = new mongoose.Schema({
  user_id: { type: String, ref: 'User' },
  user_id_friend: { type: String, ref: 'User' },
  status: { type: Number, default:0},
  user_views: { type: Number, default:0},
  email: String,
  date: {type:Date, default:Date.now}
},{ capped: { size: 1024, max: 1000, autoIndexId: true } });

// Export the Mongoose model
module.exports = mongoose.model('ConnectionStream', ConnectionStreamSchema);