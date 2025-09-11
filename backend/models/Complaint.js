const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  busnumberplate: {
    type: String,
    required: true,
    trim: true
  },
  startingplace: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Complaint', complaintSchema);
