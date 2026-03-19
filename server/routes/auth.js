const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const avatarUpload = require('../middleware/avatarUpload');

// @route   POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  authController.register
);

// @route   POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// @route   POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validate,
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid reset code'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validate,
  authController.resetPassword
);

// @route   GET /api/auth/profile
router.get('/profile', auth, authController.getProfile);

// @route   PUT /api/auth/profile
router.put('/profile', auth, authController.updateProfile);

// @route   PUT /api/auth/password
router.put('/password', auth, authController.changePassword);

// @route   POST /api/auth/avatar
router.post('/avatar', auth, avatarUpload.single('avatar'), authController.uploadAvatar);

// @route   DELETE /api/auth/avatar
router.delete('/avatar', auth, authController.removeAvatar);

// @route   DELETE /api/auth/account
router.delete('/account', auth, authController.deleteAccount);

module.exports = router;
