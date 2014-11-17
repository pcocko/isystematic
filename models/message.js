// Load required packages
var mongoose = require('mongoose');
var User = require('../models/user');
var Spark = require('../models/spark');

// Define user schema
var MessageSchema   = new mongoose.Schema({
  user_id: { type: String, ref: 'User' },
  spark_id: { type: String, ref: 'Spark' },
  message: String,
  attachment: String,
  date: {type: Date, default: Date.now },
  user_views: {type: Number, default: 0 }
});

// Export the Mongoose model
module.exports = mongoose.model('Message', MessageSchema);