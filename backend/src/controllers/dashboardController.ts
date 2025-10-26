// backend/src/controllers/dashboardController.ts

import { Request, Response } from 'express';
import dashboardService from '../services/dashboardService';
import logger from '../utils/logger';

/**
 * Get complete dashboard statistics
 * @route GET /api/dashboard/stats
 * @access Private
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Dashboard stats request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Fetching dashboard stats', { userId });

    const stats = await dashboardService.getUserDashboardStats(userId);

    logger.info('Dashboard stats fetched successfully', { 
      userId,
      totalApplications: stats.overview.totalApplications 
    });

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching dashboard stats', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get recent user activity
 * @route GET /api/dashboard/activity
 * @access Private
 */
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Recent activity request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get limit from query params (default: 20, max: 50)
    const limit = Math.min(
      parseInt(req.query.limit as string) || 20,
      50
    );

    logger.info('Fetching recent activity', { userId, limit });

    const activity = await dashboardService.getRecentActivity(userId, limit);

    logger.info('Recent activity fetched successfully', { 
      userId,
      activityCount: activity.length 
    });

    res.status(200).json({
      success: true,
      data: {
        activity,
        count: activity.length,
        limit
      },
      message: 'Recent activity retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching recent activity', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get application trends over time
 * @route GET /api/dashboard/trends
 * @access Private
 */
export const getApplicationTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Application trends request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get time range from query params (default: month)
    const timeRange = (req.query.range as 'week' | 'month' | 'quarter') || 'month';

    // Validate time range
    if (!['week', 'month', 'quarter'].includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range. Must be one of: week, month, quarter'
      });
    }

    logger.info('Fetching application trends', { userId, timeRange });

    const trends = await dashboardService.getApplicationTrends(userId, timeRange);

    logger.info('Application trends fetched successfully', { 
      userId,
      timeRange,
      dataPoints: trends.applications.length 
    });

    res.status(200).json({
      success: true,
      data: trends,
      message: 'Application trends retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching application trends', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch application trends. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get VISA countdown information
 * @route GET /api/dashboard/visa-countdown
 * @access Private
 */
export const getVisaCountdown = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('VISA countdown request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Fetching VISA countdown', { userId });

    const visaStatus = await dashboardService.getVisaCountdown(userId);

    if (!visaStatus) {
      logger.info('No VISA information found for user', { userId });
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No VISA information available. Please update your profile.'
      });
    }

    logger.info('VISA countdown fetched successfully', { 
      userId,
      daysRemaining: visaStatus.daysRemaining,
      urgency: visaStatus.urgency
    });

    res.status(200).json({
      success: true,
      data: visaStatus,
      message: 'VISA countdown retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching VISA countdown', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch VISA countdown. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get applications grouped by status
 * @route GET /api/dashboard/applications-by-status
 * @access Private
 */
export const getApplicationsByStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Applications by status request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Fetching applications by status', { userId });

    const statusData = await dashboardService.getApplicationsByStatus(userId);

    logger.info('Applications by status fetched successfully', { 
      userId,
      totalApplications: statusData.total 
    });

    res.status(200).json({
      success: true,
      data: statusData,
      message: 'Applications by status retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching applications by status', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by status. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};