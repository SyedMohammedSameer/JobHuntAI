// backend/src/controllers/profileController.ts

import { Request, Response } from 'express';
import userProfileService from '../services/userProfileService';
import logger from '../utils/logger';

/**
 * Get user profile
 * @route GET /api/profile
 * @access Private
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Get profile request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Fetching user profile', { userId });

    const profile = await userProfileService.getUserProfile(userId);

    logger.info('User profile fetched successfully', { userId });

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    });
  } catch (error: any) {
    logger.error('Error fetching user profile', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/profile
 * @access Private
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Update profile request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      firstName,
      lastName,
      profilePicture,
      university,
      major,
      graduationYear,
      currentYear,
      graduationDate,
      degreeType
    } = req.body;

    logger.info('Updating user profile', { userId });

    const user = await userProfileService.updateProfile(userId, {
      firstName,
      lastName,
      profilePicture,
      university,
      major,
      graduationYear,
      currentYear,
      graduationDate: graduationDate ? new Date(graduationDate) : undefined,
      degreeType
    });

    logger.info('User profile updated successfully', { userId });

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating user profile', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update visa status
 * @route PUT /api/profile/visa
 * @access Private
 */
export const updateVisaStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Update visa status request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      visaType,
      visaExpiryDate,
      optStartDate,
      optEndDate,
      workAuthorization
    } = req.body;

    logger.info('Updating visa status', { userId });

    const user = await userProfileService.updateVisaStatus(userId, {
      visaType,
      visaExpiryDate: visaExpiryDate ? new Date(visaExpiryDate) : undefined,
      optStartDate: optStartDate ? new Date(optStartDate) : undefined,
      optEndDate: optEndDate ? new Date(optEndDate) : undefined,
      workAuthorization
    });

    logger.info('Visa status updated successfully', { userId });

    res.status(200).json({
      success: true,
      data: user,
      message: 'Visa status updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating visa status', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update visa status. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update job preferences
 * @route PUT /api/profile/preferences
 * @access Private
 */
export const updateJobPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Update job preferences request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const {
      jobTypes,
      locations,
      remoteOnly,
      visaSponsorshipRequired,
      salaryMin,
      salaryMax
    } = req.body;

    logger.info('Updating job preferences', { userId });

    const user = await userProfileService.updateJobPreferences(userId, {
      jobTypes,
      locations,
      remoteOnly,
      visaSponsorshipRequired,
      salaryMin,
      salaryMax
    });

    logger.info('Job preferences updated successfully', { userId });

    res.status(200).json({
      success: true,
      data: user,
      message: 'Job preferences updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating job preferences', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update job preferences. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get profile completeness
 * @route GET /api/profile/completeness
 * @access Private
 */
export const getProfileCompleteness = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Get profile completeness request without user ID');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    logger.info('Calculating profile completeness', { userId });

    const completeness = await userProfileService.getProfileCompleteness(userId);

    logger.info('Profile completeness calculated successfully', { userId });

    res.status(200).json({
      success: true,
      data: completeness,
      message: 'Profile completeness calculated successfully'
    });
  } catch (error: any) {
    logger.error('Error calculating profile completeness', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to calculate profile completeness. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};