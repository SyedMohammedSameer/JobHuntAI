// backend/src/services/applicationTrackingService.ts

import { Types } from 'mongoose';
import Application, { ApplicationStatus } from '../models/Application';
import Job from '../models/Job';
import logger from '../utils/logger';

interface CreateApplicationData {
  userId: string;
  jobId: string;
  status?: ApplicationStatus;
  notes?: string;
  resumeUsed?: string;
  coverLetterUsed?: string;
  interviewDates?: Date[];
  reminderDate?: Date;
}

interface UpdateApplicationData {
  status?: ApplicationStatus;
  notes?: string;
  interviewDates?: Date[];
  reminderDate?: Date;
  followUpDate?: Date;
  offerDetails?: {
    salary?: number;
    startDate?: Date;
    benefits?: string;
    location?: string;
    remote?: boolean;
  };
}

interface ApplicationMetrics {
  totalApplications: number;
  responseRate: number;
  averageResponseTime: number;
  interviewRate: number;
  offerRate: number;
  byCompany: {
    company: string;
    applications: number;
    interviews: number;
    offers: number;
    responseRate: number;
  }[];
  byJobType: {
    jobType: string;
    applications: number;
    successRate: number;
  }[];
  timeToInterview: {
    average: number;
    fastest: number;
    slowest: number;
  };
}

interface UpcomingInterview {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  interviewDate: Date;
  daysUntil: number;
  notes?: string;
  location?: string;
  status: string;
}

