const {
    getMasterySummary
} = require('../services/masteryEngine');
const {
    detectWeakTopics
} = require('../services/weaknessEngine');
const {
    calculateReadiness
} = require('../services/readinessEngine');
const {
    generateRevisionPlan
} = require('../services/revisionScheduler');
const InteractionHistory = require('../models/InteractionHistory');
const User = require('../models/User');

// @desc    Get topic mastery overview
// @route   GET /api/analytics/mastery
exports.getMastery = async (req, res) => {
    try {
        const summary = await getMasterySummary(req.user._id);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get mastery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get mastery data'
        });
    }
};

// @desc    Get weak topics
// @route   GET /api/analytics/weak-topics
exports.getWeakTopics = async (req, res) => {
    try {
        const weakTopics = await detectWeakTopics(req.user._id);

        res.json({
            success: true,
            data: {
                count: weakTopics.length,
                topics: weakTopics
            }
        });
    } catch (error) {
        console.error('Get weak topics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get weak topics'
        });
    }
};

// @desc    Get exam readiness score
// @route   GET /api/analytics/exam-readiness
exports.getExamReadiness = async (req, res) => {
    try {
        const readiness = await calculateReadiness(req.user._id);

        res.json({
            success: true,
            data: readiness
        });
    } catch (error) {
        console.error('Get readiness error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate readiness'
        });
    }
};

// @desc    Get study time analytics
// @route   GET /api/analytics/study-time
exports.getStudyTime = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Get interactions grouped by day for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyInteractions = await InteractionHistory.aggregate([{
                $match: {
                    userId: req.user._id,
                    createdAt: {
                        $gte: sevenDaysAgo
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    interactions: {
                        $sum: 1
                    },
                    avgResponseTime: {
                        $avg: '$responseTime'
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        // Fill in missing days
        const studyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayData = dailyInteractions.find(d => d._id === dateStr);
            studyData.push({
                date: dateStr,
                day: date.toLocaleDateString('en-US', {
                    weekday: 'short'
                }),
                interactions: dayData ? dayData.interactions : 0,
                minutes: dayData ? Math.round(dayData.interactions * 2) : 0 // estimate 2 min per interaction
            });
        }

        res.json({
            success: true,
            data: {
                totalStudyTime: user.studyTime,
                streak: user.streak,
                dailyData: studyData
            }
        });
    } catch (error) {
        console.error('Get study time error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get study time data'
        });
    }
};
// @desc    Get interaction history
// @route   GET /api/analytics/history
exports.getHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type; // ask, summarize, compare
        const skip = (page - 1) * limit;

        const filter = { userId: req.user._id };
        if (type) filter.type = type;

        const [interactions, total] = await Promise.all([
            InteractionHistory.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            InteractionHistory.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                interactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get interaction history'
        });
    }
};

// @desc    Get revision plan
// @route   GET /api/analytics/revision-plan
exports.getRevisionPlan = async (req, res) => {
    try {
        const plan = await generateRevisionPlan(req.user._id);

        res.json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Get revision plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate revision plan'
        });
    }
};