// backend/src/controllers/jobController.ts
// Complete Job Controller - Phase 2 (Fixed All Issues)

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job';
import User from '../models/User';
import jobAggregator from '../services/jobAggregator';
import dailyJobRefreshService from '../jobs/dailyJobRefresh';
import jobCleanupService from '../services/jobCleanup';
import visaDetectionService from '../services/visaDetection';
import logger from '../utils/logger';
import universityJobScraper from '../services/universityJobScraper';

// ==================== PHASE 1 & 2 CHUNK 1-2 METHODS ====================

/**
 * GET /api/jobs
 * Search jobs with filters
 */
export const searchJobs = async (req: Request, res: Response) => {
  try {
    const {
      keywords,
      location,
      remote,
      h1b,
      opt,
      stemOpt,
      employmentType,
      skills,
      source,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = { isActive: true };

    // Keyword search (in title or description)
    if (keywords) {
      query.$or = [
        { title: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } }
      ];
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Remote filter
    if (remote === 'true') {
      query.remote = true;
    }

    // Visa sponsorship filters
    if (h1b === 'true') {
      query['visaSponsorship.h1b'] = true;
    }
    if (opt === 'true') {
      query['visaSponsorship.opt'] = true;
    }
    if (stemOpt === 'true') {
      query['visaSponsorship.stemOpt'] = true;
    }

    // Employment type filter
    if (employmentType) {
      query.employmentType = employmentType.toString().toUpperCase();
    }

    // Skills filter (match any skill in array)
    if (skills) {
      const skillsArray = skills.toString().split(',');
      query.skills = { $in: skillsArray };
    }

    // Source filter
    if (source) {
      query.source = source.toString().toUpperCase();
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [jobs, totalCount] = await Promise.all([
      Job.find(query)
        .sort({ postedDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalJobs: totalCount,
          jobsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    logger.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching jobs'
    });
  }
};

/**
 * GET /api/jobs/stats
 * Get job statistics by source
 */
export const getJobStats = async (req: Request, res: Response) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          h1bCount: {
            $sum: { $cond: ['$visaSponsorship.h1b', 1, 0] }
          },
          optCount: {
            $sum: { $cond: ['$visaSponsorship.opt', 1, 0] }
          },
          remoteCount: {
            $sum: { $cond: ['$remote', 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        bySource: stats
      }
    });
  } catch (error) {
    logger.error('Error getting job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting job statistics'
    });
  }
};

/**
 * GET /api/jobs/:id
 * Get single job details
 */
export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Error getting job:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting job details'
    });
  }
};

/**
 * POST /api/jobs/:id/bookmark
 * Bookmark or unbookmark a job (requires authentication)
 */
export const bookmarkJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert jobId to ObjectId for comparison
    const jobObjectId = new mongoose.Types.ObjectId(jobId);

    // Check if already bookmarked
    const bookmarkIndex = user.bookmarkedJobs.findIndex(
      (id: any) => id.toString() === jobId
    );
    let action: string;

    if (bookmarkIndex > -1) {
      // Remove bookmark
      user.bookmarkedJobs.splice(bookmarkIndex, 1);
      action = 'removed';
    } else {
      // Add bookmark
      user.bookmarkedJobs.push(jobObjectId as any);
      action = 'added';
    }

    await user.save();

    res.json({
      success: true,
      message: `Job ${action} ${action === 'added' ? 'to' : 'from'} bookmarks`,
      data: {
        bookmarked: action === 'added',
        totalBookmarks: user.bookmarkedJobs.length
      }
    });
  } catch (error) {
    logger.error('Error bookmarking job:', error);
    res.status(500).json({
      success: false,
      message: 'Error bookmarking job'
    });
  }
};

/**
 * GET /api/jobs/bookmarked/list
 * Get user's bookmarked jobs (requires authentication)
 */
export const getBookmarkedJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId).populate('bookmarkedJobs');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        jobs: user.bookmarkedJobs,
        totalBookmarks: user.bookmarkedJobs.length
      }
    });
  } catch (error) {
    logger.error('Error getting bookmarked jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting bookmarked jobs'
    });
  }
};

/**
 * POST /api/jobs/aggregate
 * Manually trigger job aggregation (requires authentication)
 */
