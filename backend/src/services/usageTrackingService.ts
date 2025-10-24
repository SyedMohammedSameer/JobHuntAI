import User from '../models/User';
import logger from '../utils/logger';
import { Types } from 'mongoose';

type FeatureType = 'resumeTailoring' | 'coverLetterGeneration';

interface UsageStats {
  resumeTailoring: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date;
    canUse: boolean;
  };
  coverLetterGeneration: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date;
    canUse: boolean;
  };
  subscriptionPlan: 'FREE' | 'PREMIUM';
}

class UsageTrackingService {
  private readonly FREE_TIER_LIMITS = {
    resumeTailoring: parseInt(process.env.FREE_TIER_RESUME_LIMIT || '3'),
    coverLetterGeneration: parseInt(process.env.FREE_TIER_COVER_LETTER_LIMIT || '3')
  };

  private readonly PREMIUM_TIER_LIMITS = {
    resumeTailoring: parseInt(process.env.PREMIUM_TIER_RESUME_LIMIT || '50'),
    coverLetterGeneration: parseInt(process.env.PREMIUM_TIER_COVER_LETTER_LIMIT || '50')
  };

  /**
   * Check if user needs a daily reset
   */
  private needsReset(lastReset: Date): boolean {
    const now = new Date();
    const lastResetDate = new Date(lastReset);
    
    // Check if it's a new day (reset at midnight)
    return (
      now.getDate() !== lastResetDate.getDate() ||
      now.getMonth() !== lastResetDate.getMonth() ||
      now.getFullYear() !== lastResetDate.getFullYear()
    );
  }

  /**
   * Get user's usage limit for a feature
   */
  private getUserLimit(user: any, feature: FeatureType): number {
    if (user.subscriptionPlan === 'PREMIUM') {
      return this.PREMIUM_TIER_LIMITS[feature];
    }
    return this.FREE_TIER_LIMITS[feature];
  }

  /**
   * Reset user's daily usage for a feature
   */
  private async resetDailyUsage(userId: string, feature: FeatureType): Promise<void> {
    try {
      const updateField = `aiUsage.${feature}`;
      
      await User.findByIdAndUpdate(
        new Types.ObjectId(userId),
        {
          $set: {
            [`${updateField}.count`]: 0,
            [`${updateField}.lastReset`]: new Date()
          }
        }
      );

      logger.info('Daily usage reset', { userId, feature });
    } catch (error: any) {
      logger.error('Error resetting daily usage:', error);
      throw new Error(`Failed to reset usage: ${error.message}`);
    }
  }

  /**
   * Check if user can use a feature
   */
  public async canUseFeature(userId: string, feature: FeatureType): Promise<{
    canUse: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
    resetsAt?: Date;
  }> {
    try {
      const user = await User.findById(new Types.ObjectId(userId));

      if (!user) {
        return {
          canUse: false,
          reason: 'User not found'
        };
      }

      const featureUsage = user.aiUsage[feature];
      const limit = this.getUserLimit(user, feature);

      // Check if reset is needed
      if (this.needsReset(featureUsage.lastReset)) {
        await this.resetDailyUsage(userId, feature);
        
        return {
          canUse: true,
          currentUsage: 0,
          limit,
          resetsAt: this.getNextResetTime()
        };
      }

      // Check if under limit
      const canUse = featureUsage.count < limit;

      if (!canUse) {
        return {
          canUse: false,
          reason: `Daily limit reached (${limit} ${feature} per day)`,
          currentUsage: featureUsage.count,
          limit,
          resetsAt: this.getNextResetTime()
        };
      }

      return {
        canUse: true,
        currentUsage: featureUsage.count,
        limit,
        resetsAt: this.getNextResetTime()
      };
    } catch (error: any) {
      logger.error('Error checking feature usage:', error);
      throw new Error(`Failed to check usage: ${error.message}`);
    }
  }

  /**
   * Increment usage count for a feature
   */
  public async incrementUsage(userId: string, feature: FeatureType): Promise<void> {
    try {
      const user = await User.findById(new Types.ObjectId(userId));

      if (!user) {
        throw new Error('User not found');
      }

      // Check if reset is needed first
      const featureUsage = user.aiUsage[feature];
      if (this.needsReset(featureUsage.lastReset)) {
        await this.resetDailyUsage(userId, feature);
      }

      // Increment usage
      const updateField = `aiUsage.${feature}`;
      
      await User.findByIdAndUpdate(
        new Types.ObjectId(userId),
        {
          $inc: { [`${updateField}.count`]: 1 },
          $set: { [`${updateField}.lastUsed`]: new Date() }
        }
      );

      logger.info('Usage incremented', { 
        userId, 
        feature, 
        newCount: featureUsage.count + 1 
      });
    } catch (error: any) {
      logger.error('Error incrementing usage:', error);
      throw new Error(`Failed to increment usage: ${error.message}`);
    }
  }

