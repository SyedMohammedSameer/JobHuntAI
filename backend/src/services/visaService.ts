// backend/src/services/visaService.ts
// Visa Tracker Service - Task 3

import User, { IUser } from '../models/User';
import logger from '../utils/logger';

/**
 * Grace periods by visa type (in days)
 */
const GRACE_PERIODS: Record<string, number> = {
  F1: 60,
  OPT: 60,
  STEM_OPT: 60,
  H1B: 10,
  H4: 10,
  L1: 10,
  GREEN_CARD: 0,
  CITIZEN: 0,
  OTHER: 0,
};

/**
 * Calculate days remaining until visa expiry
 */
export const calculateDaysRemaining = async (userId: string): Promise<number | null> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const endDate = user.visaDetails?.endDate || user.visaExpiryDate;
    if (!endDate) {
      return null;
    }

    const now = new Date();
    const expiryDate = new Date(endDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    logger.error('Error calculating days remaining:', error);
    throw error;
  }
};

/**
 * Check if visa is expiring soon
 */
export const checkExpiringSoon = async (userId: string, days: number = 90): Promise<boolean> => {
  try {
    const daysRemaining = await calculateDaysRemaining(userId);
    if (daysRemaining === null) {
      return false;
    }

    return daysRemaining <= days && daysRemaining > 0;
  } catch (error) {
    logger.error('Error checking expiring soon:', error);
    throw error;
  }
};

/**
 * Get complete visa timeline with history
 */
export const getVisaTimeline = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const timeline = [];

    // Add visa history
    if (user.visaHistory && user.visaHistory.length > 0) {
      timeline.push(...user.visaHistory.map(visa => ({
        type: visa.visaType,
        startDate: visa.startDate,
        endDate: visa.endDate,
        status: visa.status,
        isCurrent: false,
      })));
    }

    // Add current visa
    if (user.visaDetails?.currentType) {
      timeline.push({
        type: user.visaDetails.currentType,
        startDate: user.visaDetails.startDate,
        endDate: user.visaDetails.endDate,
        status: 'ACTIVE',
        isCurrent: true,
      });
    }

    // Sort by start date
    timeline.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });

    return timeline;
  } catch (error) {
    logger.error('Error getting visa timeline:', error);
    throw error;
  }
};

/**
 * Validate visa dates
 */
export const validateVisaDates = (startDate: Date, endDate: Date): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    return false;
  }

  return true;
};

/**
 * Add important date
 */
export const addImportantDate = async (userId: string, dateData: any) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.importantDates) {
      user.importantDates = [];
    }

    user.importantDates.push(dateData);
    await user.save();

    return user.importantDates[user.importantDates.length - 1];
  } catch (error) {
    logger.error('Error adding important date:', error);
    throw error;
  }
};

/**
 * Update important date
 */
export const updateImportantDate = async (userId: string, dateId: string, data: any) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.importantDates) {
      throw new Error('No important dates found');
    }

    const dateIndex = user.importantDates.findIndex((d: any) => d._id.toString() === dateId);
    if (dateIndex === -1) {
      throw new Error('Important date not found');
    }

    // Update the date
    Object.assign(user.importantDates[dateIndex], data);
    await user.save();

    return user.importantDates[dateIndex];
  } catch (error) {
    logger.error('Error updating important date:', error);
    throw error;
  }
};

/**
 * Delete important date
 */
export const deleteImportantDate = async (userId: string, dateId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.importantDates) {
      throw new Error('No important dates found');
    }

    user.importantDates = user.importantDates.filter((d: any) => d._id.toString() !== dateId);
    await user.save();

    return { success: true };
  } catch (error) {
    logger.error('Error deleting important date:', error);
    throw error;
  }
};

/**
 * Get upcoming important dates
 */
export const getUpcomingDates = async (userId: string, days: number = 90) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.importantDates || user.importantDates.length === 0) {
      return [];
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingDates = user.importantDates.filter((date: any) => {
      const dateObj = new Date(date.date);
      return dateObj >= now && dateObj <= futureDate;
    });

    // Sort by date
    upcomingDates.sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return upcomingDates;
  } catch (error) {
    logger.error('Error getting upcoming dates:', error);
    throw error;
  }
};

/**
 * Calculate grace period end date
 */
