// backend/src/routes/subscriptionRoutes.ts

import express from 'express';
import subscriptionController from '../controllers/subscriptionController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

/**
 * Subscription Routes
 * All routes require authentication
 */

/**
 * @route   GET /api/subscription/current
 * @desc    Get current user's subscription details
 * @access  Private
 */
router.get(
  '/current',
  authenticateToken,
  subscriptionController.getCurrentSubscription.bind(subscriptionController)
);

/**
 * @route   GET /api/subscription/premium-access
 * @desc    Check if user has premium access
 * @access  Private
 */
router.get(
  '/premium-access',
  authenticateToken,
  subscriptionController.checkPremiumAccess.bind(subscriptionController)
);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel premium subscription (at period end)
 * @access  Private
 */
router.post(
  '/cancel',
  authenticateToken,
  subscriptionController.cancelSubscription.bind(subscriptionController)
);

/**
 * @route   POST /api/subscription/reactivate
 * @desc    Reactivate canceled subscription
 * @access  Private
 */
router.post(
  '/reactivate',
  authenticateToken,
  subscriptionController.reactivateSubscription.bind(subscriptionController)
);

/**
 * @route   GET /api/subscription/payment-history
 * @desc    Get payment history for the user
 * @access  Private
 */
router.get(
  '/payment-history',
  authenticateToken,
  subscriptionController.getPaymentHistory.bind(subscriptionController)
);

/**
 * @route   GET /api/subscription/billing-info
 * @desc    Get billing information
 * @access  Private
 */
router.get(
  '/billing-info',
  authenticateToken,
  subscriptionController.getBillingInfo.bind(subscriptionController)
);

export default router;