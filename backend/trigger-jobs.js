// Quick script to manually trigger job aggregation
// Run with: node backend/trigger-jobs.js

require('dotenv').config();
const mongoose = require('mongoose');

async function triggerJobAggregation() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the aggregator
    const jobAggregator = require('./src/services/jobAggregator').default;

    console.log('📡 Starting job aggregation from all sources...');
    console.log('   This will fetch from:');
    console.log('   - USAJOBS');
    console.log('   - RemoteOK');
    console.log('   - Arbeitnow');
    console.log('   - Careerjet');
    console.log('   - Jooble');
    console.log('   - Handshake (mock data)');
    console.log('   - LinkedIn (entry, mid, senior levels)');
    console.log('\n⏳ Please wait... This may take 2-5 minutes.\n');

    const startTime = Date.now();
    const totalJobs = await jobAggregator.aggregateJobs();
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ JOB AGGREGATION COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total jobs fetched: ${totalJobs}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log('═══════════════════════════════════════\n');

    console.log('🎉 Success! You can now:');
    console.log('   1. Refresh your Jobs page to see all jobs');
    console.log('   2. Check University Jobs page for student jobs\n');

    await mongoose.disconnect();
    console.log('👋 Done! Database connection closed.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during job aggregation:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run it!
triggerJobAggregation();
