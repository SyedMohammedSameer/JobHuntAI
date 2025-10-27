// backend/src/services/userProfileService.ts

import { Types } from 'mongoose';
import User from '../models/User';
import Resume from '../models/Resume';
import logger from '../utils/logger';

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  university?: string;
  major?: string;
  graduationYear?: number;
  currentYear?: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  graduationDate?: Date;
  degreeType?: string;
}

interface VisaStatusData {
  visaType?: 'F1' | 'OPT' | 'STEM_OPT' | 'H1B' | 'GREEN_CARD' | 'CITIZEN' | 'OTHER';
  visaExpiryDate?: Date;
  optStartDate?: Date;
  optEndDate?: Date;
  workAuthorization?: string;
}

interface JobPreferencesData {
  jobTypes?: string[];
  locations?: string[];
  remoteOnly?: boolean;
  visaSponsorshipRequired?: boolean;
  salaryMin?: number;
  salaryMax?: number;
}

interface ProfileCompleteness {
  percentage: number;
  completed: string[];
  missing: string[];
  recommendations: string[];
}

class UserProfileService {
  /**
   * Get complete user profile
   */
  async getUserProfile(userId: string) {
    try {
      logger.info('Fetching user profile', { userId });

      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get additional profile info
      const resumes = await Resume.find({ userId, type: 'BASE' });

      logger.info('User profile fetched successfully', { userId });

      return {
        user,
        hasResume: resumes.length > 0,
        resumeCount: resumes.length
      };
    } catch (error: any) {
      logger.error('Error fetching user profile', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  /**
   * Update profile information
   */
  async updateProfile(userId: string, updates: ProfileUpdateData) {
    try {
      logger.info('Updating user profile', { userId });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('User profile updated successfully', { userId });

      return user;
    } catch (error: any) {
      logger.error('Error updating user profile', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Update visa status
   */
  async updateVisaStatus(userId: string, visaData: VisaStatusData) {
    try {
      logger.info('Updating visa status', { userId });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: visaData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('Visa status updated successfully', { userId });

      return user;
    } catch (error: any) {
      logger.error('Error updating visa status', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to update visa status: ${error.message}`);
    }
  }

  /**
   * Update job preferences
   */
  async updateJobPreferences(userId: string, preferences: JobPreferencesData) {
    try {
      logger.info('Updating job preferences', { userId });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { jobPreferences: preferences } },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('Job preferences updated successfully', { userId });

      return user;
    } catch (error: any) {
      logger.error('Error updating job preferences', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to update job preferences: ${error.message}`);
    }
  }

  /**
   * Calculate profile completeness
   */
  async getProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
    try {
      logger.info('Calculating profile completeness', { userId });

      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const resumes = await Resume.find({ userId, type: 'BASE' });

      const completed: string[] = [];
      const missing: string[] = [];
      const recommendations: string[] = [];

      // Required fields (always present)
      completed.push('Email', 'Name');

      // Optional but important fields
      const checks = [
        { field: 'university', label: 'University', weight: 1 },
        { field: 'major', label: 'Major', weight: 1 },
        { field: 'graduationYear', label: 'Graduation Year', weight: 1 },
        { field: 'visaType', label: 'Visa Type', weight: 1.5 },
        { field: 'visaExpiryDate', label: 'Visa Expiry Date', weight: 1.5 },
        { field: 'jobPreferences', label: 'Job Preferences', weight: 2 },
      ];

      checks.forEach(check => {
        if (user[check.field as keyof typeof user]) {
          completed.push(check.label);
        } else {
          missing.push(check.label);
          if (check.weight >= 1.5) {
            recommendations.push(`Add your ${check.label.toLowerCase()} to improve job matching`);
          }
        }
      });

      // Resume check
      if (resumes.length > 0) {
        completed.push('Resume');
      } else {
        missing.push('Resume');
        recommendations.push('Upload your resume to apply for jobs and use AI tailoring');
      }

      // Job preferences details
      if (user.jobPreferences) {
        const prefs = user.jobPreferences;
        if (prefs.jobTypes && prefs.jobTypes.length > 0) {
          completed.push('Preferred Job Types');
        } else {
          missing.push('Preferred Job Types');
          recommendations.push('Set your preferred job types for better recommendations');
        }

        if (prefs.locations && prefs.locations.length > 0) {
          completed.push('Preferred Locations');
        } else {
          missing.push('Preferred Locations');
        }

        if (prefs.salaryMin && prefs.salaryMax) {
          completed.push('Salary Expectations');
        } else {
          missing.push('Salary Expectations');
        }
      } else {
        missing.push('Preferred Job Types', 'Preferred Locations', 'Salary Expectations');
      }

      // Calculate percentage (weighted)
      const totalFields = completed.length + missing.length;
      const percentage = Math.round((completed.length / totalFields) * 100);

      logger.info('Profile completeness calculated', { 
        userId, 
        percentage 
      });

      return {
        percentage,
        completed,
        missing,
        recommendations
      };
    } catch (error: any) {
      logger.error('Error calculating profile completeness', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to calculate profile completeness: ${error.message}`);
    }
  }
}

export default new UserProfileService();