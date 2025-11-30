import User from '../models/User.js';
import Resource from '../models/Resource.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Resource statistics
    const totalResources = await Resource.countDocuments({ isActive: true });
    const premiumResources = await Resource.countDocuments({ isPremium: true });
    const totalDownloads = await Resource.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    // Payment statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Notification statistics
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          recent: recentUsers
        },
        resources: {
          total: totalResources,
          premium: premiumResources,
          totalDownloads: totalDownloads[0]?.total || 0
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue[0]?.total || 0
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get user growth chart data
export const getUserGrowthData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: userGrowth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth data',
      error: error.message
    });
  }
};

// Get revenue chart data
export const getRevenueData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue data',
      error: error.message
    });
  }
};

// Get resource statistics by type
export const getResourceTypeStats = async (req, res) => {
  try {
    const resourcesByType = await Resource.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          avgRating: { $avg: '$averageRating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: resourcesByType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource type statistics',
      error: error.message
    });
  }
};

// Get top resources by downloads
export const getTopResources = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topResources = await Resource.find({ isActive: true })
      .sort({ downloadCount: -1 })
      .limit(parseInt(limit))
      .select('title type downloadCount averageRating uploadedByName')
      .populate('uploadedBy', 'name');

    res.json({
      success: true,
      data: topResources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top resources',
      error: error.message
    });
  }
};

// Get resource activity over time
export const getResourceActivityData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activityData = await Resource.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          uploads: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: activityData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource activity data',
      error: error.message
    });
  }
};

// Get user engagement metrics
export const getUserEngagementData = async (req, res) => {
  try {
    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Premium vs Free users
    const usersByType = await User.aggregate([
      {
        $group: {
          _id: { $cond: ['$isPremium', 'Premium', 'Free'] },
          count: { $sum: 1 }
        }
      }
    ]);

    // Active users (users who have uploaded resources)
    const activeUploaders = await Resource.distinct('uploadedBy');

    res.json({
      success: true,
      data: {
        byRole: usersByRole,
        byType: usersByType,
        activeUploaders: activeUploaders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user engagement data',
      error: error.message
    });
  }
};

// Get payment status distribution
export const getPaymentStatusData = async (req, res) => {
  try {
    const paymentsByStatus = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: paymentsByStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status data',
      error: error.message
    });
  }
};
