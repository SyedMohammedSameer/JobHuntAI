// backend/src/routes/webhookRoutes.ts

import express from 'express';
import webhookController from '../controllers/webhookController';

const router = express.Router();

/**
 * Webhook Routes
 * 
 * IMPORTANT: Webhook routes MUST use raw body parser
 * This is configured in server.ts before JSON parser
 */

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 * 
 * Events handled:
 * - checkout.session.completed: Customer completed payment
 * - customer.subscription.created: New subscription started
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Recurring payment successful
 * - invoice.payment_failed: Recurring payment failed
 * - customer.subscription.trial_will_end: Trial ending soon
 */
router.post('/stripe', webhookController.handleStripeWebhook.bind(webhookController));

export default router;