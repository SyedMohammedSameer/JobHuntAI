// backend/src/controllers/webhookController.ts

import { Request, Response } from 'express';
import Stripe from 'stripe';
import logger from '../utils/logger';
import stripeService from '../services/stripeService';
import subscriptionService from '../services/subscriptionService';
import User from '../models/User';

/**
 * Webhook Controller
 * Handles Stripe webhook events for subscription management
 */
class WebhookController {
  /**
   * Handle Stripe webhook events
   * Endpoint: POST /api/webhooks/stripe
   */
  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      logger.error('Webhook signature missing');
      return res.status(400).json({
        success: false,
        message: 'Webhook signature missing',
      });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripeService.constructWebhookEvent(req.body, signature);
      
      logger.info('Webhook event received', {
        eventId: event.id,
        eventType: event.type,
      });
    } catch (error: any) {
      logger.error('Webhook signature verification failed', {
        error: error.message,
      });
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed',
      });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event);
          break;

        default:
          logger.info('Unhandled webhook event type', {
            eventType: event.type,
          });
      }

      // Return success response
      res.status(200).json({
        success: true,
        received: true,
      });
    } catch (error: any) {
      logger.error('Error processing webhook event', {
        eventId: event.id,
        eventType: event.type,
        error: error.message,
        stack: error.stack,
      });

      // Still return 200 to acknowledge receipt
      res.status(200).json({
        success: false,
        received: true,
        error: error.message,
      });
    }
  }

  /**
   * Handle checkout.session.completed event
   * Triggered when customer completes payment
   */
  private async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;

    logger.info('Processing checkout session completed', {
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
    });

    try {
      // Get user ID from metadata
      const userId = session.metadata?.userId;
      if (!userId) {
        logger.error('User ID not found in checkout session metadata', {
          sessionId: session.id,
        });
        return;
      }

      // Check if payment was successful
      if (session.payment_status !== 'paid') {
        logger.warn('Checkout session not paid', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });
        return;
      }

      // Upgrade user to premium
      if (session.subscription) {
        await subscriptionService.upgradeToPremium(
          userId,
          session.subscription as string
        );

        logger.info('User upgraded to premium after checkout', {
          userId,
          sessionId: session.id,
          subscriptionId: session.subscription,
        });
      }
    } catch (error: any) {
      logger.error('Failed to process checkout session completed', {
        sessionId: session.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.created event
   * Triggered when new subscription is created
   */
  private async handleSubscriptionCreated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    logger.info('Processing subscription created', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    try {
      // Get user ID from metadata
      const userId = subscription.metadata?.userId;
      if (!userId) {
        // Try to find user by Stripe customer ID
        const user = await User.findOne({
          'subscription.stripeCustomerId': subscription.customer,
        });

        if (user) {
          await subscriptionService.upgradeToPremium(user._id.toString(), subscription.id);
          logger.info('User upgraded to premium via subscription created', {
            userId: user._id,
            subscriptionId: subscription.id,
          });
        } else {
          logger.error('User not found for subscription created', {
            subscriptionId: subscription.id,
            customerId: subscription.customer,
          });
        }
        return;
      }

      // Upgrade user to premium
      await subscriptionService.upgradeToPremium(userId, subscription.id);

      logger.info('User upgraded to premium via subscription created', {
        userId,
        subscriptionId: subscription.id,
      });
    } catch (error: any) {
      logger.error('Failed to process subscription created', {
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.updated event
   * Triggered when subscription is modified
   */
  private async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    logger.info('Processing subscription updated', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    try {
      // Find user by Stripe subscription ID
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': subscription.id,
      });

      if (!user) {
        logger.error('User not found for subscription update', {
          subscriptionId: subscription.id,
        });
        return;
      }

      // Sync subscription status
      await subscriptionService.syncSubscriptionStatus(user._id.toString());

      logger.info('Subscription synced after update', {
        userId: user._id,
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } catch (error: any) {
      logger.error('Failed to process subscription updated', {
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.deleted event
   * Triggered when subscription is canceled
   */
  private async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    logger.info('Processing subscription deleted', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });

    try {
      // Find user by Stripe subscription ID
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': subscription.id,
      });

      if (!user) {
        logger.error('User not found for subscription deletion', {
          subscriptionId: subscription.id,
        });
        return;
      }

      // Downgrade user to FREE
      await subscriptionService.downgradeToFree(
        user._id.toString(),
        'Subscription deleted in Stripe'
      );

      logger.info('User downgraded to FREE after subscription deletion', {
        userId: user._id,
        subscriptionId: subscription.id,
      });
    } catch (error: any) {
      logger.error('Failed to process subscription deleted', {
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   * Triggered when recurring payment succeeds
   */
  private async handleInvoicePaymentSucceeded(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    logger.info('Processing invoice payment succeeded', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
    });

    try {
      if (!invoice.subscription) {
        logger.warn('Invoice has no subscription', {
          invoiceId: invoice.id,
        });
        return;
      }

      // Find user by Stripe subscription ID
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': invoice.subscription,
      });

      if (!user) {
        logger.error('User not found for invoice payment', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
        });
        return;
      }

      // Ensure user is still on PREMIUM and update period
      await subscriptionService.syncSubscriptionStatus(user._id.toString());

      logger.info('Subscription synced after successful payment', {
        userId: user._id,
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
      });
    } catch (error: any) {
      logger.error('Failed to process invoice payment succeeded', {
        invoiceId: invoice.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle invoice.payment_failed event
   * Triggered when recurring payment fails
   */
  private async handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    logger.info('Processing invoice payment failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
    });

    try {
      if (!invoice.subscription) {
        logger.warn('Invoice has no subscription', {
          invoiceId: invoice.id,
        });
        return;
      }

      // Find user by Stripe subscription ID
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': invoice.subscription,
      });

      if (!user) {
        logger.error('User not found for failed payment', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
        });
        return;
      }

      // Update subscription status to past_due
      if (user.subscription) {
        user.subscription.status = 'past_due' as any;
        await user.save();
      }

      logger.warn('User subscription marked as past_due', {
        userId: user._id,
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
      });

      // TODO: Send email notification to user about failed payment
    } catch (error: any) {
      logger.error('Failed to process invoice payment failed', {
        invoiceId: invoice.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle customer.subscription.trial_will_end event
   * Triggered when trial is about to end (3 days before)
   */
  private async handleTrialWillEnd(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    logger.info('Processing trial will end', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      trialEnd: subscription.trial_end,
    });

    try {
      // Find user by Stripe subscription ID
      const user = await User.findOne({
        'subscription.stripeSubscriptionId': subscription.id,
      });

      if (!user) {
        logger.error('User not found for trial ending', {
          subscriptionId: subscription.id,
        });
        return;
      }

      logger.info('Trial ending soon for user', {
        userId: user._id,
        subscriptionId: subscription.id,
        trialEnd: subscription.trial_end,
      });

      // TODO: Send email notification about trial ending
    } catch (error: any) {
      logger.error('Failed to process trial will end', {
        subscriptionId: subscription.id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export default new WebhookController();