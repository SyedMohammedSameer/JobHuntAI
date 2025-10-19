// backend/src/services/jobCleanup.ts

import Job from '../models/Job';
import logger from '../utils/logger';

/**
 * Job Cleanup Service
 * Removes old/inactive jobs and handles deduplication
 */

interface CleanupResult {
  deletedCount: number;
  markedInactive: number;
  deletedJobs: string[];
}

interface DeduplicationResult {
  duplicatesRemoved: number;
  duplicatesBySource: {
    [source: string]: number;
  };
}

class JobCleanupService {
  private readonly JOB_RETENTION_DAYS = 30; // Keep jobs for 30 days
  private readonly INACTIVE_THRESHOLD_DAYS = 45; // Mark as inactive after 45 days

  /**
   * Remove jobs older than retention period
   */
  async cleanupOldJobs(): Promise<CleanupResult> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.JOB_RETENTION_DAYS);

    logger.info(`Cleaning up jobs older than ${retentionDate.toISOString()}`);

    try {
      // Find jobs to delete
      const jobsToDelete = await Job.find({
        postedDate: { $lt: retentionDate }
      }).select('_id title company source');

      const deletedJobIds = jobsToDelete.map(job => job._id.toString());
      const deletedJobInfo = jobsToDelete.map(
        job => `${job.title} at ${job.company} (${job.source})`
      );

      // Delete the jobs
      const deleteResult = await Job.deleteMany({
        postedDate: { $lt: retentionDate }
      });

      logger.info(
        `✅ Deleted ${deleteResult.deletedCount} jobs older than ${this.JOB_RETENTION_DAYS} days`
      );

      // Also mark very old jobs as inactive (if they somehow weren't deleted)
      const inactiveDate = new Date();
      inactiveDate.setDate(inactiveDate.getDate() - this.INACTIVE_THRESHOLD_DAYS);

      const inactiveResult = await Job.updateMany(
        {
          postedDate: { $lt: inactiveDate },
          isActive: true
        },
        {
          $set: { isActive: false }
        }
      );

      logger.info(`✅ Marked ${inactiveResult.modifiedCount} jobs as inactive`);

      return {
        deletedCount: deleteResult.deletedCount || 0,
        markedInactive: inactiveResult.modifiedCount || 0,
        deletedJobs: deletedJobInfo
      };
    } catch (error) {
      logger.error('Error during job cleanup:', error);
      throw error;
    }
  }

  /**
   * Remove duplicate jobs based on source + sourceJobId
   * Keeps the most recent version
   */
  async deduplicateJobs(): Promise<DeduplicationResult> {
    logger.info('Starting job deduplication...');

    const result: DeduplicationResult = {
      duplicatesRemoved: 0,
      duplicatesBySource: {}
    };

    try {
      // Find duplicates using aggregation
      const duplicates = await Job.aggregate([
        {
          $group: {
            _id: {
              source: '$source',
              sourceJobId: '$sourceJobId'
            },
            count: { $sum: 1 },
            ids: { $push: '$_id' },
            dates: { $push: '$createdAt' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      logger.info(`Found ${duplicates.length} duplicate job groups`);

      // Process each duplicate group
      for (const duplicate of duplicates) {
        const source = duplicate._id.source;
        const jobIds = duplicate.ids;
        const dates = duplicate.dates;

        // Sort by date to keep the most recent
        const sortedJobs = jobIds
          .map((id: any, index: number) => ({
            id,
            date: dates[index]
          }))
          .sort((a: any, b: any) => b.date - a.date);

        // Keep the first (most recent), delete the rest
        const idsToDelete = sortedJobs.slice(1).map((job: any) => job.id);

        if (idsToDelete.length > 0) {
          await Job.deleteMany({
            _id: { $in: idsToDelete }
          });

          result.duplicatesRemoved += idsToDelete.length;
          result.duplicatesBySource[source] =
            (result.duplicatesBySource[source] || 0) + idsToDelete.length;

          logger.debug(
            `Removed ${idsToDelete.length} duplicates from ${source} for job ${duplicate._id.sourceJobId}`
          );
        }
      }

      logger.info(
        `✅ Deduplication complete: ${result.duplicatesRemoved} duplicates removed`
      );

      return result;
    } catch (error) {
      logger.error('Error during deduplication:', error);
      throw error;
    }
  }

  /**
   * Mark jobs as inactive if they haven't been updated in a while
   * (Different from deletion - keeps data but marks as old)
   */
  async markStaleJobsAsInactive(): Promise<number> {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 15); // 15 days without update

    try {
      const result = await Job.updateMany(
        {
          updatedAt: { $lt: staleDate },
          isActive: true
        },
        {
          $set: { isActive: false }
        }
      );

      logger.info(`✅ Marked ${result.modifiedCount} stale jobs as inactive`);
      return result.modifiedCount || 0;
    } catch (error) {
      logger.error('Error marking stale jobs:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    inactiveJobs: number;
    oldestJob: Date | null;
    newestJob: Date | null;
    jobsBySource: { [source: string]: number };
  }> {
    try {
      const [
        totalCount,
        activeCount,
        inactiveCount,
        oldestJobDoc,
        newestJobDoc,
        jobsBySource
      ] = await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ isActive: true }),
        Job.countDocuments({ isActive: false }),
        Job.findOne().sort({ postedDate: 1 }).select('postedDate'),
        Job.findOne().sort({ postedDate: -1 }).select('postedDate'),
        Job.aggregate([
          {
            $group: {
              _id: '$source',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const sourceMap = jobsBySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as { [source: string]: number });

      return {
        totalJobs: totalCount,
        activeJobs: activeCount,
        inactiveJobs: inactiveCount,
        oldestJob: oldestJobDoc?.postedDate || null,
        newestJob: newestJobDoc?.postedDate || null,
        jobsBySource: sourceMap
      };
    } catch (error) {
      logger.error('Error getting cleanup stats:', error);
      throw error;
    }
  }

  /**
   * Full cleanup routine (combines all cleanup tasks)
   */
  async performFullCleanup(): Promise<{
    cleanup: CleanupResult;
    deduplication: DeduplicationResult;
    staleMarked: number;
    stats: any;
  }> {
    logger.info('🧹 Starting full cleanup routine...');

    try {
      // Step 1: Remove old jobs
      const cleanupResult = await this.cleanupOldJobs();

      // Step 2: Deduplicate
      const deduplicationResult = await this.deduplicateJobs();

      // Step 3: Mark stale jobs
      const staleMarked = await this.markStaleJobsAsInactive();

      // Step 4: Get updated stats
      const stats = await this.getCleanupStats();

      logger.info('✅ Full cleanup complete');

      return {
        cleanup: cleanupResult,
        deduplication: deduplicationResult,
        staleMarked,
        stats
      };
    } catch (error) {
      logger.error('Error during full cleanup:', error);
      throw error;
    }
  }

  /**
   * Remove all jobs from a specific source (useful for testing)
   */
  async removeJobsBySource(source: string): Promise<number> {
    try {
      const result = await Job.deleteMany({ source: source.toUpperCase() });
      logger.info(`Removed ${result.deletedCount} jobs from ${source}`);
      return result.deletedCount || 0;
    } catch (error) {
      logger.error(`Error removing jobs from ${source}:`, error);
      throw error;
    }
  }

  /**
   * Reset all jobs to active status (useful for testing)
   */
  async reactivateAllJobs(): Promise<number> {
    try {
      const result = await Job.updateMany(
        { isActive: false },
        { $set: { isActive: true } }
      );
      logger.info(`Reactivated ${result.modifiedCount} jobs`);
      return result.modifiedCount || 0;
    } catch (error) {
      logger.error('Error reactivating jobs:', error);
      throw error;
    }
  }
}

export default new JobCleanupService();