// backend/src/routes/profileRoutes.ts

import express from 'express';
import {
  getProfile,
  updateProfile,
  updateVisaStatus,
  updateJobPreferences,
  getProfileCompleteness
} from '../controllers/profileController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// All profile routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 * @returns {
 *   user: User,
 *   hasResume: boolean,
 *   resumeCount: number
 * }
 */
router.get('/', getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 * @body    {
 *   firstName?: string,
 *   lastName?: string,
 *   profilePicture?: string,
 *   university?: string,
 *   major?: string,
 *   graduationYear?: number,
 *   currentYear?: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate',
 *   graduationDate?: Date,
 *   degreeType?: string
 * }
 */
router.put('/', updateProfile);

/**
 * @route   PUT /api/profile/visa
 * @desc    Update visa status
 * @access  Private
 * @body    {
 *   visaType?: 'F1' | 'OPT' | 'STEM_OPT' | 'H1B' | 'GREEN_CARD' | 'CITIZEN' | 'OTHER',
 *   visaExpiryDate?: Date,
 *   optStartDate?: Date,
 *   optEndDate?: Date,
 *   workAuthorization?: string
 * }
 */
router.put('/visa', updateVisaStatus);

/**
 * @route   PUT /api/profile/preferences
 * @desc    Update job preferences
 * @access  Private
 * @body    {
 *   jobTypes?: string[],
 *   locations?: string[],
 *   remoteOnly?: boolean,
 *   visaSponsorshipRequired?: boolean,
 *   salaryMin?: number,
 *   salaryMax?: number
 * }
 */
router.put('/preferences', updateJobPreferences);

/**
 * @route   GET /api/profile/completeness
 * @desc    Get profile completeness percentage
 * @access  Private
 * @returns {
 *   percentage: number,
 *   completed: string[],
 *   missing: string[],
 *   recommendations: string[]
 * }
 */
router.get('/completeness', getProfileCompleteness);

export default router;