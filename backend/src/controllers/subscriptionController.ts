// backend/src/controllers/subscriptionController.ts

import { Request, Response } from 'express';
import logger from '../utils/logger';
import subscriptionService from '../services/subscriptionService';
import stripeService from '../services/stripeService';

/**
 * Subscription Controller
 * Handles subscription management operations
 */
class SubscriptionController {
  /**
   * Get current user's subscription
   * @route GET /api/subscription/current
   */
  async getCurrentSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Getting current subscription', { userId });

      const subscription = await subscriptionService.getSubscriptionDetails(userId);

      res.status(200).json({
        success: true,
        message: 'Subscription retrieved successfully',
        data: subscription,
      });
    } catch (error: any) {
      logger.error('Failed to get current subscription', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get subscription',
        error: error.message,
      });
    }
  }

  /**
   * Cancel subscription (at period end)
   * @route POST /api/subscription/cancel
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Canceling subscription', { userId });

      const result = await subscriptionService.cancelSubscription(userId);

      res.status(200).json({
        success: true,
        message: 'Subscription canceled successfully',
        data: {
          plan: result.user.subscription?.plan,
          status: result.user.subscription?.status,
          cancelAtPeriodEnd: result.user.subscription?.cancelAtPeriodEnd,
          willCancelAt: result.willCancelAt,
        },
      });
    } catch (error: any) {
      logger.error('Failed to cancel subscription', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: error.message,
      });
    }
  }

  /**
   * Reactivate canceled subscription
   * @route POST /api/subscription/reactivate
   */
  async reactivateSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Reactivating subscription', { userId });

      const result = await subscriptionService.reactivateSubscription(userId);

      res.status(200).json({
        success: true,
        message: 'Subscription reactivated successfully',
        data: {
          plan: result.user.subscription?.plan,
          status: result.user.subscription?.status,
          cancelAtPeriodEnd: result.user.subscription?.cancelAtPeriodEnd,
        },
      });
    } catch (error: any) {
      logger.error('Failed to reactivate subscription', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to reactivate subscription',
        error: error.message,
      });
    }
  }

  /**
   * Get payment history
   * @route GET /api/subscription/payment-history
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Getting payment history', { userId });

      // Get customer from Stripe
      const customer = await stripeService.getCustomerByUserId(userId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'No payment history found',
        });
      }

      // Get invoices
      const invoices = await stripeService.getInvoices(customer.id, 10);

      const paymentHistory = invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        invoiceUrl: invoice.hosted_invoice_url,
        receiptUrl: invoice.invoice_pdf,
      }));

      res.status(200).json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: paymentHistory,
      });
    } catch (error: any) {
      logger.error('Failed to get payment history', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error.message,
      });
    }
  }

  /**
   * Get billing information
   * @route GET /api/subscription/billing-info
   */
  async getBillingInfo(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Getting billing info', { userId });

      // Get customer from Stripe
      const customer = await stripeService.getCustomerByUserId(userId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'No billing information found',
        });
      }

      const billingInfo = {
        email: customer.email,
        name: customer.name,
        customerId: customer.id,
      };

      res.status(200).json({
        success: true,
        message: 'Billing info retrieved successfully',
        data: billingInfo,
      });
    } catch (error: any) {
      logger.error('Failed to get billing info', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get billing info',
        error: error.message,
      });
    }
  }

  /**
   * Check premium access
   * @route GET /api/subscription/premium-access
   */
  async checkPremiumAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      logger.info('Checking premium access', { userId });

      const premiumAccess = await subscriptionService.checkPremiumAccess(userId);

      res.status(200).json({
        success: true,
        message: 'Premium access checked',
        data: premiumAccess,
      });
    } catch (error: any) {
      logger.error('Failed to check premium access', {
        userId: req.user?.userId,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to check premium access',
        error: error.message,
      });
    }
  }
}

export default new SubscriptionController();