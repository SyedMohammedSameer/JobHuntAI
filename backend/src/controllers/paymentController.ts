// backend/src/controllers/paymentController.ts

import { Request, Response } from 'express';
import logger from '../utils/logger';
import stripeService from '../services/stripeService';

/**
 * Payment Controller
 * Handles payment operations and checkout sessions
 */
class PaymentController {
  /**
   * Create checkout session for premium subscription
   * @route POST /api/payment/create-checkout-session
   */
  async createCheckoutSession(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
      if (!priceId) {
        logger.error('Stripe price ID not configured');
        return res.status(500).json({
          success: false,
          message: 'Payment configuration error',
        });
      }

      logger.info('Creating checkout session', { userId });

      // Create checkout session
      const session = await stripeService.createCheckoutSession(userId, priceId);

      logger.info('Checkout session created', {
        userId,
        sessionId: session.id,
      });

      res.status(200).json({
        success: true,
        message: 'Checkout session created',
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error: any) {
      logger.error('Failed to create checkout session', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create checkout session',
        error: error.message,
      });
    }
  }

  /**
   * Get checkout session status
   * @route GET /api/payment/session/:sessionId
   */
  async getSessionStatus(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Getting session status', { userId, sessionId });

      // Note: In production, you'd retrieve session from Stripe
      // For now, we'll return a simple status
      res.status(200).json({
        success: true,
        message: 'Session status retrieved',
        data: {
          sessionId,
          status: 'complete',
          // In real implementation: retrieve from Stripe
        },
      });
    } catch (error: any) {
      logger.error('Failed to get session status', {
        sessionId: req.params.sessionId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get session status',
        error: error.message,
      });
    }
  }

  /**
   * Create customer portal session
   * @route POST /api/payment/create-portal-session
   */
  async createPortalSession(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Creating customer portal session', { userId });

      // Create portal session
      const session = await stripeService.createCustomerPortalSession(userId);

      logger.info('Portal session created', {
        userId,
        sessionId: session.id,
      });

      res.status(200).json({
        success: true,
        message: 'Portal session created',
        data: {
          url: session.url,
        },
      });
    } catch (error: any) {
      logger.error('Failed to create portal session', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create portal session',
        error: error.message,
      });
    }
  }
}

export default new PaymentController();