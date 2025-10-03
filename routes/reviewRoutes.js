const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const auth = require('../middleware/auth');

// ✅ Get all reviews for a vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const reviews = await Review.find({ vehicleId: parseInt(vehicleId) })
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add a new review
router.post('/', auth, async (req, res) => {
  try {
    const { vehicleId, rating, title, comment } = req.body;
    
    // Validate required fields
    if (!vehicleId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const review = new Review({
      vehicleId: parseInt(vehicleId),
      userId: req.user._id,
      userName: req.user.name,
      rating,
      title,
      comment
    });
    
    await review.save();
    
    res.status(201).json({ message: 'Review added successfully', review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get user's review for a specific vehicle
router.get('/user/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const review = await Review.findOne({
      vehicleId: parseInt(vehicleId),
      userId: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;