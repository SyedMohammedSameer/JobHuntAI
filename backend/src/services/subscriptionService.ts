// backend/src/services/subscriptionService.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE anything else
dotenv.config({ path: path.join(__dirname, '../../.env') });
import logger from '../utils/logger';
import User from '../models/User';
import stripeService from './stripeService';

/**
 * Subscription Management Service
 * Handles subscription lifecycle: upgrades, downgrades, cancellations
 */
class SubscriptionService {
  /**
   * Upgrade user to PREMIUM
   * @param userId - User ID
   * @param stripeSubscriptionId - Stripe subscription ID
   * @returns Updated user
   */
  async upgradeToPremium(userId: string, stripeSubscriptionId: string) {
    try {
      logger.info('Upgrading user to PREMIUM', { userId, stripeSubscriptionId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get subscription details from Stripe
      const subscription = await stripeService.retrieveSubscription(stripeSubscriptionId);

      // Initialize subscription if it doesn't exist
      if (!user.subscription) {
        user.subscription = {
          plan: 'FREE',
          status: 'active',
          cancelAtPeriodEnd: false,
          features: {
            maxResumeTailoring: 3,
            maxCoverLetters: 3,
            aiPriority: false,
            unlimitedBookmarks: false,
            advancedAnalytics: false,
            emailAlerts: false,
          },
        };
      }

      // Update user subscription
      user.subscription.plan = 'PREMIUM';
      user.subscription.status = subscription.status as any;
      user.subscription.stripeSubscriptionId = stripeSubscriptionId;
      user.subscription.currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
      user.subscription.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
      user.subscription.cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;

      // Update premium features
      user.subscription.features = {
        maxResumeTailoring: 50,
        maxCoverLetters: 50,
        aiPriority: true,
        unlimitedBookmarks: true,
        advancedAnalytics: true,
        emailAlerts: true,
      };

      await user.save();

      logger.info('User upgraded to PREMIUM successfully', {
        userId,
        subscriptionId: stripeSubscriptionId,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      });

      return user;
    } catch (error: any) {
      logger.error('Failed to upgrade user to PREMIUM', {
        userId,
        stripeSubscriptionId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to upgrade to PREMIUM: ${error.message}`);
    }
  }

  /**
   * Downgrade user to FREE
   * @param userId - User ID
   * @param reason - Reason for downgrade
   * @returns Updated user
   */
  async downgradeToFree(userId: string, reason?: string) {
    try {
      logger.info('Downgrading user to FREE', { userId, reason });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize subscription if it doesn't exist
      if (!user.subscription) {
        user.subscription = {
          plan: 'FREE',
          status: 'active',
          cancelAtPeriodEnd: false,
          features: {
            maxResumeTailoring: 3,
            maxCoverLetters: 3,
            aiPriority: false,
            unlimitedBookmarks: false,
            advancedAnalytics: false,
            emailAlerts: false,
          },
        };
      }

      // Update user subscription
      user.subscription.plan = 'FREE';
      user.subscription.status = 'active' as any;
      user.subscription.stripeSubscriptionId = undefined;
      user.subscription.currentPeriodStart = undefined;
      user.subscription.currentPeriodEnd = undefined;
      user.subscription.cancelAtPeriodEnd = false;

      // Reset to free tier features
      user.subscription.features = {
        maxResumeTailoring: 3,
        maxCoverLetters: 3,
        aiPriority: false,
        unlimitedBookmarks: false,
        advancedAnalytics: false,
        emailAlerts: false,
      };

      await user.save();

      logger.info('User downgraded to FREE successfully', {
        userId,
        reason,
      });

      return user;
    } catch (error: any) {
      logger.error('Failed to downgrade user to FREE', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to downgrade to FREE: ${error.message}`);
    }
  }

  /**
   * Cancel subscription (at period end)
   * @param userId - User ID
   * @returns Updated user and subscription
   */
  async cancelSubscription(userId: string) {
    try {
      logger.info('Canceling subscription', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Cancel in Stripe (at period end)
      const subscription = await stripeService.cancelSubscription(
        user.subscription.stripeSubscriptionId
      );

      // Update user record
      user.subscription.status = 'canceled' as any;
      user.subscription.cancelAtPeriodEnd = true;
      user.subscription.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

      await user.save();

      logger.info('Subscription canceled successfully', {
        userId,
        subscriptionId: user.subscription.stripeSubscriptionId,
        cancelAt: user.subscription.currentPeriodEnd,
      });

      return {
        user,
        subscription,
        willCancelAt: user.subscription.currentPeriodEnd,
      };
    } catch (error: any) {
      logger.error('Failed to cancel subscription', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Reactivate a canceled subscription
   * @param userId - User ID
   * @returns Updated user and subscription
   */
  async reactivateSubscription(userId: string) {
    try {
      logger.info('Reactivating subscription', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.subscription?.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      if (!user.subscription.cancelAtPeriodEnd) {
        throw new Error('Subscription is not canceled');
      }

      // Reactivate in Stripe
      const subscription = await stripeService.reactivateSubscription(
        user.subscription.stripeSubscriptionId
      );

      // Update user record
      user.subscription.status = subscription.status as any;
      user.subscription.cancelAtPeriodEnd = false;

      await user.save();

      logger.info('Subscription reactivated successfully', {
        userId,
        subscriptionId: user.subscription.stripeSubscriptionId,
      });

      return {
        user,
        subscription,
      };
    } catch (error: any) {
      logger.error('Failed to reactivate subscription', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to reactivate subscription: ${error.message}`);
    }
  }

  /**
   * Sync subscription status with Stripe
   * @param userId - User ID
   * @returns Updated user
   */
  async syncSubscriptionStatus(userId: string) {
    try {
      logger.info('Syncing subscription status', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If no Stripe subscription, ensure user is on FREE plan
      if (!user.subscription?.stripeSubscriptionId) {
        if (user.subscription?.plan === 'PREMIUM') {
          logger.warn('User marked as PREMIUM but no Stripe subscription found', { userId });
          await this.downgradeToFree(userId, 'No Stripe subscription found');
        }
        return user;
      }

      // Get current status from Stripe
      const subscription = await stripeService.retrieveSubscription(
        user.subscription.stripeSubscriptionId
      );

      // Update based on Stripe status
      if (subscription.status === 'active') {
        // Ensure user is on PREMIUM
        if (user.subscription.plan !== 'PREMIUM') {
          await this.upgradeToPremium(userId, subscription.id);
        } else {
          // Just update dates
          user.subscription.status = 'active' as any;
          user.subscription.currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
          user.subscription.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
          user.subscription.cancelAtPeriodEnd = (subscription as any).cancel_at_period_end || false;
          await user.save();
        }
      } else if (subscription.status === 'canceled' || subscription.status === 'past_due') {
        // Downgrade to FREE
        await this.downgradeToFree(userId, `Stripe status: ${subscription.status}`);
      }

      logger.info('Subscription status synced successfully', {
        userId,
        plan: user.subscription.plan,
        status: subscription.status,
      });

      return user;
    } catch (error: any) {
      logger.error('Failed to sync subscription status', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to sync subscription status: ${error.message}`);
    }
  }

  /**
   * Check if user has premium access
   * @param userId - User ID
   * @returns Premium access info
   */
  async checkPremiumAccess(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isPremium = user.subscription?.plan === 'PREMIUM';
      const isActive = user.subscription?.status === 'active';
      const hasExpired = user.subscription?.currentPeriodEnd 
        ? new Date() > user.subscription.currentPeriodEnd 
        : false;

      return {
        hasPremiumAccess: isPremium && isActive && !hasExpired,
        plan: user.subscription?.plan || 'FREE',
        status: user.subscription?.status,
        expiresAt: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
        features: user.subscription?.features || {
          maxResumeTailoring: 3,
          maxCoverLetters: 3,
          aiPriority: false,
          unlimitedBookmarks: false,
          advancedAnalytics: false,
          emailAlerts: false,
        },
      };
    } catch (error: any) {
      logger.error('Failed to check premium access', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to check premium access: ${error.message}`);
    }
  }

  /**
   * Get subscription details for a user
   * @param userId - User ID
   * @returns Subscription details
   */
  async getSubscriptionDetails(userId: string) {
    try {
      logger.info('Getting subscription details', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize default subscription if not exists
      const subscription = user.subscription || {
        plan: 'FREE',
        status: 'active',
        cancelAtPeriodEnd: false,
        features: {
          maxResumeTailoring: 3,
          maxCoverLetters: 3,
          aiPriority: false,
          unlimitedBookmarks: false,
          advancedAnalytics: false,
          emailAlerts: false,
        },
      };

      const premiumAccess = await this.checkPremiumAccess(userId);

      return {
        plan: subscription.plan || 'FREE',
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        features: subscription.features,
        premiumAccess,
      };
    } catch (error: any) {
      logger.error('Failed to get subscription details', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to get subscription details: ${error.message}`);
    }
  }
}

export default new SubscriptionService();