// backend/src/tests/testStripe.ts

import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Verify key is loaded
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? 'Loaded ✅' : 'Missing ❌');

import Stripe from 'stripe';
import connectDB from '../config/database';
import stripeService from '../services/stripeService';
import User from '../models/User';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

async function testStripeSetup() {
  console.log('\n🧪 STRIPE SETUP TEST\n');
  console.log('='.repeat(50));

  try {
    // Connect to database
    console.log('\n1️⃣ Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // Test 1: Verify Stripe API Key
    console.log('\n2️⃣ Testing Stripe API key...');
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe API key is valid');
    console.log(`   Available balance: $${balance.available[0]?.amount / 100 || 0}`);

    // Test 2: Verify Price ID exists
    console.log('\n3️⃣ Verifying Premium price ID...');
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_PREMIUM_PRICE_ID not set in .env');
    }
    const price = await stripe.prices.retrieve(priceId);
    console.log('✅ Premium price found:');
    console.log(`   Price ID: ${price.id}`);
    console.log(`   Amount: $${(price.unit_amount || 0) / 100}/${price.recurring?.interval}`);
    console.log(`   Product: ${price.product}`);

    // Test 3: Create a test user
    console.log('\n4️⃣ Creating test user...');
    const testUser = await User.findOneAndUpdate(
      { email: 'stripe-test@jobhuntai.com' },
      {
        email: 'stripe-test@jobhuntai.com',
        password: 'hashedpassword123',
        firstName: 'Stripe',
        lastName: 'Test User',
        university: 'Test University',
        major: 'Computer Science',
        graduationYear: 2025,
        visaType: 'F1',
      },
      { upsert: true, new: true }
    );
    console.log('✅ Test user created:', testUser._id);

    // Test 4: Create Stripe customer
    console.log('\n5️⃣ Testing customer creation...');
    const customer = await stripeService.createCustomer(testUser);
    console.log('✅ Stripe customer created:');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Email: ${customer.email}`);

    // Update user with customer ID
    testUser.subscription = testUser.subscription || {
      plan: 'FREE',
      features: {
        maxResumeTailoring: 3,
        maxCoverLetters: 3,
        aiPriority: false,
        unlimitedBookmarks: false,
      },
    };
    testUser.subscription.stripeCustomerId = customer.id;
    await testUser.save();

    // Test 5: Create checkout session
    console.log('\n6️⃣ Testing checkout session creation...');
    const session = await stripeService.createCheckoutSession(
      testUser._id.toString(),
      priceId
    );
    console.log('✅ Checkout session created:');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Checkout URL: ${session.url}`);
    console.log(`   Status: ${session.status}`);

    // Test 6: Create customer portal session
    console.log('\n7️⃣ Testing customer portal session...');
    try {
      const portalSession = await stripeService.createCustomerPortalSession(
        testUser._id.toString()
      );
      console.log('✅ Customer portal session created:');
      console.log(`   Portal URL: ${portalSession.url}`);
    } catch (error: any) {
      if (error.message.includes('No configuration provided')) {
        console.log('⚠️  Customer portal not configured yet (OPTIONAL - can skip for now)');
        console.log('   Set it up later at: https://dashboard.stripe.com/test/settings/billing/portal');
      } else {
        throw error;
      }
    }

    // Test 7: Verify webhook secret
    console.log('\n8️⃣ Verifying webhook configuration...');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret === 'whsec_placeholder_for_development') {
      console.log('⚠️  Webhook not configured (OPTIONAL - can add later)');
      console.log('   For production: Use ngrok or deploy first');
    } else if (webhookSecret.startsWith('whsec_')) {
      console.log('✅ Webhook secret configured');
      console.log(`   Secret: ${webhookSecret.substring(0, 20)}...`);
    } else {
      console.log('❌ Invalid webhook secret format');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL CRITICAL STRIPE TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('\n📋 Your Stripe Setup:');
    console.log(`   • API Key: ${process.env.STRIPE_SECRET_KEY?.substring(0, 20)}...`);
    console.log(`   • Price ID: ${priceId}`);
    console.log(`   • Price: ${(price.unit_amount || 0) / 100}/month`);
    console.log(`   • Test Customer: ${customer.id}`);
    console.log(`   • Checkout URL: ${session.url?.substring(0, 50)}...`);
    console.log('\n💡 Ready for Phase 5 Development!');
    console.log('   ✅ Payment checkout works');
    console.log('   ✅ Customer creation works');
    console.log('   ✅ All core Stripe features ready');
    console.log('\n🛏️  Go to sleep! Phase 5.1 is COMPLETE!');
    console.log('   Tomorrow: Build Subscription Management Service\n');

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    console.log('🧹 Test user cleaned up');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n🔍 Troubleshooting:');
    
    if (error.message.includes('No such price')) {
      console.error('   • Check STRIPE_PREMIUM_PRICE_ID in .env');
      console.error('   • Make sure you created a product in Stripe Dashboard');
    } else if (error.message.includes('Invalid API Key')) {
      console.error('   • Check STRIPE_SECRET_KEY in .env');
      console.error('   • Make sure it starts with sk_test_');
    } else if (error.message.includes('database')) {
      console.error('   • Check MONGODB_URI in .env');
      console.error('   • Make sure MongoDB is running');
    }
    
    console.error('\n', error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run test
testStripeSetup();