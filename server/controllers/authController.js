const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Document = require('../models/Document');
const TopicMastery = require('../models/TopicMastery');
const QuizResult = require('../models/QuizResult');
const InteractionHistory = require('../models/InteractionHistory');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture || '',
          role: user.role,
          studyTime: user.studyTime,
          streak: user.streak,
          readinessScore: user.readinessScore,
          aiInteractions: user.aiInteractions
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;

    if (lastStudy) {
      lastStudy.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }

    user.lastStudyDate = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture || '',
          role: user.role,
          studyTime: user.studyTime,
          streak: user.streak,
          readinessScore: user.readinessScore,
          aiInteractions: user.aiInteractions
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Request password reset (generates a 6-digit code)
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists — always return success
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset code has been generated.'
      });
    }

    // Generate a 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code before storing
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Log reset code to console (in production, send via email)
    console.log('═══════════════════════════════════════════');
    console.log(`  PASSWORD RESET CODE for ${user.email}`);
    console.log(`  Code: ${resetCode}`);
    console.log(`  Expires in 15 minutes`);
    console.log('═══════════════════════════════════════════');

    // In development, include the code in response for convenience
    const response = {
      success: true,
      message: 'If an account with that email exists, a reset code has been generated.'
    };

    if (process.env.NODE_ENV === 'development') {
      response.devCode = resetCode;
    }

    res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process password reset' });
  }
};

// @desc    Reset password using code
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    const user = await User.findById(req.user._id);
    user.name = name.trim();
    await user.save();

    res.json({
      success: true,
      data: { name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar file if exists
    if (user.profilePicture) {
      const oldPath = path.join(__dirname, '..', user.profilePicture.replace('/api/', ''));
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
    }

    user.profilePicture = `/api/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      data: { profilePicture: user.profilePicture }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/auth/avatar
exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture.replace('/api/', ''));
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    user.profilePicture = '';
    await user.save();

    res.json({ success: true, message: 'Avatar removed' });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove avatar' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        studyTime: user.studyTime,
        streak: user.streak,
        readinessScore: user.readinessScore,
        aiInteractions: user.aiInteractions,
        dailyQuota: user.dailyQuota,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/auth/account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user's avatar file if exists
    const user = await User.findById(userId);
    if (user?.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture.replace('/api/', ''));
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    // Delete user's uploaded documents files
    const docs = await Document.find({ userId });
    for (const doc of docs) {
      if (doc.filePath) {
        try { if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath); } catch (e) { /* ignore */ }
      }
    }

    // Delete all user data from collections
    await Promise.all([
      Document.deleteMany({ userId }),
      TopicMastery.deleteMany({ userId }),
      QuizResult.deleteMany({ userId }),
      InteractionHistory.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};
