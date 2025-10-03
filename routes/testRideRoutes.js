const express = require('express');
const router = express.Router();
const TestRide = require('../models/TestRide');

// Book a test ride
router.post('/book', async (req, res) => {
  try {
    const { name, email, phone, vehicleId, date, time, showroom, userId } = req.body;
    
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
      userId: userId || null
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

// Get all test rides (admin only)
router.get('/all', async (req, res) => {
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

// Get test rides by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
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

// Get test ride by ID
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

// Update test ride status
router.put('/:id/status', async (req, res) => {
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

// Cancel test ride
router.delete('/:id', async (req, res) => {
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