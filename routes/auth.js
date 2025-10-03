const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const useragent = require('useragent');

// Parse the useragent lookup tables
useragent(true);

// Function to get real IP address
const getRealIP = (req) => {
  // Check various headers for the real IP address
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.headers['x-client-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// ✅ Register User
router.post('/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { name, phone, email, password } = req.body;

      // Check duplicate email or phone
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return res.status(400).json({ message: "Email already exists" });
      
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) return res.status(400).json({ message: "Phone number already exists" });

      const user = new User({ name, phone, email, password });
      await user.save();
      
      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      res.status(201).json({ message: "User registered successfully", user: userObj });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation error', error: err.message });
      }
      res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
  }
);

// ✅ Login User
router.post('/login',
  [
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { email, phone, password } = req.body;
      
      // Find user by email or phone
      let user;
      if (email) {
        user = await User.findOne({ email });
      } else if (phone) {
        user = await User.findOne({ phone });
      } else {
        return res.status(400).json({ message: "Email or phone number is required" });
      }
      
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      // Parse user agent to get device information
      const agent = useragent.parse(req.headers['user-agent']);
      
      // Extract device, OS, and browser information
      const device = agent.device.toString();
      const os = agent.os.toString();
      const browser = agent.toAgent();
      
      // Create a more readable device string
      let deviceString = 'Other';
      if (device && device !== 'Other 0.0.0') {
        deviceString = device;
      } else if (os && os !== 'Other 0.0.0') {
        deviceString = os;
      }
      
      // Get real IP address
      const realIP = getRealIP(req);
      
      // Add login to history
      const loginRecord = {
        timestamp: new Date(),
        ip: realIP,
        userAgent: req.get('User-Agent'),
        location: 'Unknown', // In a real app, you would use a geolocation service
        device: deviceString,
        browser: browser || 'Unknown'
      };
      
      user.loginHistory.push(loginRecord);
      await user.save();

      // Remove password from response
      const userObj = user.toObject();
      delete userObj.password;

      res.json({ message: "Login successful", user: userObj });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login', error: err.message });
    }
  }
);

// ✅ Update User Profile
router.put('/profile', auth, async (req, res) => {
  try {
    // Get user from authenticated request
    const user = req.user;
    
    // Update only the fields that are provided
    const updateFields = {};
    if (req.body.name !== undefined) updateFields.name = req.body.name;
    if (req.body.email !== undefined) updateFields.email = req.body.email;
    if (req.body.phone !== undefined) updateFields.phone = req.body.phone;
    
    // If email is being updated, check if it's already taken
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Update the user
    Object.assign(user, updateFields);
    await user.save();
    
    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Profile updated successfully', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Change Password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Login History
router.get('/login-history', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Sort login history by timestamp descending (newest first)
    const sortedHistory = user.loginHistory.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.json({ loginHistory: sortedHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;