class ApplicationTrackingService {
  /**
   * Create a new application
   */
  async createApplication(data: CreateApplicationData) {
    try {
      logger.info('Creating new application', { 
        userId: data.userId, 
        jobId: data.jobId 
      });

      // Validate job exists
      const job = await Job.findById(data.jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Check if application already exists for this job
      const existingApp = await Application.findOne({
        userId: new Types.ObjectId(data.userId),
        jobId: new Types.ObjectId(data.jobId)
      });

      if (existingApp) {
        throw new Error('Application already exists for this job');
      }

      // Create application
      const application = await Application.create({
        userId: new Types.ObjectId(data.userId),
        jobId: new Types.ObjectId(data.jobId),
        status: data.status || 'APPLIED',
        appliedDate: new Date(),
        notes: data.notes,
        tailoredResumeId: data.resumeUsed ? new Types.ObjectId(data.resumeUsed) : undefined,
        coverLetterId: data.coverLetterUsed ? new Types.ObjectId(data.coverLetterUsed) : undefined,
        interviewDates: data.interviewDates || [],
        reminderDate: data.reminderDate,
        statusHistory: [{
          status: data.status || 'APPLIED',
          date: new Date(),
          notes: data.notes
        }]
      });

      logger.info('Application created successfully', { 
        applicationId: application._id 
      });

      return application;
    } catch (error: any) {
      logger.error('Error creating application', {
        error: error.message,
        stack: error.stack,
        data
      });
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    data: UpdateApplicationData
  ) {
    try {
      logger.info('Updating application status', { 
        applicationId, 
        userId,
        newStatus: data.status 
      });

      // Find application and verify ownership
      const application = await Application.findOne({
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId)
      });

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      // Validate status transition
      if (data.status) {
        this.validateStatusTransition(application.status, data.status);
        
        // Update status manually
        application.status = data.status;
        application.statusHistory.push({
          status: data.status,
          date: new Date(),
          notes: data.notes
        });
        
        // If status is APPLIED and no appliedDate yet, set it
        if (data.status === 'APPLIED' && !application.appliedDate) {
          application.appliedDate = new Date();
        }
      }

      // Update other fields
      if (data.notes && !data.status) application.notes = data.notes;
      if (data.interviewDates) application.interviewDates = data.interviewDates;
      if (data.reminderDate) application.reminderDate = data.reminderDate;
      if (data.followUpDate) application.followUpDate = data.followUpDate;
      if (data.offerDetails) application.offerDetails = data.offerDetails;

      await application.save();

      logger.info('Application updated successfully', { 
        applicationId,
        newStatus: application.status 
      });

      return application;
    } catch (error: any) {
      logger.error('Error updating application', {
        applicationId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to update application: ${error.message}`);
    }
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: { [key: string]: string[] } = {
      'SAVED': ['APPLIED', 'REJECTED', 'WITHDRAWN'],
      'APPLIED': ['IN_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'],
      'IN_REVIEW': ['INTERVIEW_SCHEDULED', 'REJECTED', 'OFFER_RECEIVED', 'WITHDRAWN'],
      'INTERVIEW_SCHEDULED': ['INTERVIEWED', 'REJECTED', 'IN_REVIEW', 'WITHDRAWN'],
      'INTERVIEWED': ['OFFER_RECEIVED', 'REJECTED', 'IN_REVIEW', 'WITHDRAWN'],
      'OFFER_RECEIVED': ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      'ACCEPTED': ['WITHDRAWN'], // Can withdraw accepted offer
      'REJECTED': [], // Terminal state
      'WITHDRAWN': [] // Terminal state
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`
      );
    }
  }

  /**
   * Get application timeline
   */
  async getApplicationTimeline(applicationId: string, userId: string) {
    try {
      logger.info('Fetching application timeline', { applicationId, userId });

      const application = await Application.findOne({
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId)
      }).populate('jobId');

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      // Sort timeline by date (oldest first)
      const timeline = application.statusHistory.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      logger.info('Application timeline fetched successfully', { 
        applicationId,
        timelineLength: timeline.length 
      });

      return {
        application,
        timeline,
        currentStatus: application.status,
        nextSteps: this.getNextSteps(application.status)
      };
    } catch (error: any) {
      logger.error('Error fetching application timeline', {
        applicationId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch application timeline: ${error.message}`);
    }
  }

  /**
   * Get suggested next steps based on current status
   */
  private getNextSteps(status: string): string[] {
    const nextSteps: { [key: string]: string[] } = {
      'SAVED': [
        'Review job requirements carefully',
        'Tailor your resume for this position',
        'Prepare a customized cover letter',
        'Submit your application'
      ],
      'APPLIED': [
        'Follow up after 1 week if no response',
        'Prepare for potential phone screening',
        'Research the company culture',
        'Update application status when you hear back'
      ],
      'IN_REVIEW': [
        'Prepare for technical interviews',
        'Review common interview questions',
        'Research the company and team',
        'Prepare questions to ask the interviewer'
      ],
      'INTERVIEW_SCHEDULED': [
        'Confirm interview details (date, time, location)',
        'Prepare answers to behavioral questions',
        'Practice technical problems',
        'Research the interviewers on LinkedIn',
        'Plan your route if in-person'
      ],
      'INTERVIEWED': [
        'Send thank-you email within 24 hours',
        'Follow up on timeline if not provided',
        'Reflect on interview performance',
        'Prepare for potential next rounds'
      ],
      'OFFER_RECEIVED': [
        'Review offer details carefully',
        'Negotiate if appropriate',
        'Ask about visa sponsorship timeline',
        'Get everything in writing',
        'Respond by deadline'
      ],
      'ACCEPTED': [
        'Complete onboarding paperwork',
        'Coordinate start date',
        'Begin visa sponsorship process if applicable',
        'Notify other companies'
      ],
      'REJECTED': [
        'Request feedback if possible',
        'Update your materials based on feedback',
        'Stay connected with recruiters',
        'Apply to similar positions'
      ],
      'WITHDRAWN': [
        'Consider applying again in the future',
        'Update your job search strategy',
        'Focus on other opportunities'
      ]
    };

    return nextSteps[status] || ['Update application status as it progresses'];
  }

  /**
   * Get all applications for a specific job
   */
  async getApplicationsByJob(userId: string, jobId: string) {
    try {
      logger.info('Fetching applications by job', { userId, jobId });

      const applications = await Application.find({
        userId: new Types.ObjectId(userId),
        jobId: new Types.ObjectId(jobId)
      }).sort({ appliedDate: -1 });

      logger.info('Applications by job fetched successfully', { 
        userId,
        jobId,
        count: applications.length 
      });

      return applications;
    } catch (error: any) {
      logger.error('Error fetching applications by job', {
        userId,
        jobId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch applications by job: ${error.message}`);
    }
  }

  /**
   * Get upcoming interviews
   */
  async getUpcomingInterviews(userId: string, days: number = 30): Promise<UpcomingInterview[]> {
    try {
      logger.info('Fetching upcoming interviews', { userId, days });

      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const applications = await Application.find({
        userId: new Types.ObjectId(userId),
        status: { $in: ['INTERVIEW_SCHEDULED', 'INTERVIEWED'] },
        interviewDates: {
          $elemMatch: {
            $gte: now,
            $lte: futureDate
          }
        }
      })
        .populate('jobId')
        .sort({ 'interviewDates': 1 });

      const interviews: UpcomingInterview[] = [];
      
      applications.forEach(app => {
        const job = app.jobId as any;
        
        // Get only future interview dates
        const futureInterviews = app.interviewDates?.filter(date => 
          new Date(date) >= now && new Date(date) <= futureDate
        ) || [];

        futureInterviews.forEach(interviewDate => {
          const daysUntil = Math.ceil(
            (new Date(interviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          interviews.push({
            applicationId: app._id.toString(),
            jobId: job._id.toString(),
            jobTitle: job.title,
            company: job.company,
            interviewDate,
            daysUntil,
            notes: app.notes,
            location: job.location,
            status: app.status
          });
        });
      });

      // Sort by date
      interviews.sort((a, b) => 
        new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime()
      );

      logger.info('Upcoming interviews fetched successfully', { 
        userId,
        count: interviews.length 
      });

      return interviews;
    } catch (error: any) {
      logger.error('Error fetching upcoming interviews', {
        userId,
        days,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch upcoming interviews: ${error.message}`);
    }
  }

  /**
   * Get application metrics and analytics
   */
  async getApplicationMetrics(userId: string): Promise<ApplicationMetrics> {
    try {
      logger.info('Calculating application metrics', { userId });

      const applications = await Application.find({
        userId: new Types.ObjectId(userId)
      }).populate('jobId');

      const totalApplications = applications.filter(a => a.status !== 'SAVED').length;
      
      // Calculate response rate
      const responsesReceived = applications.filter(a => 
        a.status !== 'APPLIED' && a.status !== 'SAVED'
      ).length;
      const responseRate = totalApplications > 0 
        ? Math.round((responsesReceived / totalApplications) * 100) 
        : 0;

      // Calculate average response time
      const applicationsWithResponse = applications.filter(a => 
        a.status !== 'APPLIED' && a.status !== 'SAVED' && a.statusHistory.length > 1
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

      // Calculate interview rate
      const interviews = applications.filter(a => 
        a.status === 'INTERVIEW_SCHEDULED' || 
        a.status === 'INTERVIEWED' ||
        a.status === 'OFFER_RECEIVED' ||
        a.status === 'ACCEPTED'
      ).length;
      const interviewRate = totalApplications > 0 
        ? Math.round((interviews / totalApplications) * 100) 
        : 0;

      // Calculate offer rate
      const offers = applications.filter(a => 
        a.status === 'OFFER_RECEIVED' || a.status === 'ACCEPTED'
      ).length;
      const offerRate = totalApplications > 0 
        ? Math.round((offers / totalApplications) * 100) 
        : 0;

      // Group by company
      const companiesMap = new Map();
      applications.forEach(app => {
        const job = app.jobId as any;
        if (!job) return;

        const company = job.company;
        if (!companiesMap.has(company)) {
          companiesMap.set(company, {
            company,
            applications: 0,
            interviews: 0,
            offers: 0
          });
        }

        const stats = companiesMap.get(company);
        stats.applications++;
        if (app.status === 'INTERVIEW_SCHEDULED' || 
            app.status === 'INTERVIEWED' ||
            app.status === 'OFFER_RECEIVED' ||
            app.status === 'ACCEPTED') {
          stats.interviews++;
        }
        if (app.status === 'OFFER_RECEIVED' || app.status === 'ACCEPTED') {
          stats.offers++;
        }
      });

      const byCompany = Array.from(companiesMap.values())
        .map(stats => ({
          ...stats,
          responseRate: stats.applications > 0 
            ? Math.round(((stats.interviews + stats.offers) / stats.applications) * 100)
            : 0
        }))
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 10); // Top 10 companies

      // Group by job type
      const jobTypesMap = new Map();
      applications.forEach(app => {
        const job = app.jobId as any;
        if (!job) return;

        const jobType = job.jobType || 'Unknown';
        if (!jobTypesMap.has(jobType)) {
          jobTypesMap.set(jobType, {
            jobType,
            applications: 0,
            successes: 0
          });
        }

        const stats = jobTypesMap.get(jobType);
        stats.applications++;
        if (app.status === 'OFFER_RECEIVED' || app.status === 'ACCEPTED') {
          stats.successes++;
        }
      });

      const byJobType = Array.from(jobTypesMap.values())
        .map(stats => ({
          jobType: stats.jobType,
          applications: stats.applications,
          successRate: stats.applications > 0 
            ? Math.round((stats.successes / stats.applications) * 100)
            : 0
        }))
        .sort((a, b) => b.applications - a.applications);

      // Calculate time to interview
      const interviewApps = applications.filter(a => 
        (a.status === 'INTERVIEW_SCHEDULED' || 
         a.status === 'INTERVIEWED' ||
         a.status === 'OFFER_RECEIVED' ||
         a.status === 'ACCEPTED') && 
        a.statusHistory.length > 1
      );

      const timeToInterviewData = interviewApps.map(a => {
        const applied = new Date(a.appliedDate || a.createdAt).getTime();
        const interviewEntry = a.statusHistory.find(h => 
          h.status === 'INTERVIEW_SCHEDULED' || h.status === 'INTERVIEWED'
        );
        if (interviewEntry) {
          const interviewed = new Date(interviewEntry.date).getTime();
          return (interviewed - applied) / (1000 * 60 * 60 * 24);
        }
        return 0;
      }).filter(days => days > 0);

      const timeToInterview = {
        average: timeToInterviewData.length > 0 
          ? Math.round(timeToInterviewData.reduce((a, b) => a + b, 0) / timeToInterviewData.length)
          : 0,
        fastest: timeToInterviewData.length > 0 
          ? Math.round(Math.min(...timeToInterviewData))
          : 0,
        slowest: timeToInterviewData.length > 0 
          ? Math.round(Math.max(...timeToInterviewData))
          : 0
      };

      logger.info('Application metrics calculated successfully', { userId });

      return {
        totalApplications,
        responseRate,
        averageResponseTime: avgResponseTime,
        interviewRate,
        offerRate,
        byCompany,
        byJobType,
        timeToInterview
      };
    } catch (error: any) {
      logger.error('Error calculating application metrics', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to calculate application metrics: ${error.message}`);
    }
  }

  /**
   * Get applications with filters and pagination
   */
  async getApplications(
    userId: string,
    filters: {
      status?: ApplicationStatus;
      jobId?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    try {
      logger.info('Fetching applications with filters', { userId, filters, pagination });

      const query: any = { userId: new Types.ObjectId(userId) };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.jobId) {
        query.jobId = new Types.ObjectId(filters.jobId);
      }

      if (filters.startDate || filters.endDate) {
        query.appliedDate = {};
        if (filters.startDate) {
          query.appliedDate.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.appliedDate.$lte = filters.endDate;
        }
      }

      // Pagination
      const page = pagination.page || 1;
      const limit = Math.min(pagination.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Sorting
      const sortBy = pagination.sortBy || 'appliedDate';
      const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      // Execute query
      const [applications, total] = await Promise.all([
        Application.find(query)
          .populate('jobId')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Application.countDocuments(query)
      ]);

      // Apply search filter after population (search in job title/company)
      let filteredApplications = applications;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredApplications = applications.filter(app => {
          const job = app.jobId as any;
          if (!job) return false;
          return (
            job.title.toLowerCase().includes(searchLower) ||
            job.company.toLowerCase().includes(searchLower)
          );
        });
      }

      logger.info('Applications fetched successfully', { 
        userId,
        count: filteredApplications.length,
        total 
      });

      return {
        applications: filteredApplications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      logger.error('Error fetching applications', {
        userId,
        filters,
        pagination,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }
  }

  /**
   * Delete an application
   */
  async deleteApplication(applicationId: string, userId: string) {
    try {
      logger.info('Deleting application', { applicationId, userId });

      const application = await Application.findOneAndDelete({
        _id: new Types.ObjectId(applicationId),
        userId: new Types.ObjectId(userId)
      });

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      logger.info('Application deleted successfully', { applicationId });

      return { success: true, message: 'Application deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting application', {
        applicationId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to delete application: ${error.message}`);
    }
  }
}

export default new ApplicationTrackingService();