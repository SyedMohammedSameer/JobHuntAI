// backend/src/routes/dashboardRoutes.ts

import express from 'express';
import {
  getDashboardStats,
  getRecentActivity,
  getApplicationTrends,
  getVisaCountdown,
  getApplicationsByStatus
} from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get complete dashboard statistics
 * @access  Private
 * @returns {
 *   overview: {
 *     totalApplications, inReview, interviews, offers, rejected,
 *     savedJobs, responseRate, resumesUploaded, coverLettersGenerated
 *   },
 *   visaStatus: { daysRemaining, urgency, expiryDate, visaType } | null,
 *   recentActivity: ActivityItem[],
 *   trends: { weeklyApplications, monthlyApplications, interviewConversionRate, averageResponseTime },
 *   aiUsage: { resumeTailoring, coverLetterGeneration, resetsAt }
 * }
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent user activity
 * @access  Private
 * @query   limit - Number of activities to return (default: 20, max: 50)
 * @returns {
 *   activity: ActivityItem[],
 *   count: number,
 *   limit: number
 * }
 */
router.get('/activity', getRecentActivity);

/**
 * @route   GET /api/dashboard/trends
 * @desc    Get application trends over time
 * @access  Private
 * @query   range - Time range: 'week' | 'month' | 'quarter' (default: 'month')
 * @returns {
 *   period: string,
 *   applications: { date, count }[],
 *   interviews: { date, count }[],
 *   offers: { date, count }[],
 *   successRate: number,
 *   interviewRate: number,
 *   offerRate: number
 * }
 */
router.get('/trends', getApplicationTrends);

/**
 * @route   GET /api/dashboard/visa-countdown
 * @desc    Get VISA countdown information
 * @access  Private
 * @returns {
 *   daysRemaining: number,
 *   urgency: 'critical' | 'warning' | 'safe',
 *   expiryDate: Date,
 *   visaType: string
 * } | null
 */
router.get('/visa-countdown', getVisaCountdown);

/**
 * @route   GET /api/dashboard/applications-by-status
 * @desc    Get applications grouped by status
 * @access  Private
 * @returns {
 *   applied: number,
 *   inReview: number,
 *   interview: number,
 *   offer: number,
 *   rejected: number,
 *   total: number,
 *   breakdown: { status, count, percentage }[]
 * }
 */
router.get('/applications-by-status', getApplicationsByStatus);

export default router;