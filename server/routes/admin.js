const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// All admin routes require authentication + admin role
router.use(auth, admin);

// @route   GET /api/admin/stats
router.get('/stats', adminController.getStats);

// @route   GET /api/admin/users
router.get('/users', adminController.getUsers);

// @route   GET /api/admin/users/:id
router.get('/users/:id', adminController.getUserDetail);

// @route   PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminController.toggleUserRole);

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
