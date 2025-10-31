// Script to add MongoDB text indexes for better search performance
import dotenv from 'dotenv';
import connectDB from '../config/database';
import Job from '../models/Job';
import logger from '../utils/logger';

dotenv.config();

async function addTextIndexes() {
  try {
    logger.info('🔍 Adding text indexes to Job collection...');

    // Connect to database
    await connectDB();
    logger.info('✅ Connected to MongoDB');

    // Drop existing text index if it exists
    try {
      await Job.collection.dropIndex('title_text_description_text_company_text');
      logger.info('Dropped existing text index');
    } catch (error) {
      // Index might not exist, that's okay
      logger.info('No existing text index to drop');
    }

    // Create compound text index on title (highest weight), company, and description
    await Job.collection.createIndex(
      {
        title: 'text',
        company: 'text',
        description: 'text'
      },
      {
        weights: {
          title: 10,        // Highest priority - matches in job title
          company: 5,       // Medium priority - matches in company name
          description: 1    // Lowest priority - matches in description
        },
        name: 'job_search_text_index',
        default_language: 'english'
      }
    );

    logger.info('✅ Text index created successfully!');
    logger.info('   - title: weight 10 (highest priority)');
    logger.info('   - company: weight 5 (medium priority)');
    logger.info('   - description: weight 1 (lowest priority)');

    // Create additional indexes for common filters
    await Job.collection.createIndex({ location: 1 });
    logger.info('✅ Location index created');

    await Job.collection.createIndex({ remote: 1 });
    logger.info('✅ Remote index created');

    await Job.collection.createIndex({ 'visaSponsorship.h1b': 1 });
    await Job.collection.createIndex({ 'visaSponsorship.opt': 1 });
    await Job.collection.createIndex({ 'visaSponsorship.stemOpt': 1 });
    logger.info('✅ Visa sponsorship indexes created');

    await Job.collection.createIndex({ employmentType: 1 });
    logger.info('✅ Employment type index created');

    await Job.collection.createIndex({ source: 1 });
    logger.info('✅ Source index created');

    await Job.collection.createIndex({ postedDate: -1 });
    logger.info('✅ Posted date index created');

    // Compound index for common queries
    await Job.collection.createIndex({ isActive: 1, postedDate: -1 });
    logger.info('✅ Compound index (isActive + postedDate) created');

    logger.info('\n🎉 All indexes created successfully!');
    logger.info('Search performance should be significantly improved.');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

addTextIndexes();