export const triggerJobAggregation = async (req: Request, res: Response) => {
  try {
    logger.info(`Job aggregation triggered by user: ${req.user?.email}`);

    // Call the correct method from your jobAggregator
    const result = await jobAggregator.aggregateJobs();

    res.json({
      success: true,
      message: 'Job aggregation completed',
      data: {
        totalJobs: result,
        message: `Successfully aggregated ${result} jobs`
      }
    });
  } catch (error) {
    logger.error('Error during job aggregation:', error);
    res.status(500).json({
      success: false,
      message: 'Error during job aggregation'
    });
  }
};

// ==================== PHASE 2 CHUNK 3 - NEW METHODS ====================

/**
 * GET /api/jobs/system/refresh-stats
 * Get last job refresh statistics
 */
export const getRefreshStats = async (req: Request, res: Response) => {
  try {
    const stats = dailyJobRefreshService.getLastRefreshStats();
    const isRunning = dailyJobRefreshService.isRefreshRunning();
    const nextRun = dailyJobRefreshService.getNextScheduledRun();

    res.json({
      success: true,
      data: {
        lastRefresh: stats,
        isRunning,
        nextScheduledRun: nextRun,
        enabled: process.env.ENABLE_DAILY_JOB_REFRESH === 'true',
        cronSchedule: process.env.JOB_REFRESH_CRON || '0 2 * * *'
      }
    });
  } catch (error) {
    logger.error('Error getting refresh stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting refresh statistics'
    });
  }
};

/**
 * POST /api/jobs/system/refresh
 * Manually trigger job refresh (admin/authenticated)
 */
export const triggerManualRefresh = async (req: Request, res: Response) => {
  try {
    logger.info(`Manual refresh triggered by user: ${req.user?.email}`);

    // Check if already running
    if (dailyJobRefreshService.isRefreshRunning()) {
      return res.status(409).json({
        success: false,
        message: 'Job refresh is already in progress'
      });
    }

    // Start refresh asynchronously
    dailyJobRefreshService.triggerManualRefresh().catch(error => {
      logger.error('Manual refresh failed:', error);
    });

    res.json({
      success: true,
      message: 'Job refresh started. Check /api/jobs/system/refresh-stats for progress.'
    });
  } catch (error) {
    logger.error('Error triggering manual refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering job refresh'
    });
  }
};

/**
 * POST /api/jobs/system/cleanup
 * Manually trigger cleanup (admin only)
 */
export const triggerCleanup = async (req: Request, res: Response) => {
  try {
    logger.info(`Manual cleanup triggered by user: ${req.user?.email}`);

    const result = await jobCleanupService.performFullCleanup();

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error during cleanup operation'
    });
  }
};

/**
 * GET /api/jobs/system/cleanup-stats
 * Get cleanup statistics
 */
export const getCleanupStats = async (req: Request, res: Response) => {
  try {
    const stats = await jobCleanupService.getCleanupStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting cleanup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting cleanup statistics'
    });
  }
};

/**
 * POST /api/jobs/:id/analyze-visa
 * Analyze visa sponsorship for a specific job
 */
export const analyzeJobVisa = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const visaAnalysis = visaDetectionService.detectVisaSponsorship(
      job.title,
      job.description,
      job.company
    );

    // Optionally update the job with new analysis
    if (req.query.update === 'true') {
      job.visaSponsorship.h1b = visaAnalysis.h1b;
      job.visaSponsorship.opt = visaAnalysis.opt;
      job.visaSponsorship.stemOpt = visaAnalysis.stemOpt;
      await job.save();
    }

    res.json({
      success: true,
      data: {
        jobId: job._id,
        title: job.title,
        company: job.company,
        currentVisa: job.visaSponsorship,
        analysis: visaAnalysis
      }
    });
  } catch (error) {
    logger.error('Error analyzing job visa:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing visa sponsorship'
    });
  }
};

/**
 * POST /api/jobs/batch/analyze-visa
 * Batch analyze visa sponsorship for all jobs
 */
