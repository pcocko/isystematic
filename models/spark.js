// Load required packages
var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

// Define user schema
var SparkSchema   = new mongoose.Schema({
  title: {
    type: String,
    required:true
  },
  description: {
    type: String
  },
  task_category: {
    type: String
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  user: {
    type: String, 
    ref: 'User'
  },
  create_date: {
    type: Date,
    default: Date.now
  },
  frequency: {
    type: Number
  },
  email: {
    type: String
  },
  status: {
    type: Number,
    default: 1
  }
});

// Export the Mongoose model
module.exports = mongoose.model('Spark', SparkSchema);