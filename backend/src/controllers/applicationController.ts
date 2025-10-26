// backend/src/controllers/applicationController.ts

import { Request, Response } from 'express';
import applicationTrackingService from '../services/applicationTrackingService';
import logger from '../utils/logger';

/**
 * Create a new application
 * @route POST /api/applications
 * @access Private
 */
export const createApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Create application request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { jobId, status, notes, resumeUsed, coverLetterUsed, interviewDate, reminderDate } = req.body;

    // Validate required fields
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    logger.info('Creating application', { userId, jobId });

    const application = await applicationTrackingService.createApplication({
      userId,
      jobId,
      status,
      notes,
      resumeUsed,
      coverLetterUsed,
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
      reminderDate: reminderDate ? new Date(reminderDate) : undefined
    });

    logger.info('Application created successfully', {
      userId,
      applicationId: application._id
    });

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating application', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    const statusCode = error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all applications with filters
 * @route GET /api/applications
 * @access Private
 */
export const getApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Get applications request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Parse filters from query params
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.jobId) filters.jobId = req.query.jobId;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    // Parse pagination
    const pagination: any = {};
    if (req.query.page) pagination.page = parseInt(req.query.page as string);
    if (req.query.limit) pagination.limit = parseInt(req.query.limit as string);
    if (req.query.sortBy) pagination.sortBy = req.query.sortBy;
    if (req.query.sortOrder) pagination.sortOrder = req.query.sortOrder;

    logger.info('Fetching applications', { userId, filters, pagination });

    const result = await applicationTrackingService.getApplications(
      userId,
      filters,
      pagination
    );

    logger.info('Applications fetched successfully', {
      userId,
      count: result.applications.length
    });

    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
      message: 'Applications retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching applications', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single application by ID
 * @route GET /api/applications/:id
 * @access Private
 */
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      logger.warn('Get application request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Fetching application', { userId, applicationId: id });

    const result = await applicationTrackingService.getApplicationTimeline(id, userId);

    logger.info('Application fetched successfully', { userId, applicationId: id });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Application retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching application', {
      userId: req.user?.userId,
      applicationId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update application
 * @route PUT /api/applications/:id
 * @access Private
 */
export const updateApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      logger.warn('Update application request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { status, notes, interviewDate, reminderDate, offerDetails } = req.body;

    logger.info('Updating application', { userId, applicationId: id });

    const application = await applicationTrackingService.updateApplicationStatus(
      id,
      userId,
      {
        status,
        notes,
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
        offerDetails
      }
    );

    logger.info('Application updated successfully', {
      userId,
      applicationId: id
    });

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating application', {
      userId: req.user?.userId,
      applicationId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    const statusCode = error.message.includes('not found') ? 404 
      : error.message.includes('transition') ? 400 
      : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete application
 * @route DELETE /api/applications/:id
 * @access Private
 */
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      logger.warn('Delete application request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Deleting application', { userId, applicationId: id });

    const result = await applicationTrackingService.deleteApplication(id, userId);

    logger.info('Application deleted successfully', {
      userId,
      applicationId: id
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Application deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting application', {
      userId: req.user?.userId,
      applicationId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get application timeline
 * @route GET /api/applications/:id/timeline
 * @access Private
 */
export const getApplicationTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      logger.warn('Get timeline request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Fetching application timeline', { userId, applicationId: id });

    const result = await applicationTrackingService.getApplicationTimeline(id, userId);

    logger.info('Application timeline fetched successfully', {
      userId,
      applicationId: id
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Application timeline retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching application timeline', {
      userId: req.user?.userId,
      applicationId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch application timeline. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get upcoming interviews
 * @route GET /api/applications/interviews/upcoming
 * @access Private
 */
export const getUpcomingInterviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Get upcoming interviews request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get days from query params (default: 30)
    const days = parseInt(req.query.days as string) || 30;

    logger.info('Fetching upcoming interviews', { userId, days });

    const interviews = await applicationTrackingService.getUpcomingInterviews(userId, days);

    logger.info('Upcoming interviews fetched successfully', {
      userId,
      count: interviews.length
    });

    res.status(200).json({
      success: true,
      data: {
        interviews,
        count: interviews.length,
        period: `Next ${days} days`
      },
      message: 'Upcoming interviews retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching upcoming interviews', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming interviews. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get application metrics
 * @route GET /api/applications/metrics
 * @access Private
 */
export const getApplicationMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Get metrics request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Calculating application metrics', { userId });

    const metrics = await applicationTrackingService.getApplicationMetrics(userId);

    logger.info('Application metrics calculated successfully', { userId });

    res.status(200).json({
      success: true,
      data: metrics,
      message: 'Application metrics retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error calculating application metrics', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to calculate application metrics. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};