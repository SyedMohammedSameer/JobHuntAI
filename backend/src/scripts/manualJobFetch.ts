// Manual Job Fetch Script
// Run this to immediately fetch jobs from all APIs

import dotenv from 'dotenv';
import connectDB from '../config/database';
import jobAggregator from '../services/jobAggregator';
import logger from '../utils/logger';

dotenv.config();

async function fetchJobs() {
  try {
    logger.info('🚀 Manual job fetch started...');

    // Connect to database
    await connectDB();
    logger.info('✅ Connected to MongoDB');

    // Fetch jobs from all APIs
    logger.info('📡 Fetching jobs from all APIs...');
    const totalJobs = await jobAggregator.aggregateJobs();

    logger.info(`✅ Job fetch complete! Total jobs fetched: ${totalJobs}`);
    logger.info('\nYou can now view these jobs in the Jobs listing page.');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error fetching jobs:', error);
    process.exit(1);
  }
}

fetchJobs();
