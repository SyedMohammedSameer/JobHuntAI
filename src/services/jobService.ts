// src/services/jobService.ts
// Job Service - handles all job-related API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Job Type Definitions
 */
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  visaSponsorship: {
    h1b: boolean;
    opt: boolean;
    stemOpt: boolean;
  };
  source: string;
  sourceJobId: string;
  sourceUrl: string;
  skillsRequired: string[];
  industryTags: string[];
  postedDate: string;
  expiryDate?: string;
  isActive: boolean;
  isFeatured: boolean;
  matchScore?: number;
  isBookmarked?: boolean;
}

export interface JobSearchFilters {
  query?: string;
  location?: string;
  remote?: boolean;
  employmentType?: string;
  visaSponsorship?: 'h1b' | 'opt' | 'stemOpt';
  experienceLevel?: string;
  salaryMin?: number;
  page?: number;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: Job[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface BookmarkedJobsResponse {
  bookmarkedJobs: Array<{
    _id: string;
    jobId: Job;
    bookmarkedAt: string;
  }>;
}

/**
 * Job Service
 */
class JobService {
  /**
   * Search for jobs with filters
   */
  async searchJobs(filters: JobSearchFilters = {}): Promise<JobSearchResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.query) params.append('query', filters.query);
      if (filters.location) params.append('location', filters.location);
      if (filters.remote !== undefined) params.append('remote', String(filters.remote));
      if (filters.employmentType) params.append('employmentType', filters.employmentType);
      if (filters.visaSponsorship) params.append('visaSponsorship', filters.visaSponsorship);
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.salaryMin) params.append('salaryMin', String(filters.salaryMin));
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await apiClient.get<ApiResponse<JobSearchResponse>>(
        `/api/jobs/search?${params.toString()}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to search jobs');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string): Promise<Job> {
    try {
      const response = await apiClient.get<ApiResponse<{ job: Job }>>(
        `/api/jobs/${jobId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.job;
      }

      throw new Error(response.data.message || 'Failed to get job details');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Bookmark a job
   */
  async bookmarkJob(jobId: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse>(
        `/api/jobs/${jobId}/bookmark`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to bookmark job');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Unbookmark a job
   */
  async unbookmarkJob(jobId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/api/jobs/${jobId}/bookmark`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to unbookmark job');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get bookmarked jobs
   */
  async getBookmarkedJobs(): Promise<Job[]> {
    try {
      const response = await apiClient.get<ApiResponse<BookmarkedJobsResponse>>(
        '/api/jobs/bookmarked/list'
      );

      if (response.data.success && response.data.data) {
        // Extract job details from bookmarked jobs
        return response.data.data.bookmarkedJobs.map(bookmark => ({
          ...bookmark.jobId,
          isBookmarked: true
        }));
      }

      throw new Error(response.data.message || 'Failed to get bookmarked jobs');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recommended jobs based on user profile
   */
  async getRecommendedJobs(limit: number = 10): Promise<Job[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ jobs: Job[] }>>(
        `/api/jobs/recommended?limit=${limit}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.jobs;
      }

      throw new Error(response.data.message || 'Failed to get recommended jobs');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const jobService = new JobService();
export default jobService;
