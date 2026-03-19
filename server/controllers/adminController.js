const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Document = require('../models/Document');
const TopicMastery = require('../models/TopicMastery');
const QuizResult = require('../models/QuizResult');
const InteractionHistory = require('../models/InteractionHistory');

// @desc    Get dashboard stats (totals, recent signups, etc.)
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers,
      totalDocuments,
      totalQuizzes,
      totalInteractions,
      usersToday,
      usersThisWeek,
      usersThisMonth
    ] = await Promise.all([
      User.countDocuments(),
      Document.countDocuments(),
      QuizResult.countDocuments(),
      InteractionHistory.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } })
    ]);

    // Recent signups (last 7 days, grouped by day)
    const recentSignups = await User.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDocuments,
        totalQuizzes,
        totalInteractions,
        usersToday,
        usersThisWeek,
        usersThisMonth,
        recentSignups
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// @desc    Get all users (paginated, searchable)
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sort = req.query.sort || '-createdAt'; // newest first by default
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Add document count for each user
    const userIds = users.map(u => u._id);
    const docCounts = await Document.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    const docCountMap = {};
    docCounts.forEach(d => { docCountMap[d._id.toString()] = d.count; });

    const enrichedUsers = users.map(u => ({
      ...u,
      documentCount: docCountMap[u._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: {
        users: enrichedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// @desc    Get single user details
// @route   GET /api/admin/users/:id
exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [docCount, quizCount, interactionCount] = await Promise.all([
      Document.countDocuments({ userId: user._id }),
      QuizResult.countDocuments({ userId: user._id }),
      InteractionHistory.countDocuments({ userId: user._id })
    ]);

    res.json({
      success: true,
      data: {
        ...user,
        documentCount: docCount,
        quizCount,
        interactionCount
      }
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};

// @desc    Toggle user role (user <-> admin)
// @route   PUT /api/admin/users/:id/role
exports.toggleUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent removing your own admin access
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    res.json({
      success: true,
      data: { id: user._id, role: user.role }
    });
  } catch (error) {
    console.error('Toggle role error:', error);
    res.status(500).json({ success: false, message: 'Failed to change user role' });
  }
};

// @desc    Delete a user and all their data (admin action)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account from admin panel' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete avatar
    if (user.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture.replace('/api/', ''));
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    // Delete uploaded documents files
    const docs = await Document.find({ userId });
    for (const doc of docs) {
      if (doc.filePath) {
        try { if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath); } catch (e) { /* ignore */ }
      }
    }

    // Delete all user data
    await Promise.all([
      Document.deleteMany({ userId }),
      TopicMastery.deleteMany({ userId }),
      QuizResult.deleteMany({ userId }),
      InteractionHistory.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
