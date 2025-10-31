// src/services/applicationService.ts
// Application Service - handles all application tracking API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';
import { Job } from './jobService';

/**
 * Application Type Definitions
 */
export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'IN_REVIEW'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFER_RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  date: string;
  notes?: string;
}

export interface ApplicationContact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface OfferDetails {
  salary?: number;
  benefits?: string;
  startDate?: string;
  location?: string;
  remote?: boolean;
}

export interface Application {
  _id: string;
  userId: string;
  jobId: Job;
  status: ApplicationStatus;
  statusHistory: StatusHistoryEntry[];
  appliedDate?: string;
  tailoredResumeId?: string;
  coverLetterId?: string;
  matchScore?: number;
  notes?: string;
  followUpDate?: string;
  interviewDates?: string[];
  contacts?: ApplicationContact[];
  offerDetails?: OfferDetails;
  reminderSet: boolean;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  jobId: string;
  status?: ApplicationStatus;
  notes?: string;
  tailoredResumeId?: string;
  coverLetterId?: string;
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  notes?: string;
}

export interface AddInterviewRequest {
  date: string;
  type?: string;
  notes?: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

/**
 * Application Service
 */
class ApplicationService {
  /**
   * Create a new application
   */
  async createApplication(data: CreateApplicationRequest): Promise<Application> {
    try {
      const response = await apiClient.post<ApiResponse<{ application: Application }>>(
        '/api/applications',
        data
      );

      if (response.data.success && response.data.data) {
        return response.data.data.application;
      }

      throw new Error(response.data.message || 'Failed to create application');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all applications with optional filters
   */
  async getApplications(filters: ApplicationFilters = {}): Promise<ApplicationsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await apiClient.get<ApiResponse<ApplicationsResponse>>(
        `/api/applications?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get applications');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get a single application by ID
   */
  async getApplicationById(applicationId: string): Promise<Application> {
    try {
      const response = await apiClient.get<ApiResponse<{ application: Application }>>(
        `/api/applications/${applicationId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.application;
      }

      throw new Error(response.data.message || 'Failed to get application');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    data: UpdateApplicationStatusRequest
  ): Promise<Application> {
    try {
      const response = await apiClient.put<ApiResponse<{ application: Application }>>(
        `/api/applications/${applicationId}/status`,
        data
      );

      if (response.data.success && response.data.data) {
        return response.data.data.application;
      }

      throw new Error(response.data.message || 'Failed to update application status');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add an interview to an application
   */
  async addInterview(
    applicationId: string,
    data: AddInterviewRequest
  ): Promise<Application> {
    try {
      const response = await apiClient.post<ApiResponse<{ application: Application }>>(
        `/api/applications/${applicationId}/interviews`,
        data
      );

      if (response.data.success && response.data.data) {
        return response.data.data.application;
      }

      throw new Error(response.data.message || 'Failed to add interview');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update application notes
   */
  async updateNotes(applicationId: string, notes: string): Promise<Application> {
    try {
      const response = await apiClient.put<ApiResponse<{ application: Application }>>(
        `/api/applications/${applicationId}`,
        { notes }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.application;
      }

      throw new Error(response.data.message || 'Failed to update notes');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete an application
   */
  async deleteApplication(applicationId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/api/applications/${applicationId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete application');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<{
    totalApplications: number;
    byStatus: Record<ApplicationStatus, number>;
    responseRate: number;
    averageMatchScore: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        totalApplications: number;
        byStatus: Record<ApplicationStatus, number>;
        responseRate: number;
        averageMatchScore: number;
      }>>('/api/applications/stats');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get application stats');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const applicationService = new ApplicationService();
export default applicationService;
