// Load required packages
var mongoose = require('mongoose');

// Define user schema
var UserDetailSchema   = new mongoose.Schema({
  firstname: String,
  lastname: String,
  headline: String,
  image: String,
  gender: String,
  dob: String,
  martial: String,
  skills: String,
  employment: String,
  telhome: String, 
  telwork: String,
  telcontact: String
});

// Export the Mongoose model
module.exports = mongoose.model('UserDetail', UserDetailSchema);