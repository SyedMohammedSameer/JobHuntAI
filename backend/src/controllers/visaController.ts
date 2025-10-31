// backend/src/controllers/visaController.ts
// Visa Tracker Controller - Task 3

import { Request, Response } from 'express';
import logger from '../utils/logger';
import visaService from '../services/visaService';

/**
 * Get visa status - GET /api/visa/status
 */
export const getVisaStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const daysRemaining = await visaService.calculateDaysRemaining(userId);
    const isExpiringSoon = await visaService.checkExpiringSoon(userId);

    let gracePeriodEnd = null;
    if (user.visaDetails?.endDate && user.visaDetails?.currentType) {
      gracePeriodEnd = visaService.calculateGracePeriodEnd(
        user.visaDetails.endDate,
        user.visaDetails.currentType
      );
    }

    res.status(200).json({
      success: true,
      data: {
        visaDetails: user.visaDetails || null,
        daysRemaining,
        isExpiringSoon,
        gracePeriodEnd,
        // Legacy fields for backwards compatibility
        visaType: user.visaType,
        visaExpiryDate: user.visaExpiryDate,
      },
    });
  } catch (error: any) {
    logger.error('Error getting visa status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visa status',
      error: error.message,
    });
  }
};

/**
 * Update visa information - PUT /api/visa/update
 */
export const updateVisaInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const visaData = req.body;

    // Validate required fields
    if (!visaData.currentType) {
      res.status(400).json({
        success: false,
        message: 'Visa type is required',
      });
      return;
    }

    const updatedVisaDetails = await visaService.updateVisaInfo(userId, visaData);

    logger.info(`Visa info updated for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Visa information updated successfully',
      data: updatedVisaDetails,
    });
  } catch (error: any) {
    logger.error('Error updating visa info:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update visa information',
    });
  }
};

/**
 * Get important dates - GET /api/visa/important-dates
 */
export const getImportantDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const importantDates = user.importantDates || [];

    // Calculate days until for each date
    const datesWithDaysUntil = importantDates.map((date: any) => {
      const dateObj = new Date(date.date);
      const now = new Date();
      const diffTime = dateObj.getTime() - now.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...date.toObject(),
        daysUntil,
      };
    });

    res.status(200).json({
      success: true,
      data: datesWithDaysUntil,
    });
  } catch (error: any) {
    logger.error('Error getting important dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get important dates',
      error: error.message,
    });
  }
};

/**
 * Add important date - POST /api/visa/important-dates
 */
export const addImportantDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const dateData = req.body;

    // Validate required fields
    if (!dateData.title || !dateData.date) {
      res.status(400).json({
        success: false,
        message: 'Title and date are required',
      });
      return;
    }

    const newDate = await visaService.addImportantDate(userId, dateData);

    logger.info(`Important date added for user ${userId}: ${dateData.title}`);

    res.status(201).json({
      success: true,
      message: 'Important date added successfully',
      data: newDate,
    });
  } catch (error: any) {
    logger.error('Error adding important date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add important date',
      error: error.message,
    });
  }
};

/**
 * Update important date - PUT /api/visa/important-dates/:id
 */
export const updateImportantDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const dateId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const dateData = req.body;

    const updatedDate = await visaService.updateImportantDate(userId, dateId, dateData);

    logger.info(`Important date updated for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Important date updated successfully',
      data: updatedDate,
    });
  } catch (error: any) {
    logger.error('Error updating important date:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update important date',
    });
  }
};

/**
 * Delete important date - DELETE /api/visa/important-dates/:id
 */
export const deleteImportantDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const dateId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    await visaService.deleteImportantDate(userId, dateId);

    logger.info(`Important date deleted for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Important date deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting important date:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete important date',
    });
  }
};

/**
 * Get visa timeline - GET /api/visa/timeline
 */
export const getVisaTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const timeline = await visaService.getVisaTimeline(userId);

    res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    logger.error('Error getting visa timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visa timeline',
      error: error.message,
    });
  }
};

/**
 * Get visa recommendations - GET /api/visa/recommendations
 */
export const getVisaRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const recommendations = await visaService.getVisaRecommendations(userId);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    logger.error('Error getting visa recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visa recommendations',
      error: error.message,
    });
  }
};

export default {
  getVisaStatus,
  updateVisaInfo,
  getImportantDates,
  addImportantDate,
  updateImportantDate,
  deleteImportantDate,
  getVisaTimeline,
  getVisaRecommendations,
};
