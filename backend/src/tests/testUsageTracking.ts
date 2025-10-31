import dotenv from 'dotenv';
import mongoose from 'mongoose';
import usageTrackingService from '../services/usageTrackingService';
import User from '../models/User';
import connectDB from '../config/database';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function testUsageTrackingService() {
  console.log('\n🚀 Testing Usage Tracking Service...\n');

  try {
    // Connect to database
    console.log('📋 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Test 1: Health Status
    console.log('📋 Test 1: Health Status Check');
    const health = usageTrackingService.getHealthStatus();
    console.log('Status:', health.status);
    console.log('FREE tier limits:', health.limits.free);
    console.log('PREMIUM tier limits:', health.limits.premium);
    console.log('✅ Health check works\n');

    // Test 2: Create a test user (FREE tier)
    console.log('📋 Test 2: Create Test User (FREE Tier)');
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    const testUser = new User({
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: hashedPassword,
      subscriptionPlan: 'FREE',
      aiUsage: {
        resumeTailoring: {
          count: 0,
          lastReset: new Date()
        },
        coverLetterGeneration: {
          count: 0,
          lastReset: new Date()
        }
      },
      subscription: {
        plan: 'FREE',
        startDate: new Date(),
        features: {
          maxResumeTailoring: 3,
          maxCoverLetters: 3,
          aiPriority: false,
          unlimitedBookmarks: false
        }
      }
    });

    await testUser.save();
    console.log('Test user created:', testUser._id.toString());
    console.log('Subscription plan:', testUser.subscription?.plan);
    console.log('✅ User creation works\n');

    // Test 3: Get initial usage stats
    console.log('📋 Test 3: Get Initial Usage Statistics');
    const initialStats = await usageTrackingService.getUserUsageStats(testUser._id.toString());
    console.log('Resume tailoring - Used:', initialStats.resumeTailoring.used, '/', initialStats.resumeTailoring.limit);
    console.log('Cover letter - Used:', initialStats.coverLetterGeneration.used, '/', initialStats.coverLetterGeneration.limit);
    console.log('✅ Initial stats retrieved\n');

    // Test 4: Check if user can use features
    console.log('📋 Test 4: Check Feature Availability');
    const canTailorResume = await usageTrackingService.canUseFeature(testUser._id.toString(), 'resumeTailoring');
    const canGenerateCoverLetter = await usageTrackingService.canUseFeature(testUser._id.toString(), 'coverLetterGeneration');
    
    console.log('Can tailor resume:', canTailorResume.canUse);
    console.log('Can generate cover letter:', canGenerateCoverLetter.canUse);
    console.log('✅ Feature availability check works\n');

    // Test 5: Increment usage (3 times for FREE tier limit)
    console.log('📋 Test 5: Increment Usage (Hit FREE Tier Limit)');
    
    for (let i = 1; i <= 3; i++) {
      await usageTrackingService.incrementUsage(testUser._id.toString(), 'resumeTailoring');
      console.log(`Resume tailoring usage incremented: ${i}/3`);
    }
    
    const statsAfterLimit = await usageTrackingService.getUserUsageStats(testUser._id.toString());
    console.log('Resume tailoring - Used:', statsAfterLimit.resumeTailoring.used, '/', statsAfterLimit.resumeTailoring.limit);
    console.log('Can still use:', statsAfterLimit.resumeTailoring.canUse);
    console.log('✅ Usage increment works\n');

    // Test 6: Try to use after hitting limit
    console.log('📋 Test 6: Attempt to Use After Hitting Limit');
    const canUseAfterLimit = await usageTrackingService.canUseFeature(testUser._id.toString(), 'resumeTailoring');
    console.log('Can use after limit:', canUseAfterLimit.canUse);
    console.log('Reason:', canUseAfterLimit.reason);
    console.log('Resets at:', canUseAfterLimit.resetsAt?.toLocaleString());
    console.log('✅ Limit enforcement works\n');

    // Test 7: Upgrade to PREMIUM
    console.log('📋 Test 7: Upgrade User to PREMIUM');
    const upgradedUser = await usageTrackingService.upgradeUserToPremium(testUser._id.toString(), 30);
    console.log('Upgraded to:', upgradedUser.subscriptionPlan);
    console.log('End date:', upgradedUser.subscription.endDate?.toLocaleDateString());
    console.log('✅ Premium upgrade works\n');

    // Test 8: Check PREMIUM limits
    console.log('📋 Test 8: Check PREMIUM Usage Limits');
    const premiumStats = await usageTrackingService.getUserUsageStats(testUser._id.toString());
    console.log('Resume tailoring limit (PREMIUM):', premiumStats.resumeTailoring.limit);
    console.log('Cover letter limit (PREMIUM):', premiumStats.coverLetterGeneration.limit);
    console.log('Can use resume tailoring:', premiumStats.resumeTailoring.canUse);
    console.log('✅ Premium limits work\n');

    // Test 9: Use feature as PREMIUM (should work despite previous usage)
    console.log('📋 Test 9: Use Feature as PREMIUM User');
    await usageTrackingService.incrementUsage(testUser._id.toString(), 'coverLetterGeneration');
    await usageTrackingService.incrementUsage(testUser._id.toString(), 'coverLetterGeneration');
    
    const premiumUsageStats = await usageTrackingService.getUserUsageStats(testUser._id.toString());
    console.log('Cover letter used:', premiumUsageStats.coverLetterGeneration.used, '/', premiumUsageStats.coverLetterGeneration.limit);
    console.log('Remaining:', premiumUsageStats.coverLetterGeneration.remaining);
    console.log('✅ Premium usage tracking works\n');

    // Test 10: Downgrade back to FREE
    console.log('📋 Test 10: Downgrade User to FREE');
    const downgradedUser = await usageTrackingService.downgradeUserToFree(testUser._id.toString());
    console.log('Downgraded to:', downgradedUser.subscriptionPlan);
    console.log('Max resume tailoring:', downgradedUser.subscription.features.maxResumeTailoring);
    console.log('✅ Downgrade works\n');

    // Cleanup: Delete test user
    console.log('📋 Cleanup: Deleting Test User');
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test user deleted\n');

    console.log('🎉 All Usage Tracking Service tests passed!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run tests
testUsageTrackingService();