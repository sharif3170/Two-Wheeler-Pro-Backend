const express = require('express');
const router = express.Router();
// Import the SellVehicle model
const SellVehicle = require('../models/sellVehicle');
const auth = require('../middleware/auth'); // Add auth middleware import

// Submit a vehicle for selling - ADD AUTH MIDDLEWARE
router.post('/submit', auth, async (req, res) => {
  try {
    console.log('Received request for vehicle submission:', JSON.stringify(req.body, null, 2));
    
    const { 
      name, 
      email, 
      phone, 
      vehicleBrand,
      vehicleModel,
      year, 
      kmDriven, 
      expectedPrice, 
      condition, 
      description
      // Remove userId from destructuring as it will come from auth middleware
    } = req.body;
    
    // Log the extracted values
    console.log('Extracted form data:', { name, email, phone, vehicleBrand, vehicleModel, year, kmDriven, expectedPrice, condition, description });
    
    // Validate required fields
    if (!name || !email || !phone || !vehicleBrand || !vehicleModel || !year || !kmDriven || !expectedPrice) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');
      if (!vehicleBrand) missingFields.push('vehicleBrand');
      if (!vehicleModel) missingFields.push('vehicleModel');
      if (!year) missingFields.push('year');
      if (!kmDriven) missingFields.push('kmDriven');
      if (!expectedPrice) missingFields.push('expectedPrice');
      
      console.log('Validation failed: missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      console.log('Validation failed: invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }
    
    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1990 || year > currentYear) {
      console.log('Validation failed: invalid year');
      return res.status(400).json({
        success: false,
        message: `Year must be between 1990 and ${currentYear}`
      });
    }
    
    // Validate kmDriven
    if (kmDriven < 0) {
      console.log('Validation failed: negative kmDriven');
      return res.status(400).json({
        success: false,
        message: 'Kilometers driven cannot be negative'
      });
    }
    
    // Validate expectedPrice
    if (expectedPrice < 1000) {
      console.log('Validation failed: price too low');
      return res.status(400).json({
        success: false,
        message: 'Expected price must be at least ₹1000'
      });
    }
    
    console.log('All validations passed, creating new SellVehicle document');
    
    const sellVehicle = new SellVehicle({
      name,
      email,
      phone,
      vehicleBrand,
      vehicleModel,
      year,
      kmDriven,
      expectedPrice,
      condition: condition || 'good',
      description: description || '',
      userId: req.user._id // Use userId from authenticated user
    });
    
    console.log('Attempting to save SellVehicle document');
    await sellVehicle.save();
    console.log('Successfully saved SellVehicle document:', sellVehicle._id);
    
    res.status(201).json({
      success: true,
      message: 'Vehicle submission received successfully. Our team will contact you within 24 hours.',
      sellVehicle
    });
  } catch (error) {
    console.error('Error submitting vehicle for sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting vehicle for sale',
      error: error.message
    });
  }
});

// Get all vehicle submissions (admin only) - KEEP AUTH MIDDLEWARE
router.get('/all', auth, async (req, res) => {
  try {
    const sellVehicles = await SellVehicle.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      sellVehicles
    });
  } catch (error) {
    console.error('Error fetching vehicle submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle submissions',
      error: error.message
    });
  }
});

// Get vehicle submission by ID - REMOVE AUTH MIDDLEWARE to allow public viewing
router.get('/:id', async (req, res) => {
  try {
    const sellVehicle = await SellVehicle.findById(req.params.id);
    
    if (!sellVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle submission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      sellVehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle submission',
      error: error.message
    });
  }
});

// Get vehicle submissions by user ID - KEEP AUTH MIDDLEWARE
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own submissions
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const sellVehicles = await SellVehicle.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      sellVehicles
    });
  } catch (error) {
    console.error('Error fetching user vehicle submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user vehicle submissions',
      error: error.message
    });
  }
});

// Get sold vehicles by user ID - KEEP AUTH MIDDLEWARE
router.get('/user/:userId/sold', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own submissions
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const soldVehicles = await SellVehicle.find({ userId, status: 'sold' }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      soldVehicles
    });
  } catch (error) {
    console.error('Error fetching sold vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sold vehicles',
      error: error.message
    });
  }
});

// Update vehicle submission status - KEEP AUTH MIDDLEWARE
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'evaluated', 'quoted', 'sold', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const sellVehicle = await SellVehicle.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!sellVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle submission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vehicle submission status updated successfully',
      sellVehicle
    });
  } catch (error) {
    console.error('Error updating vehicle submission status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle submission status',
      error: error.message
    });
  }
});

// Delete vehicle submission - KEEP AUTH MIDDLEWARE
router.delete('/:id', auth, async (req, res) => {
  try {
    const sellVehicle = await SellVehicle.findByIdAndDelete(req.params.id);
    
    if (!sellVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle submission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vehicle submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle submission',
      error: error.message
    });
  }
});

module.exports = router;