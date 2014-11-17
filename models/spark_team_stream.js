// Load required packages
var mongoose = require('mongoose');
var User = require('../models/user');
var Spark = require('../models/spark');

// Define user schema
var SparkTeamStreamSchema   = new mongoose.Schema({
  user_id: { type: String, ref: 'User' },
  spark_id: { type: String, ref: 'Spark' },
  user_views: { type: Number,  default:0 },
  status: {type: Number, default:2 },
  date: {type: Date, default:Date.now }
},{ capped: { size: 1024, max: 1000, autoIndexId: true } });

// Export the Mongoose model
module.exports = mongoose.model('SparkTeamStream', SparkTeamStreamSchema);