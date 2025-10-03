const mongoose = require('mongoose');

const SellVehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleBrand: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  year: { type: Number, required: true },
  kmDriven: { type: Number, required: true },
  expectedPrice: { type: Number, required: true },
  condition: { 
    type: String, 
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'evaluated', 'quoted', 'sold', 'rejected'],
    default: 'pending'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Export the SellVehicle model
module.exports = mongoose.model('SellVehicle', SellVehicleSchema);