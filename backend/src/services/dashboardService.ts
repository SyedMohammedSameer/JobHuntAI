// backend/src/services/dashboardService.ts

import { Types } from 'mongoose';
import Application from '../models/Application';
import Job from '../models/Job';
import User from '../models/User';
import Resume from '../models/Resume';
import CoverLetter from '../models/CoverLetter';
import logger from '../utils/logger';

interface DashboardStats {
  overview: {
    totalApplications: number;
    inReview: number;
    interviews: number;
    offers: number;
    rejected: number;
    savedJobs: number;
    responseRate: number;
    resumesUploaded: number;
    coverLettersGenerated: number;
  };
  visaStatus: {
    daysRemaining: number;
    urgency: 'critical' | 'warning' | 'safe';
    expiryDate: Date | null;
    visaType: string;
  } | null;
  recentActivity: ActivityItem[];
  trends: {
    weeklyApplications: number;
    monthlyApplications: number;
    interviewConversionRate: number;
    averageResponseTime: number;
  };
  aiUsage: {
    resumeTailoring: {
      used: number;
      limit: number;
      remaining: number;
    };
    coverLetterGeneration: {
      used: number;
      limit: number;
      remaining: number;
    };
    resetsAt: Date;
  };
}

interface ActivityItem {
  type: 'application' | 'saved_job' | 'resume_upload' | 'cover_letter' | 'interview' | 'offer';
  action: string;
  jobTitle?: string;
  companyName?: string;
  timestamp: Date;
  metadata?: any;
}

interface ApplicationsByStatus {
  saved: number;
  applied: number;
  inReview: number;
  interviewScheduled: number;
  interviewed: number;
  offerReceived: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  total: number;
  breakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

interface ApplicationTrends {
  period: 'week' | 'month' | 'quarter';
  applications: {
    date: string;
    count: number;
  }[];
  interviews: {
    date: string;
    count: number;
  }[];
  offers: {
    date: string;
    count: number;
  }[];
  successRate: number;
  interviewRate: number;
  offerRate: number;
}

class DashboardService {
  /**
   * Get complete dashboard statistics for a user
   */
  async getUserDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      logger.info('Fetching dashboard stats', { userId });

