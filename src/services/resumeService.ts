// src/services/resumeService.ts
// Resume Service - handles all resume-related API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Resume Type Definitions
 */
export interface Resume {
  _id: string;
  userId: string;
  fileName: string;
  originalText: string;
  tailoredContent?: string;
  type: 'BASE' | 'TAILORED';
  baseResumeId?: string;
  jobId?: string;
  metadata?: {
    wordCount?: number;
    format?: string;
    keywords?: string[];
    atsScore?: number;
    tailoredFor?: {
      jobTitle: string;
      company: string;
      jobId: string;
    };
    sections?: {
      experience: string;
      education: string;
      skills: string;
      summary: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface TailorResumeResponse {
  resume: Resume;
  tokensUsed: number;
  estimatedCost: number;
}

/**
 * Resume Service
 */
class ResumeService {
  /**
   * Upload a resume file
   */
  async uploadResume(file: File): Promise<Resume> {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await apiClient.post<ApiResponse<{ resume: Resume }>>(
        '/api/resumes/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.resume;
      }

      throw new Error(response.data.message || 'Failed to upload resume');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all resumes for the current user
   */
  async getResumes(): Promise<Resume[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ resumes: Resume[] }>>(
        '/api/resumes'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.resumes;
      }

      throw new Error(response.data.message || 'Failed to get resumes');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get a single resume by ID
   */
  async getResumeById(resumeId: string): Promise<Resume> {
    try {
      const response = await apiClient.get<ApiResponse<{ resume: Resume }>>(
        `/api/resumes/${resumeId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.resume;
      }

      throw new Error(response.data.message || 'Failed to get resume');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Tailor a resume for a specific job
   */
  async tailorResume(resumeId: string, jobId: string): Promise<TailorResumeResponse> {
    try {
      const response = await apiClient.post<ApiResponse<TailorResumeResponse>>(
        `/api/resumes/${resumeId}/tailor`,
        { jobId }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to tailor resume');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Download a resume
   */
  async downloadResume(resumeId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/resumes/${resumeId}/download`,
        {
          responseType: 'blob',
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a resume
   */
  async deleteResume(resumeId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/api/resumes/${resumeId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete resume');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get resume statistics
   */
  async getResumeStats(): Promise<{
    totalResumes: number;
    tailoredResumes: number;
    averageAtsScore: number;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        totalResumes: number;
        tailoredResumes: number;
        averageAtsScore: number;
      }>>('/api/resumes/stats');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get resume stats');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const resumeService = new ResumeService();
export default resumeService;
