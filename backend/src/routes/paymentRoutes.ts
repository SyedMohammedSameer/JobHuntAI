// backend/src/routes/paymentRoutes.ts

import express from 'express';
import paymentController from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

/**
 * Payment Routes
 * All routes require authentication
 */

/**
 * @route   POST /api/payment/create-checkout-session
 * @desc    Create Stripe checkout session for premium subscription
 * @access  Private
 */
router.post(
  '/create-checkout-session',
  authenticateToken,
  paymentController.createCheckoutSession.bind(paymentController)
);

/**
 * @route   GET /api/payment/session/:sessionId
 * @desc    Get checkout session status
 * @access  Private
 */
router.get(
  '/session/:sessionId',
  authenticateToken,
  paymentController.getSessionStatus.bind(paymentController)
);

/**
 * @route   POST /api/payment/create-portal-session
 * @desc    Create customer portal session for managing subscription
 * @access  Private
 */
router.post(
  '/create-portal-session',
  authenticateToken,
  paymentController.createPortalSession.bind(paymentController)
);

export default router;