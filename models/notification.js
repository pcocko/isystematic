// Load required packages
var mongoose = require('mongoose');

// Define user schema
var NotificationSchema   = new mongoose.Schema({
  email: String,
  user_id: String,
  firstname: String,
  lastname: String,
  image: String,
  message: String
});

// Export the Mongoose model
module.exports = mongoose.model('Notification', NotificationSchema);