      const [
        applications,
        user,
        resumes,
        coverLetters,
        recentActivity
      ] = await Promise.all([
        Application.find({ userId: new Types.ObjectId(userId) }),
        User.findById(userId),
        Resume.find({ userId }),
        CoverLetter.find({ userId }),
        this.getRecentActivity(userId, 10)
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // Get saved jobs count from user's bookmarkedJobs
      const savedJobsCount = user.bookmarkedJobs?.length || 0;

      // Calculate overview statistics
      const overview = this.calculateOverviewStats(
        applications,
        savedJobsCount,
        resumes.length,
        coverLetters.length
      );

      // Get visa status
      const visaStatus = this.calculateVisaStatus(user);

      // Calculate trends
      const trends = this.calculateTrends(applications);

      // Get AI usage stats
      const aiUsage = this.getAIUsageStats(user);

      logger.info('Dashboard stats fetched successfully', { userId });

      return {
        overview,
        visaStatus,
        recentActivity,
        trends,
        aiUsage
      };
    } catch (error: any) {
      logger.error('Error fetching dashboard stats', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  }

  /**
   * Calculate overview statistics
   */
  private calculateOverviewStats(
    applications: any[],
    savedJobsCount: number,
    resumesCount: number,
    coverLettersCount: number
  ) {
    const totalApplications = applications.length;
    const inReview = applications.filter(a => a.status === 'IN_REVIEW').length;
    const interviews = applications.filter(a => 
      a.status === 'INTERVIEW_SCHEDULED' || a.status === 'INTERVIEWED'
    ).length;
    const offers = applications.filter(a => 
      a.status === 'OFFER_RECEIVED' || a.status === 'ACCEPTED'
    ).length;
    const rejected = applications.filter(a => 
      a.status === 'REJECTED' || a.status === 'WITHDRAWN'
    ).length;

    // Calculate response rate (applications with any response / total applications)
    const responsesReceived = applications.filter(a => 
      a.status !== 'APPLIED' && a.status !== 'SAVED'
    ).length;
    const responseRate = totalApplications > 0 
      ? Math.round((responsesReceived / totalApplications) * 100) 
      : 0;

    return {
      totalApplications,
      inReview,
      interviews,
      offers,
      rejected,
      savedJobs: savedJobsCount,
      responseRate,
      resumesUploaded: resumesCount,
      coverLettersGenerated: coverLettersCount
    };
  }

  /**
   * Calculate visa status and countdown
   */
  private calculateVisaStatus(user: any) {
    if (!user.visaExpiryDate) {
      return null;
    }

    const expiryDate = new Date(user.visaExpiryDate);
    const today = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let urgency: 'critical' | 'warning' | 'safe';
    if (daysRemaining <= 30) {
      urgency = 'critical';
    } else if (daysRemaining <= 90) {
      urgency = 'warning';
    } else {
      urgency = 'safe';
    }

    return {
      daysRemaining: Math.max(0, daysRemaining),
      urgency,
      expiryDate,
      visaType: user.visaType || 'Unknown'
    };
  }

  /**
   * Calculate application trends
   */
  private calculateTrends(applications: any[]) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyApplications = applications.filter(a => 
      a.appliedDate && new Date(a.appliedDate) >= oneWeekAgo
    ).length;

    const monthlyApplications = applications.filter(a => 
      a.appliedDate && new Date(a.appliedDate) >= oneMonthAgo
    ).length;

    // Calculate interview conversion rate
    const totalApplied = applications.filter(a => 
      a.status !== 'SAVED'
    ).length;
    const interviewsReceived = applications.filter(a => 
      a.status === 'INTERVIEW_SCHEDULED' || 
      a.status === 'INTERVIEWED' || 
      a.status === 'OFFER_RECEIVED' ||
      a.status === 'ACCEPTED'
    ).length;
    const interviewConversionRate = totalApplied > 0 
      ? Math.round((interviewsReceived / totalApplied) * 100) 
      : 0;

    // Calculate average response time (in days)
    const applicationsWithResponse = applications.filter(a => 
      a.status !== 'APPLIED' && 
      a.status !== 'SAVED' && 
      a.statusHistory && 
      a.statusHistory.length > 1
    );
    const avgResponseTime = applicationsWithResponse.length > 0
      ? Math.round(
          applicationsWithResponse.reduce((sum, a) => {
            const applied = new Date(a.appliedDate || a.createdAt).getTime();
            const responded = new Date(a.statusHistory[1].date).getTime();
            return sum + (responded - applied) / (1000 * 60 * 60 * 24);
          }, 0) / applicationsWithResponse.length
        )
      : 0;

    return {
      weeklyApplications,
      monthlyApplications,
      interviewConversionRate,
      averageResponseTime: avgResponseTime
    };
  }

  /**
   * Get AI usage statistics
   */
  private getAIUsageStats(user: any) {
    const plan = user.subscription?.plan || 'FREE';
    const resumeLimit = plan === 'PREMIUM' ? 50 : 3;
    const coverLetterLimit = plan === 'PREMIUM' ? 50 : 3;

    const resumeUsage = user.aiUsage?.resumeTailoring || { count: 0, lastReset: new Date() };
    const coverLetterUsage = user.aiUsage?.coverLetterGeneration || { count: 0, lastReset: new Date() };

    // Calculate next reset time (midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      resumeTailoring: {
        used: resumeUsage.count || 0,
        limit: resumeLimit,
        remaining: Math.max(0, resumeLimit - (resumeUsage.count || 0))
      },
      coverLetterGeneration: {
        used: coverLetterUsage.count || 0,
        limit: coverLetterLimit,
        remaining: Math.max(0, coverLetterLimit - (coverLetterUsage.count || 0))
      },
      resetsAt: tomorrow
    };
  }