export const batchAnalyzeVisa = async (req: Request, res: Response) => {
  try {
    const { limit = 100, source } = req.query;

    // Build query
    const query: any = {};
    if (source) {
      query.source = source.toString().toUpperCase();
    }

    // Get jobs to analyze
    const jobs = await Job.find(query)
      .limit(Number(limit))
      .select('title description company visaSponsorship');

    logger.info(`Analyzing ${jobs.length} jobs for visa sponsorship`);

    let updated = 0;
    const results = [];

    for (const job of jobs) {
      const analysis = visaDetectionService.detectVisaSponsorship(
        job.title,
        job.description,
        job.company
      );

      // Update if different
      if (
        job.visaSponsorship.h1b !== analysis.h1b ||
        job.visaSponsorship.opt !== analysis.opt ||
        job.visaSponsorship.stemOpt !== analysis.stemOpt
      ) {
        job.visaSponsorship.h1b = analysis.h1b;
        job.visaSponsorship.opt = analysis.opt;
        job.visaSponsorship.stemOpt = analysis.stemOpt;
        await job.save();
        updated++;
      }

      results.push({
        jobId: job._id,
        title: job.title,
        company: job.company,
        confidence: analysis.confidence,
        detected: analysis
      });
    }

    res.json({
      success: true,
      message: `Analyzed ${jobs.length} jobs, updated ${updated}`,
      data: {
        totalAnalyzed: jobs.length,
        totalUpdated: updated,
        results
      }
    });
  } catch (error) {
    logger.error('Error in batch visa analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error during batch visa analysis'
    });
  }
};

/**
 * GET /api/jobs/system/health
 * Get job system health status
 */
export const getJobSystemHealth = async (req: Request, res: Response) => {
  try {
    const [
      totalJobs,
      activeJobs,
      jobsBySource,
      refreshStats,
      cleanupStats
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Job.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      dailyJobRefreshService.getLastRefreshStats(),
      jobCleanupService.getCleanupStats()
    ]);

    const sourceMap = jobsBySource.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [source: string]: number });

    res.json({
      success: true,
      data: {
        status: 'healthy',
        jobs: {
          total: totalJobs,
          active: activeJobs,
          inactive: totalJobs - activeJobs,
          bySource: sourceMap
        },
        lastRefresh: refreshStats,
        cleanupStats,
        cron: {
          enabled: process.env.ENABLE_DAILY_JOB_REFRESH === 'true',
          schedule: process.env.JOB_REFRESH_CRON || '0 2 * * *',
          nextRun: dailyJobRefreshService.getNextScheduledRun()
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Error getting job system health:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting system health'
    });
  }
};


export const triggerUniversityScrape = async (req: Request, res: Response) => {
  try {
    logger.info(`University job scraping triggered by user: ${req.user?.email}`);

    const result = await universityJobScraper.scrapeAllUniversities();

    res.json({
      success: true,
      message: 'University job scraping completed',
      data: result
    });
  } catch (error) {
    logger.error('Error during university job scraping:', error);
    res.status(500).json({
      success: false,
      message: 'Error during university job scraping'
    });
  }
};

/**
 * GET /api/jobs/university
 * Get university-specific jobs with filters
 */
export const getUniversityJobs = async (req: Request, res: Response) => {
  try {
    const {
      university,
      keywords,
      location,
      h1b,
      opt,
      stemOpt,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query: any = { 
      source: 'UNIVERSITY',
      isActive: true 
    };

    // Filter by specific university
    if (university) {
      query['metadata.university'] = { $regex: university, $options: 'i' };
    }

    // Keyword search
    if (keywords) {
      query.$or = [
        { title: { $regex: keywords, $options: 'i' } },
        { description: { $regex: keywords, $options: 'i' } },
        { company: { $regex: keywords, $options: 'i' } }
      ];
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Visa filters
    if (h1b === 'true') {
      query['visaSponsorship.h1b'] = true;
    }
    if (opt === 'true') {
      query['visaSponsorship.opt'] = true;
    }
    if (stemOpt === 'true') {
      query['visaSponsorship.stemOpt'] = true;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [jobs, totalCount] = await Promise.all([
      Job.find(query)
        .sort({ postedDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalJobs: totalCount,
          jobsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    logger.error('Error getting university jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting university jobs'
    });
  }
};

/**
 * GET /api/jobs/university/stats
 * Get university job statistics
 */
export const getUniversityJobStats = async (req: Request, res: Response) => {
  try {
    const stats = await universityJobScraper.getUniversityJobStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting university job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting university job statistics'
    });
  }
};