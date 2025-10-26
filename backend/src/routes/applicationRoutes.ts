// backend/src/routes/applicationRoutes.ts

import express from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getApplicationTimeline,
  getUpcomingInterviews,
  getApplicationMetrics
} from '../controllers/applicationController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// All application routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/applications/interviews/upcoming
 * @desc    Get upcoming interviews
 * @access  Private
 * @query   days - Number of days to look ahead (default: 30)
 * @returns {
 *   interviews: UpcomingInterview[],
 *   count: number,
 *   period: string
 * }
 */
router.get('/interviews/upcoming', getUpcomingInterviews);

/**
 * @route   GET /api/applications/metrics
 * @desc    Get application success metrics and analytics
 * @access  Private
 * @returns {
 *   totalApplications: number,
 *   responseRate: number,
 *   averageResponseTime: number,
 *   interviewRate: number,
 *   offerRate: number,
 *   byCompany: {...}[],
 *   byJobType: {...}[],
 *   timeToInterview: {...}
 * }
 */
router.get('/metrics', getApplicationMetrics);

/**
 * @route   POST /api/applications
 * @desc    Create a new application
 * @access  Private
 * @body    {
 *   jobId: string (required),
 *   status?: 'saved' | 'applied' | 'in-review' | 'interview' | 'offer' | 'rejected',
 *   notes?: string,
 *   resumeUsed?: string,
 *   coverLetterUsed?: string,
 *   interviewDate?: Date,
 *   reminderDate?: Date
 * }
 */
router.post('/', createApplication);

/**
 * @route   GET /api/applications
 * @desc    Get all applications with filters and pagination
 * @access  Private
 * @query   {
 *   status?: string,
 *   jobId?: string,
 *   search?: string,
 *   startDate?: Date,
 *   endDate?: Date,
 *   page?: number,
 *   limit?: number,
 *   sortBy?: string,
 *   sortOrder?: 'asc' | 'desc'
 * }
 * @returns {
 *   applications: Application[],
 *   pagination: {...}
 * }
 */
router.get('/', getApplications);

/**
 * @route   GET /api/applications/:id
 * @desc    Get single application with timeline
 * @access  Private
 * @returns {
 *   application: Application,
 *   timeline: TimelineEntry[],
 *   currentStatus: string,
 *   nextSteps: string[]
 * }
 */
router.get('/:id', getApplicationById);

/**
 * @route   PUT /api/applications/:id
 * @desc    Update application status and details
 * @access  Private
 * @body    {
 *   status?: ApplicationStatus,
 *   notes?: string,
 *   interviewDate?: Date,
 *   reminderDate?: Date,
 *   offerDetails?: {
 *     salary?: number,
 *     startDate?: Date,
 *     benefits?: string
 *   }
 * }
 */
router.put('/:id', updateApplication);

/**
 * @route   DELETE /api/applications/:id
 * @desc    Delete an application
 * @access  Private
 * @returns { success: boolean, message: string }
 */
router.delete('/:id', deleteApplication);

/**
 * @route   GET /api/applications/:id/timeline
 * @desc    Get detailed timeline for an application
 * @access  Private
 * @returns {
 *   application: Application,
 *   timeline: TimelineEntry[],
 *   currentStatus: string,
 *   nextSteps: string[]
 * }
 */
router.get('/:id/timeline', getApplicationTimeline);

export default router;