  /**
   * Get user's complete usage statistics
   */
  public async getUserUsageStats(userId: string): Promise<UsageStats> {
    try {
      const user = await User.findById(new Types.ObjectId(userId));

      if (!user) {
        throw new Error('User not found');
      }

      const resumeLimit = this.getUserLimit(user, 'resumeTailoring');
      const coverLetterLimit = this.getUserLimit(user, 'coverLetterGeneration');

      // Check and reset if needed
      let resumeCount = user.aiUsage.resumeTailoring.count;
      let coverLetterCount = user.aiUsage.coverLetterGeneration.count;

      if (this.needsReset(user.aiUsage.resumeTailoring.lastReset)) {
        await this.resetDailyUsage(userId, 'resumeTailoring');
        resumeCount = 0;
      }

      if (this.needsReset(user.aiUsage.coverLetterGeneration.lastReset)) {
        await this.resetDailyUsage(userId, 'coverLetterGeneration');
        coverLetterCount = 0;
      }

      const resetAt = this.getNextResetTime();

      return {
        resumeTailoring: {
          used: resumeCount,
          limit: resumeLimit,
          remaining: Math.max(0, resumeLimit - resumeCount),
          resetAt,
          canUse: resumeCount < resumeLimit
        },
        coverLetterGeneration: {
          used: coverLetterCount,
          limit: coverLetterLimit,
          remaining: Math.max(0, coverLetterLimit - coverLetterCount),
          resetAt,
          canUse: coverLetterCount < coverLetterLimit
        },
        subscriptionPlan: user.subscriptionPlan
      };
    } catch (error: any) {
      logger.error('Error getting usage stats:', error);
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }
  }

  /**
   * Get next reset time (midnight tonight)
   */
  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Upgrade user to premium
   */
  public async upgradeUserToPremium(userId: string, durationDays: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const user = await User.findByIdAndUpdate(
        new Types.ObjectId(userId),
        {
          $set: {
            subscriptionPlan: 'PREMIUM',
            'subscription.plan': 'PREMIUM',
            'subscription.endDate': endDate,
            'subscription.features.maxResumeTailoring': this.PREMIUM_TIER_LIMITS.resumeTailoring,
            'subscription.features.maxCoverLetters': this.PREMIUM_TIER_LIMITS.coverLetterGeneration,
            'subscription.features.aiPriority': true,
            'subscription.features.unlimitedBookmarks': true
          }
        },
        { new: true }
      );

      logger.info('User upgraded to premium', { userId, endDate });
      return user;
    } catch (error: any) {
      logger.error('Error upgrading user:', error);
      throw new Error(`Failed to upgrade user: ${error.message}`);
    }
  }

  /**
   * Downgrade user to free
   */
  public async downgradeUserToFree(userId: string): Promise<any> {
    try {
      const user = await User.findByIdAndUpdate(
        new Types.ObjectId(userId),
        {
          $set: {
            subscriptionPlan: 'FREE',
            'subscription.plan': 'FREE',
            'subscription.endDate': null,
            'subscription.features.maxResumeTailoring': this.FREE_TIER_LIMITS.resumeTailoring,
            'subscription.features.maxCoverLetters': this.FREE_TIER_LIMITS.coverLetterGeneration,
            'subscription.features.aiPriority': false,
            'subscription.features.unlimitedBookmarks': false
          }
        },
        { new: true }
      );

      logger.info('User downgraded to free', { userId });
      return user;
    } catch (error: any) {
      logger.error('Error downgrading user:', error);
      throw new Error(`Failed to downgrade user: ${error.message}`);
    }
  }

  /**
   * Reset all users' daily usage (cron job)
   */
  public async resetAllUsersDaily(): Promise<number> {
    try {
      const result = await User.updateMany(
        {},
        {
          $set: {
            'aiUsage.resumeTailoring.count': 0,
            'aiUsage.resumeTailoring.lastReset': new Date(),
            'aiUsage.coverLetterGeneration.count': 0,
            'aiUsage.coverLetterGeneration.lastReset': new Date()
          }
        }
      );

      logger.info('All users daily usage reset', { 
        modifiedCount: result.modifiedCount 
      });

      return result.modifiedCount;
    } catch (error: any) {
      logger.error('Error resetting all users daily usage:', error);
      return 0;
    }
  }

  /**
   * Get service health status
   */
  public getHealthStatus(): {
    status: string;
    limits: {
      free: typeof this.FREE_TIER_LIMITS;
      premium: typeof this.PREMIUM_TIER_LIMITS;
    };
  } {
    return {
      status: 'operational',
      limits: {
        free: this.FREE_TIER_LIMITS,
        premium: this.PREMIUM_TIER_LIMITS
      }
    };
  }
}

// Export singleton instance
export default new UsageTrackingService();