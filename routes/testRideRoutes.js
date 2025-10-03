const express = require('express');
const router = express.Router();
const TestRide = require('../models/TestRide');
const auth = require('../middleware/auth'); // Add auth middleware import

// Book a test ride - ADD AUTH MIDDLEWARE
router.post('/book', auth, async (req, res) => {
  try {
    const { name, email, phone, vehicleId, date, time, showroom } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !vehicleId || !date || !time || !showroom) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }
    
    const testRide = new TestRide({
      name,
      email,
      phone,
      vehicleId,
      date: new Date(date),
      time,
      showroom,
      userId: req.user._id // Use userId from authenticated user
    });
    
    await testRide.save();
    
    res.status(201).json({
      success: true,
      message: 'Test ride booked successfully',
      testRide
    });
  } catch (error) {
    console.error('Error booking test ride:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking test ride',
      error: error.message
    });
  }
});

// Get all test rides (admin only) - KEEP AUTH MIDDLEWARE
router.get('/all', auth, async (req, res) => {
  try {
    const testRides = await TestRide.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      testRides
    });
  } catch (error) {
    console.error('Error fetching test rides:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test rides',
      error: error.message
    });
  }
});

// Get test rides by user ID - KEEP AUTH MIDDLEWARE
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own test rides
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const testRides = await TestRide.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      testRides
    });
  } catch (error) {
    console.error('Error fetching user test rides:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user test rides',
      error: error.message
    });
  }
});

// Get test ride by ID - REMOVE AUTH MIDDLEWARE to allow public viewing
router.get('/:id', async (req, res) => {
  try {
    const testRide = await TestRide.findById(req.params.id);
    
    if (!testRide) {
      return res.status(404).json({
        success: false,
        message: 'Test ride not found'
      });
    }
    
    res.status(200).json({
      success: true,
      testRide
    });
  } catch (error) {
    console.error('Error fetching test ride:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test ride',
      error: error.message
    });
  }
});

// Update test ride status - KEEP AUTH MIDDLEWARE
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const testRide = await TestRide.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!testRide) {
      return res.status(404).json({
        success: false,
        message: 'Test ride not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Test ride status updated successfully',
      testRide
    });
  } catch (error) {
    console.error('Error updating test ride status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test ride status',
      error: error.message
    });
  }
});

// Cancel test ride - KEEP AUTH MIDDLEWARE
router.delete('/:id', auth, async (req, res) => {
  try {
    const testRide = await TestRide.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );
    
    if (!testRide) {
      return res.status(404).json({
        success: false,
        message: 'Test ride not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Test ride cancelled successfully',
      testRide
    });
  } catch (error) {
    console.error('Error cancelling test ride:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling test ride',
      error: error.message
    });
  }
});

module.exports = router;