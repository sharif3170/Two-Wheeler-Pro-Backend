const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: Number,
    required: true
  },
  vehicleName: {
    type: String,
    required: true
  },
  vehicleBrand: {
    type: String,
    required: true
  },
  vehiclePrice: {
    type: Number,
    required: true
  },
  vehicleImage: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can't favorite the same vehicle twice
favoriteSchema.index({ userId: 1, vehicleId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);