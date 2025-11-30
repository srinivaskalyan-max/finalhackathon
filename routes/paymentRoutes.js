import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createCheckoutSession,
  handleStripeWebhook,
  getPaymentHistory,
  getPaymentDetails,
  verifyPaymentSession,
  getPaymentStats
} from '../controllers/paymentController.js';

const router = express.Router();

// Webhook route (no auth middleware - Stripe will verify)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.post('/create-checkout', protect, createCheckoutSession);
router.get('/history', protect, getPaymentHistory);
router.get('/verify/:sessionId', protect, verifyPaymentSession);
router.get('/:id', protect, getPaymentDetails);

// Admin routes
router.get('/stats/all', protect, admin, getPaymentStats);

export default router;
