// backend/src/scripts/manualUpgrade.js
// JavaScript version - Fixed date handling

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  email: String,
  subscription: {
    plan: String,
    status: String,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean,
    features: {
      maxResumeTailoring: Number,
      maxCoverLetters: Number,
      aiPriority: Boolean,
      unlimitedBookmarks: Boolean,
      advancedAnalytics: Boolean,
      emailAlerts: Boolean,
    },
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function manualUpgrade() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobhuntai';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user email from command line
    const userEmail = process.argv[2];
    if (!userEmail) {
      console.error('❌ Please provide user email as argument');
      console.log('Usage: node src/scripts/manualUpgrade.js user@example.com');
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log('\n📋 Current User Status:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Plan: ${user.subscription?.plan || 'FREE'}`);
    console.log(`   Stripe Customer ID: ${user.subscription?.stripeCustomerId || 'None'}`);

    // Get Stripe customer ID
    const stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      console.error('❌ User has no Stripe customer ID');
      process.exit(1);
    }

    // Get latest subscription from Stripe
    console.log('\n🔍 Fetching Stripe subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
      status: 'all',
    });

    if (subscriptions.data.length === 0) {
      console.error('❌ No subscriptions found in Stripe');
      console.log('\n💡 The checkout session didn\'t create a subscription.');
      process.exit(1);
    }

    const subscription = subscriptions.data[0];
    
    console.log('\n📦 Stripe Subscription Found:');
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    
    // Debug: Log the subscription object keys
    console.log('\n🔍 Subscription Properties:');
    console.log(`   Keys: ${Object.keys(subscription).join(', ')}`);
    
    // Try different property names
    const currentPeriodStart = subscription.current_period_start || subscription.currentPeriodStart;
    const currentPeriodEnd = subscription.current_period_end || subscription.currentPeriodEnd;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || subscription.cancelAtPeriodEnd;
    
    console.log(`   current_period_start: ${currentPeriodStart}`);
    console.log(`   current_period_end: ${currentPeriodEnd}`);
    console.log(`   cancel_at_period_end: ${cancelAtPeriodEnd}`);
    
    if (!currentPeriodStart || !currentPeriodEnd) {
      console.error('\n❌ Subscription is missing period dates');
      console.log('Full subscription object:', JSON.stringify(subscription, null, 2));
      process.exit(1);
    }
    
    const startDate = new Date(currentPeriodStart * 1000);
    const endDate = new Date(currentPeriodEnd * 1000);
    
    console.log(`   Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Upgrade user
    console.log('\n⬆️  Upgrading user to PREMIUM...');
    
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

    user.subscription.plan = 'PREMIUM';
    user.subscription.status = subscription.status;
    user.subscription.stripeSubscriptionId = subscription.id;
    user.subscription.currentPeriodStart = startDate;
    user.subscription.currentPeriodEnd = endDate;
    user.subscription.cancelAtPeriodEnd = cancelAtPeriodEnd || false;
    user.subscription.features = {
      maxResumeTailoring: 50,
      maxCoverLetters: 50,
      aiPriority: true,
      unlimitedBookmarks: true,
      advancedAnalytics: true,
      emailAlerts: true,
    };

    await user.save();

    console.log('\n✅ User upgraded successfully!');
    console.log('\n📋 New User Status:');
    console.log(`   Plan: ${user.subscription.plan}`);
    console.log(`   Status: ${user.subscription.status}`);
    console.log(`   Subscription ID: ${user.subscription.stripeSubscriptionId}`);
    console.log(`   Max Resumes: ${user.subscription.features.maxResumeTailoring}`);
    console.log(`   Max Cover Letters: ${user.subscription.features.maxCoverLetters}`);
    console.log(`   AI Priority: ${user.subscription.features.aiPriority}`);
    console.log(`   Advanced Analytics: ${user.subscription.features.advancedAnalytics}`);
    console.log(`   Email Alerts: ${user.subscription.features.emailAlerts}`);
    console.log(`   Period End: ${user.subscription.currentPeriodEnd.toISOString()}`);
    console.log('\n🎉 You now have PREMIUM access!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

manualUpgrade();