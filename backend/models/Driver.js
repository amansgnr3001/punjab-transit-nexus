const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
   password: {
    type: String,
    required: true
  }
});

const Driver = mongoose.model('Driver', driverSchema, 'Driver');

module.exports = Driver;