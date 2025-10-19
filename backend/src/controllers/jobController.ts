import { Request, Response } from 'express';
import jobAggregator from '../services/jobAggregator';
import Job from '../models/Job';
import User from '../models/User';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Search jobs with filters
 * GET /api/jobs
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
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      keywords: keywords as string,
      location: location as string,
      remote: remote === 'true',
      h1b: h1b === 'true',
      opt: opt === 'true',
      stemOpt: stemOpt === 'true',
      employmentType: employmentType as string,
      skills: skills ? (skills as string).split(',') : []
    };

    const result = await jobAggregator.searchJobs(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.jobs,
      pagination: result.pagination
    });
  } catch (error: any) {
    logger.error('Error searching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error.message
    });
  }
};

/**
 * Get single job details
 * GET /api/jobs/:id
 */
export const getJobDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await jobAggregator.getJobById(id);

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
  } catch (error: any) {
    logger.error('Error getting job details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job details',
      error: error.message
    });
  }
};

/**
 * Bookmark a job
 * POST /api/jobs/:id/bookmark
 */
export const bookmarkJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId; // From auth middleware

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Convert id to ObjectId
    const jobObjectId = new mongoose.Types.ObjectId(id);

    // Check if already bookmarked
    const bookmarkedJobs = user.bookmarkedJobs || [];
    const isBookmarked = bookmarkedJobs.some(
      (jobId: any) => jobId.toString() === id
    );

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarkedJobs = bookmarkedJobs.filter(
        (jobId: any) => jobId.toString() !== id
      ) as mongoose.Types.ObjectId[];
      await user.save();

      return res.json({
        success: true,
        message: 'Job unbookmarked',
        bookmarked: false
      });
    } else {
      // Add bookmark
      user.bookmarkedJobs = [...bookmarkedJobs, jobObjectId] as mongoose.Types.ObjectId[];
      await user.save();

      return res.json({
        success: true,
        message: 'Job bookmarked',
        bookmarked: true
      });
    }
  } catch (error: any) {
    logger.error('Error bookmarking job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bookmark job',
      error: error.message
    });
  }
};

/**
 * Get user's bookmarked jobs
 * GET /api/jobs/bookmarked
 */
export const getBookmarkedJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bookmarkedJobIds = user.bookmarkedJobs || [];
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const jobs = await Job.find({ _id: { $in: bookmarkedJobIds } })
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean();

    const total = bookmarkedJobIds.length;

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Error getting bookmarked jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookmarked jobs',
      error: error.message
    });
  }
};

/**
 * Get job statistics
 * GET /api/jobs/stats
 */
export const getJobStats = async (req: Request, res: Response) => {
  try {
    const stats = await jobAggregator.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job statistics',
      error: error.message
    });
  }
};

/**
 * Trigger manual job aggregation (admin only)
 * POST /api/jobs/aggregate
 */
export const triggerAggregation = async (req: Request, res: Response) => {
  try {
    const { keywords, location } = req.body;

    const params = {
      keywords,
      location,
      limit: 50
    };

    // Run aggregation in background
    jobAggregator.aggregateJobs(params)
      .then(count => {
        logger.info(`Background aggregation completed: ${count} jobs`);
      })
      .catch(error => {
        logger.error('Background aggregation error:', error);
      });

    res.json({
      success: true,
      message: 'Job aggregation started in background'
    });
  } catch (error: any) {
    logger.error('Error triggering aggregation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger aggregation',
      error: error.message
    });
  }
};