  /**
   * Get recent activity for the user
   */
  async getRecentActivity(userId: string, limit: number = 20): Promise<ActivityItem[]> {
    try {
      logger.info('Fetching recent activity', { userId, limit });

      const activities: ActivityItem[] = [];

      // Fetch recent applications
      const recentApplications = await Application.find({ 
        userId: new Types.ObjectId(userId) 
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('jobId');

      for (const app of recentApplications) {
        const job = app.jobId as any;
        if (app.appliedDate) {
          activities.push({
            type: 'application',
            action: `Applied to ${job?.title || 'a position'}`,
            jobTitle: job?.title,
            companyName: job?.company,
            timestamp: app.appliedDate,
            metadata: { status: app.status }
          });
        }

        // Add interview activity if exists
        if (app.interviewDates && app.interviewDates.length > 0) {
          app.interviewDates.forEach((date: Date) => {
            activities.push({
              type: 'interview',
              action: `Interview scheduled for ${job?.title || 'a position'}`,
              jobTitle: job?.title,
              companyName: job?.company,
              timestamp: date,
              metadata: { status: 'scheduled' }
            });
          });
        }

        // Add offer activity if exists
        if (app.status === 'OFFER_RECEIVED' || app.status === 'ACCEPTED') {
          activities.push({
            type: 'offer',
            action: `Received offer from ${job?.company || 'company'}`,
            jobTitle: job?.title,
            companyName: job?.company,
            timestamp: app.updatedAt,
            metadata: { status: 'received' }
          });
        }
      }

      // Fetch recently saved jobs from user
      const user = await User.findById(userId).populate('bookmarkedJobs');
      if (user && user.bookmarkedJobs) {
        const recentBookmarks = user.bookmarkedJobs.slice(0, 10) as any[];
        for (const job of recentBookmarks) {
          if (job) {
            activities.push({
              type: 'saved_job',
              action: `Saved ${job.title}`,
              jobTitle: job.title,
              companyName: job.company,
              timestamp: job.createdAt || new Date(),
              metadata: { location: job.location }
            });
          }
        }
      }

      // Fetch recent resumes
      const recentResumes = await Resume.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);

      for (const resume of recentResumes) {
        activities.push({
          type: 'resume_upload',
          action: resume.type === 'TAILORED' 
            ? 'Tailored resume with AI' 
            : 'Uploaded new resume',
          timestamp: resume.createdAt,
          metadata: { 
            type: resume.type,
            fileName: resume.fileName 
          }
        });
      }

      // Fetch recent cover letters
      const recentCoverLetters = await CoverLetter.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);

      for (const letter of recentCoverLetters) {
        activities.push({
          type: 'cover_letter',
          action: 'Generated cover letter with AI',
          timestamp: letter.createdAt,
          metadata: { 
            tone: letter.tone,
            generatedByAI: letter.generatedByAI 
          }
        });
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      logger.info('Recent activity fetched successfully', { 
        userId, 
        activityCount: activities.length 
      });

      return activities.slice(0, limit);
    } catch (error: any) {
      logger.error('Error fetching recent activity', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch recent activity: ${error.message}`);
    }
  }

  /**
   * Get applications grouped by status
   */
  async getApplicationsByStatus(userId: string): Promise<ApplicationsByStatus> {
    try {
      logger.info('Fetching applications by status', { userId });

      const applications = await Application.find({ 
        userId: new Types.ObjectId(userId) 
      });
      const total = applications.length;

      const statusCounts = {
        saved: applications.filter(a => a.status === 'SAVED').length,
        applied: applications.filter(a => a.status === 'APPLIED').length,
        inReview: applications.filter(a => a.status === 'IN_REVIEW').length,
        interviewScheduled: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
        interviewed: applications.filter(a => a.status === 'INTERVIEWED').length,
        offerReceived: applications.filter(a => a.status === 'OFFER_RECEIVED').length,
        accepted: applications.filter(a => a.status === 'ACCEPTED').length,
        rejected: applications.filter(a => a.status === 'REJECTED').length,
        withdrawn: applications.filter(a => a.status === 'WITHDRAWN').length
      };

      const breakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));

      logger.info('Applications by status fetched successfully', { userId });

      return {
        ...statusCounts,
        total,
        breakdown
      };
    } catch (error: any) {
      logger.error('Error fetching applications by status', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch applications by status: ${error.message}`);
    }
  }

  /**
   * Get visa countdown information
   */
  async getVisaCountdown(userId: string) {
    try {
      logger.info('Fetching visa countdown', { userId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const visaStatus = this.calculateVisaStatus(user);

      logger.info('Visa countdown fetched successfully', { userId });

      return visaStatus;
    } catch (error: any) {
      logger.error('Error fetching visa countdown', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch visa countdown: ${error.message}`);
    }
  }

  /**
   * Get application trends over time
   */
  async getApplicationTrends(
    userId: string, 
    timeRange: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<ApplicationTrends> {
    try {
      logger.info('Fetching application trends', { userId, timeRange });

      const now = new Date();
      let startDate: Date;
      let days: number;

      switch (timeRange) {
        case 'week':
          days = 7;
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          days = 30;
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          days = 90;
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          break;
        default:
          days = 30;
          startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      const applications = await Application.find({ 
        userId: new Types.ObjectId(userId),
        appliedDate: { $gte: startDate }
      });

      // Group by date
      const applicationsByDate: { [key: string]: number } = {};
      const interviewsByDate: { [key: string]: number } = {};
      const offersByDate: { [key: string]: number } = {};

      applications.forEach(app => {
        if (app.appliedDate) {
          const dateKey = app.appliedDate.toISOString().split('T')[0];
          applicationsByDate[dateKey] = (applicationsByDate[dateKey] || 0) + 1;

          if (app.status === 'INTERVIEW_SCHEDULED' || 
              app.status === 'INTERVIEWED' || 
              app.status === 'OFFER_RECEIVED' ||
              app.status === 'ACCEPTED') {
            interviewsByDate[dateKey] = (interviewsByDate[dateKey] || 0) + 1;
          }

          if (app.status === 'OFFER_RECEIVED' || app.status === 'ACCEPTED') {
            offersByDate[dateKey] = (offersByDate[dateKey] || 0) + 1;
          }
        }
      });

      // Convert to array format
      const applicationsArray = Object.entries(applicationsByDate).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      const interviewsArray = Object.entries(interviewsByDate).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      const offersArray = Object.entries(offersByDate).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate rates
      const totalApplications = applications.length;
      const totalInterviews = applications.filter(a => 
        a.status === 'INTERVIEW_SCHEDULED' || 
        a.status === 'INTERVIEWED' ||
        a.status === 'OFFER_RECEIVED' ||
        a.status === 'ACCEPTED'
      ).length;
      const totalOffers = applications.filter(a => 
        a.status === 'OFFER_RECEIVED' || a.status === 'ACCEPTED'
      ).length;

      const successRate = totalApplications > 0 
        ? Math.round((totalOffers / totalApplications) * 100) 
        : 0;
      const interviewRate = totalApplications > 0 
        ? Math.round((totalInterviews / totalApplications) * 100) 
        : 0;
      const offerRate = totalInterviews > 0 
        ? Math.round((totalOffers / totalInterviews) * 100) 
        : 0;

      logger.info('Application trends fetched successfully', { userId });

      return {
        period: timeRange,
        applications: applicationsArray,
        interviews: interviewsArray,
        offers: offersArray,
        successRate,
        interviewRate,
        offerRate
      };
    } catch (error: any) {
      logger.error('Error fetching application trends', {
        userId,
        timeRange,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch application trends: ${error.message}`);
    }
  }
}

export default new DashboardService();