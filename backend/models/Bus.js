const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  Bus_number_plate: {
    type: String,
    required: true
  },
  busName: {
    type: String,
    required: true
  },
  schedules: [{
    starttime: {
      type: String,
      required: true
    },
    endtime: {
      type: String,
      required: true
    },
    startingPlace: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    stops: [{
      name: {
        type: String,
        required: true
      },
      lat: {
        type: Number,
        required: true
      },
      long: {
        type: Number,
        required: true
      },
      time:{
        type: Number,
        required: true
      }
    }],
    days: [{
      type: String,
      required: true
    }]
  }]
});

const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;