// Simple authentication middleware without JWT
const User = require('../models/user');

const auth = async (req, res, next) => {
  try {
    // Get user ID from request headers
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID required' });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = auth;