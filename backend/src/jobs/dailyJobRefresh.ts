// backend/src/jobs/dailyJobRefresh.ts

import cron from 'node-cron';
import jobAggregator from '../services/jobAggregator';
import jobCleanupService from '../services/jobCleanup';
import logger from '../utils/logger';

/**
 * Daily Job Refresh Cron System
 * Automatically fetches fresh jobs and cleans up old ones
 */

interface RefreshStats {
  timestamp: Date;
  totalJobsFetched: number;
  newJobsAdded: number;
  jobsUpdated: number;
  jobsCleaned: number;
  sources: {
    [key: string]: {
      fetched: number;
      errors: string[];
    };
  };
  duration: number;
  success: boolean;
  errors: string[];
}

class DailyJobRefreshService {
  private isRunning: boolean = false;
  private lastRefreshStats: RefreshStats | null = null;
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Initialize and start the cron job
   */
  start(): void {
    const cronSchedule = process.env.JOB_REFRESH_CRON || '0 2 * * *'; // Default: 2 AM daily
    const enableCron = process.env.ENABLE_DAILY_JOB_REFRESH === 'true';

    if (!enableCron) {
      logger.info('Daily job refresh is disabled. Set ENABLE_DAILY_JOB_REFRESH=true to enable.');
      return;
    }

    // Validate cron expression
    if (!cron.validate(cronSchedule)) {
      logger.error(`Invalid cron expression: ${cronSchedule}`);
      return;
    }

    logger.info(`Scheduling daily job refresh with cron: ${cronSchedule}`);

    this.cronJob = cron.schedule(cronSchedule, async () => {
      await this.runDailyRefresh();
    });

    logger.info('✅ Daily job refresh cron scheduled successfully');
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Daily job refresh cron stopped');
    }
  }

  /**
   * Run the daily refresh process
   */
  async runDailyRefresh(): Promise<RefreshStats> {
    if (this.isRunning) {
      logger.warn('Job refresh already running. Skipping this cycle.');
      throw new Error('Job refresh already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();

    logger.info('🚀 Starting daily job refresh...');

    const stats: RefreshStats = {
      timestamp: new Date(),
      totalJobsFetched: 0,
      newJobsAdded: 0,
      jobsUpdated: 0,
      jobsCleaned: 0,
      sources: {},
      duration: 0,
      success: false,
      errors: []
    };

    try {
      // Step 1: Aggregate jobs from all sources
      logger.info('Step 1: Fetching jobs from all sources...');
      const totalJobs = await jobAggregator.aggregateJobs();

      stats.totalJobsFetched = totalJobs;
      stats.newJobsAdded = totalJobs; // Simplified - adjust based on your aggregator's return

      logger.info(`✅ Aggregation complete: ${stats.totalJobsFetched} jobs fetched`);

      // Step 2: Clean up old/inactive jobs
      logger.info('Step 2: Cleaning up old jobs...');
      const cleanupResult = await jobCleanupService.cleanupOldJobs();

      stats.jobsCleaned = cleanupResult.deletedCount;

      logger.info(`✅ Cleanup complete: ${stats.jobsCleaned} jobs removed`);

      // Step 3: Run deduplication
      logger.info('Step 3: Running deduplication...');
      const deduplicationResult = await jobCleanupService.deduplicateJobs();

      logger.info(`✅ Deduplication complete: ${deduplicationResult.duplicatesRemoved} duplicates removed`);

      stats.success = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`❌ Daily refresh failed: ${errorMessage}`);
      stats.errors.push(errorMessage);
      stats.success = false;
    } finally {
      stats.duration = Date.now() - startTime;
      this.lastRefreshStats = stats;
      this.isRunning = false;

      // Log summary
      this.logRefreshSummary(stats);
    }

    return stats;
  }

  /**
   * Get last refresh statistics
   */
  getLastRefreshStats(): RefreshStats | null {
    return this.lastRefreshStats;
  }

  /**
   * Check if refresh is currently running
   */
  isRefreshRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get next scheduled run time
   */
  getNextScheduledRun(): string | null {
    const cronSchedule = process.env.JOB_REFRESH_CRON || '0 2 * * *';
    
    try {
      // Parse cron expression to get next run time
      const now = new Date();
      const fields = cronSchedule.split(' ');
      
      // Simple next run calculation (for display purposes)
      if (cronSchedule === '0 2 * * *') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);
        return tomorrow.toISOString();
      }
      
      return 'Check cron expression: ' + cronSchedule;
    } catch {
      return null;
    }
  }

  /**
   * Log refresh summary
   */
  private logRefreshSummary(stats: RefreshStats): void {
    const durationMinutes = (stats.duration / 1000 / 60).toFixed(2);

    logger.info('═══════════════════════════════════════');
    logger.info('📊 DAILY JOB REFRESH SUMMARY');
    logger.info('═══════════════════════════════════════');
    logger.info(`Status: ${stats.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    logger.info(`Timestamp: ${stats.timestamp.toISOString()}`);
    logger.info(`Duration: ${durationMinutes} minutes`);
    logger.info('');
    logger.info('📈 Job Statistics:');
    logger.info(`  Total Fetched: ${stats.totalJobsFetched}`);
    logger.info(`  New Jobs: ${stats.newJobsAdded}`);
    logger.info(`  Updated: ${stats.jobsUpdated}`);
    logger.info(`  Cleaned: ${stats.jobsCleaned}`);
    logger.info('');

    if (Object.keys(stats.sources).length > 0) {
      logger.info('🌐 Source Breakdown:');
      Object.entries(stats.sources).forEach(([source, data]) => {
        const status = data.errors.length > 0 ? '⚠️' : '✅';
        logger.info(`  ${status} ${source}: ${data.fetched} jobs`);
        if (data.errors.length > 0) {
          data.errors.forEach(err => logger.info(`     Error: ${err}`));
        }
      });
    }

    if (stats.errors.length > 0) {
      logger.info('');
      logger.info('❌ Errors:');
      stats.errors.forEach(err => logger.info(`  - ${err}`));
    }

    logger.info('═══════════════════════════════════════');
  }

  /**
   * Manual trigger (for testing or admin use)
   */
  async triggerManualRefresh(): Promise<RefreshStats> {
    logger.info('🔄 Manual refresh triggered');
    return await this.runDailyRefresh();
  }
}

export default new DailyJobRefreshService();