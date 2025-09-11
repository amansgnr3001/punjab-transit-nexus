const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    trim: true
  },
  busNumberPlate: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Create index for better query performance
emergencySchema.index({ driverId: 1 });
emergencySchema.index({ busNumberPlate: 1 });
emergencySchema.index({ timestamp: -1 }); // Descending order for newest first

const Emergency = mongoose.model('Emergency', emergencySchema, 'emergencies');

module.exports = Emergency;
