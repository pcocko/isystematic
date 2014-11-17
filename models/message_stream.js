// Load required packages
var mongoose = require('mongoose');
var User = require('../models/user');
var Spark = require('../models/spark');

// Define user schema
var MessageStreamSchema   = new mongoose.Schema({
  msg_id: String,
  user_id: { type: String, ref: 'User' },
  target_user_id: { type: String, ref: 'User' },
  spark_id: { type: String, ref: 'Spark' },
  message: String,
  attachment: String,
  date: {type: Date, default: Date.now },
  user_views: {type: Number, default: 0 }
},{ capped: { size: 1024, max: 1000, autoIndexId: true } });

// Export the Mongoose model
module.exports = mongoose.model('MessageStream', MessageStreamSchema);