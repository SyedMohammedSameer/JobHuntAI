// backend/src/services/stripeService.ts

import Stripe from 'stripe';
import logger from '../utils/logger';
import User from '../models/User';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

/**
 * Stripe Service
 * Handles all Stripe payment operations and customer management
 */
class StripeService {
  /**
   * Create a checkout session for premium subscription
   * @param userId - User ID
   * @param priceId - Stripe price ID for premium plan
   * @returns Checkout session
   */
  async createCheckoutSession(
    userId: string,
    priceId: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      logger.info('Creating checkout session', { userId, priceId });

      // Get or create Stripe customer
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let customerId = user.subscription?.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;

        // Update user with customer ID
        user.subscription = user.subscription || {
          plan: 'FREE',
          features: {
            maxResumeTailoring: 3,
            maxCoverLetters: 3,
            aiPriority: false,
            unlimitedBookmarks: false,
          },
        };
        user.subscription.stripeCustomerId = customerId;
        await user.save();

        logger.info('Created Stripe customer', { userId, customerId });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.STRIPE_CANCEL_URL,
        metadata: {
          userId: userId,
        },
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      logger.info('Checkout session created successfully', {
        userId,
        sessionId: session.id,
        customerId,
      });

      return session;
    } catch (error: any) {
      logger.error('Failed to create checkout session', {
        userId,
        priceId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Create a customer portal session for subscription management
   * @param userId - User ID
   * @returns Portal session
   */
  async createCustomerPortalSession(
    userId: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      logger.info('Creating customer portal session', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const customerId = user.subscription?.stripeCustomerId;
      if (!customerId) {
        throw new Error('No Stripe customer found for this user');
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: process.env.FRONTEND_URL + '/dashboard',
      });

      logger.info('Customer portal session created successfully', {
        userId,
        sessionId: session.id,
        customerId,
      });

      return session;
    } catch (error: any) {
      logger.error('Failed to create customer portal session', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(
        `Failed to create customer portal session: ${error.message}`
      );
    }
  }

  /**
   * Get Stripe customer by user ID
   * @param userId - User ID
   * @returns Stripe customer or null
   */
  async getCustomerByUserId(userId: string): Promise<Stripe.Customer | null> {
    try {
      logger.info('Getting Stripe customer', { userId });

      const user = await User.findById(userId);
      if (!user || !user.subscription?.stripeCustomerId) {
        logger.info('No Stripe customer found', { userId });
        return null;
      }

      const customer = await stripe.customers.retrieve(
        user.subscription.stripeCustomerId
      );

      if (customer.deleted) {
        logger.warn('Stripe customer was deleted', {
          userId,
          customerId: user.subscription.stripeCustomerId,
        });
        return null;
      }

      logger.info('Stripe customer retrieved successfully', {
        userId,
        customerId: customer.id,
      });

      return customer as Stripe.Customer;
    } catch (error: any) {
      logger.error('Failed to get Stripe customer', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get Stripe customer: ${error.message}`);
    }
  }

  /**
   * Create a new Stripe customer
   * @param user - User document
   * @returns Stripe customer
   */
  async createCustomer(user: any): Promise<Stripe.Customer> {
    try {
      logger.info('Creating Stripe customer', { userId: user._id });

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: {
          userId: user._id.toString(),
        },
      });

      logger.info('Stripe customer created successfully', {
        userId: user._id,
        customerId: customer.id,
      });

      return customer;
    } catch (error: any) {
      logger.error('Failed to create Stripe customer', {
        userId: user._id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  /**
   * Retrieve a subscription by ID
   * @param subscriptionId - Stripe subscription ID
   * @returns Subscription
   */
  async retrieveSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Retrieving subscription', { subscriptionId });

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      logger.info('Subscription retrieved successfully', {
        subscriptionId,
        status: subscription.status,
      });

      return subscription;
    } catch (error: any) {
      logger.error('Failed to retrieve subscription', {
        subscriptionId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to retrieve subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription (at period end)
   * @param subscriptionId - Stripe subscription ID
   * @returns Updated subscription
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Canceling subscription', { subscriptionId });

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      logger.info('Subscription canceled successfully', {
        subscriptionId,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      return subscription;
    } catch (error: any) {
      logger.error('Failed to cancel subscription', {
        subscriptionId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Reactivate a canceled subscription
   * @param subscriptionId - Stripe subscription ID
   * @returns Updated subscription
   */
  async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Reactivating subscription', { subscriptionId });

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      logger.info('Subscription reactivated successfully', {
        subscriptionId,
        status: subscription.status,
      });

      return subscription;
    } catch (error: any) {
      logger.error('Failed to reactivate subscription', {
        subscriptionId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to reactivate subscription: ${error.message}`);
    }
  }

  /**
   * Get payment history for a customer
   * @param customerId - Stripe customer ID
   * @param limit - Number of payments to retrieve
   * @returns List of payment intents
   */
  async getPaymentHistory(
    customerId: string,
    limit: number = 10
  ): Promise<Stripe.PaymentIntent[]> {
    try {
      logger.info('Getting payment history', { customerId, limit });

      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit,
      });

      logger.info('Payment history retrieved successfully', {
        customerId,
        count: paymentIntents.data.length,
      });

      return paymentIntents.data;
    } catch (error: any) {
      logger.error('Failed to get payment history', {
        customerId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get payment history: ${error.message}`);
    }
  }

  /**
   * Get invoices for a customer
   * @param customerId - Stripe customer ID
   * @param limit - Number of invoices to retrieve
   * @returns List of invoices
   */
  async getInvoices(
    customerId: string,
    limit: number = 10
  ): Promise<Stripe.Invoice[]> {
    try {
      logger.info('Getting invoices', { customerId, limit });

      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
      });

      logger.info('Invoices retrieved successfully', {
        customerId,
        count: invoices.data.length,
      });

      return invoices.data;
    } catch (error: any) {
      logger.error('Failed to get invoices', {
        customerId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get invoices: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param payload - Raw request body
   * @param signature - Stripe signature header
   * @returns Verified Stripe event
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info('Webhook event verified', {
        eventId: event.id,
        eventType: event.type,
      });

      return event;
    } catch (error: any) {
      logger.error('Webhook signature verification failed', {
        error: error.message,
      });
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}

export default new StripeService();