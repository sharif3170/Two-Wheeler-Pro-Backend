const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const auth = require('../middleware/auth');

// Add a vehicle to favorites
router.post('/add', auth, async (req, res) => {
  try {
    const { vehicleId, vehicleName, vehicleBrand, vehiclePrice, vehicleImage } = req.body;
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,  // Changed from req.user.id to req.user._id
      vehicleId
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already in favorites'
      });
    }
    
    // Create new favorite
    const favorite = new Favorite({
      userId: req.user._id,  // Changed from req.user.id to req.user._id
      vehicleId,
      vehicleName,
      vehicleBrand,
      vehiclePrice,
      vehicleImage
    });
    
    await favorite.save();
    
    res.json({
      success: true,
      message: 'Vehicle added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Remove a vehicle from favorites
router.delete('/remove/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const favorite = await Favorite.findOneAndDelete({
      userId: req.user._id,
      vehicleId
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Vehicle removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all favorites for a user
router.get('/user', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .sort({ addedAt: -1 });
    
    res.json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Check if a vehicle is favorited by user
router.get('/check/:vehicleId', auth, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const isFavorited = await Favorite.exists({
      userId: req.user._id,
      vehicleId
    });
    
    res.json({
      success: true,
      isFavorited
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Toggle favorite status
router.post('/toggle', auth, async (req, res) => {
  try {
    const { vehicleId, vehicleName, vehicleBrand, vehiclePrice, vehicleImage } = req.body;
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      vehicleId
    });
    
    if (existingFavorite) {
      // Remove from favorites
      await Favorite.deleteOne({
        userId: req.user._id,
        vehicleId
      });
      
      res.json({
        success: true,
        message: 'Vehicle removed from favorites',
        isFavorited: false
      });
    } else {
      // Add to favorites
      const favorite = new Favorite({
        userId: req.user._id,
        vehicleId,
        vehicleName,
        vehicleBrand,
        vehiclePrice,
        vehicleImage
      });
      
      await favorite.save();
      
      res.json({
        success: true,
        message: 'Vehicle added to favorites',
        isFavorited: true,
        favorite
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;