export const calculateGracePeriodEnd = (endDate: Date, visaType: string): Date | null => {
  try {
    const graceDays = GRACE_PERIODS[visaType] || 0;
    if (graceDays === 0) {
      return null;
    }

    const graceEnd = new Date(endDate);
    graceEnd.setDate(graceEnd.getDate() + graceDays);

    return graceEnd;
  } catch (error) {
    logger.error('Error calculating grace period:', error);
    return null;
  }
};

/**
 * Get smart visa recommendations based on current status
 */
export const getVisaRecommendations = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const recommendations = [];
    const daysRemaining = await calculateDaysRemaining(userId);

    const visaType = user.visaDetails?.currentType || user.visaType || '';

    // Check if visa is expiring soon
    if (daysRemaining !== null && daysRemaining > 0) {
      if (daysRemaining <= 30) {
        recommendations.push({
          type: 'urgent',
          title: 'Visa Expiring Soon',
          message: `Your ${visaType} status expires in ${daysRemaining} days. Take action immediately.`,
          action: 'Review extension options',
        });
      } else if (daysRemaining <= 90) {
        recommendations.push({
          type: 'warning',
          title: 'Plan Ahead',
          message: `Your ${visaType} status expires in ${daysRemaining} days. Start planning your next steps.`,
          action: 'Explore visa options',
        });
      }
    }

    // OPT-specific recommendations
    if (visaType === 'OPT') {
      recommendations.push({
        type: 'info',
        title: 'Consider STEM OPT Extension',
        message: 'If you have a STEM degree, you may be eligible for a 24-month extension.',
        action: 'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students',
      });

      recommendations.push({
        type: 'info',
        title: 'H1B Filing Season',
        message: 'H1B registration typically opens in March. Start preparing early.',
        action: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations',
      });
    }

    // F1-specific recommendations
    if (visaType === 'F1') {
      recommendations.push({
        type: 'info',
        title: 'OPT Application',
        message: 'Apply for OPT 90 days before graduation, but no later than 60 days after.',
        action: 'https://studyinthestates.dhs.gov/students/opt-guide-for-f-1-students',
      });
    }

    // STEM OPT-specific recommendations
    if (visaType === 'STEM_OPT') {
      recommendations.push({
        type: 'info',
        title: 'H1B Preparation',
        message: 'Your STEM OPT gives you more time to secure H1B sponsorship.',
        action: 'https://www.myvisajobs.com/Visa-Sponsor/',
      });
    }

    // Check for upcoming important dates
    const upcomingDates = await getUpcomingDates(userId, 30);
    if (upcomingDates.length > 0) {
      recommendations.push({
        type: 'reminder',
        title: 'Upcoming Deadlines',
        message: `You have ${upcomingDates.length} important date(s) in the next 30 days.`,
        action: 'View important dates',
      });
    }

    return recommendations;
  } catch (error) {
    logger.error('Error getting visa recommendations:', error);
    throw error;
  }
};

/**
 * Update visa information
 */
export const updateVisaInfo = async (userId: string, visaData: any) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate dates if provided
    if (visaData.startDate && visaData.endDate) {
      if (!validateVisaDates(visaData.startDate, visaData.endDate)) {
        throw new Error('Invalid dates: End date must be after start date');
      }
    }

    // Calculate grace period days based on visa type
    if (visaData.currentType && !visaData.gracePeriodDays) {
      visaData.gracePeriodDays = GRACE_PERIODS[visaData.currentType] || 0;
    }

    // Update visa details
    user.visaDetails = {
      ...user.visaDetails,
      ...visaData,
    };

    // Also update the legacy fields for backwards compatibility
    if (visaData.currentType) {
      user.visaType = visaData.currentType as any;
    }
    if (visaData.endDate) {
      user.visaExpiryDate = visaData.endDate;
    }

    await user.save();

    return user.visaDetails;
  } catch (error) {
    logger.error('Error updating visa info:', error);
    throw error;
  }
};

export default {
  calculateDaysRemaining,
  checkExpiringSoon,
  getVisaTimeline,
  validateVisaDates,
  addImportantDate,
  updateImportantDate,
  deleteImportantDate,
  getUpcomingDates,
  calculateGracePeriodEnd,
  getVisaRecommendations,
  updateVisaInfo,
};
