import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getUserGrowthData,
  getRevenueData,
  getResourceTypeStats,
  getTopResources,
  getResourceActivityData,
  getUserEngagementData,
  getPaymentStatusData
} from '../controllers/analyticsController.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(protect, admin);

router.get('/dashboard', getDashboardStats);
router.get('/user-growth', getUserGrowthData);
router.get('/revenue', getRevenueData);
router.get('/resource-types', getResourceTypeStats);
router.get('/top-resources', getTopResources);
router.get('/resource-activity', getResourceActivityData);
router.get('/user-engagement', getUserEngagementData);
router.get('/payment-status', getPaymentStatusData);

export default router;
