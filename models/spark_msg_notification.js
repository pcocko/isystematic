// Load required packages
var mongoose = require('mongoose');

// Define user schema
var SparkMessageNotificationSchema   = new mongoose.Schema({
  message: {
    type: String, 
    ref: 'Message'
  },
  user: {
    type: String, 
    ref: 'User'
  },
  notice_user: {
    type: String, 
    ref: 'User'
  },
  spark: {
    type: String, 
    ref: 'Spark'
  },
  user_views: {
    type: Number,
    default: 0
  }
});

// Export the Mongoose model
module.exports = mongoose.model('SparkMessageNotification', SparkMessageNotificationSchema);