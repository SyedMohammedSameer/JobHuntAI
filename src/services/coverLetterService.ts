// src/services/coverLetterService.ts
// Cover Letter Service - handles all cover letter-related API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Cover Letter Type Definitions
 */
export type CoverLetterTone = 'professional' | 'enthusiastic' | 'conservative' | 'creative';

export interface CoverLetter {
  _id: string;
  userId: string;
  jobId?: string;
  resumeId?: string;
  content: string;
  jobTitle: string;
  company: string;
  tone: CoverLetterTone;
  generatedByAI: boolean;
  aiModel?: string;
  metadata?: {
    wordCount?: number;
    tokensUsed?: number;
    estimatedCost?: number;
    qualityScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCoverLetterRequest {
  jobId: string;
  resumeId?: string;
  tone?: CoverLetterTone;
  additionalInfo?: string;
}

export interface GenerateCoverLetterResponse {
  coverLetter: CoverLetter;
  tokensUsed: number;
  estimatedCost: number;
}

/**
 * Cover Letter Service
 */
class CoverLetterService {
  /**
   * Generate a new cover letter
   */
  async generateCoverLetter(
    request: GenerateCoverLetterRequest
  ): Promise<GenerateCoverLetterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<GenerateCoverLetterResponse>>(
        '/api/cover-letters/generate',
        request
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to generate cover letter');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all cover letters for the current user
   */
  async getCoverLetters(): Promise<CoverLetter[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ coverLetters: CoverLetter[] }>>(
        '/api/cover-letters'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.coverLetters;
      }

      throw new Error(response.data.message || 'Failed to get cover letters');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get a single cover letter by ID
   */
  async getCoverLetterById(coverLetterId: string): Promise<CoverLetter> {
    try {
      const response = await apiClient.get<ApiResponse<{ coverLetter: CoverLetter }>>(
        `/api/cover-letters/${coverLetterId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data.coverLetter;
      }

      throw new Error(response.data.message || 'Failed to get cover letter');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update a cover letter's content
   */
  async updateCoverLetter(
    coverLetterId: string,
    content: string
  ): Promise<CoverLetter> {
    try {
      const response = await apiClient.put<ApiResponse<{ coverLetter: CoverLetter }>>(
        `/api/cover-letters/${coverLetterId}`,
        { content }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.coverLetter;
      }

      throw new Error(response.data.message || 'Failed to update cover letter');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Regenerate a cover letter with a different tone
   */
  async regenerateCoverLetter(
    coverLetterId: string,
    tone: CoverLetterTone
  ): Promise<GenerateCoverLetterResponse> {
    try {
      const response = await apiClient.post<ApiResponse<GenerateCoverLetterResponse>>(
        `/api/cover-letters/${coverLetterId}/regenerate`,
        { tone }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to regenerate cover letter');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Download a cover letter as a text file
   */
  async downloadCoverLetter(coverLetterId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/cover-letters/${coverLetterId}/download`,
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
   * Delete a cover letter
   */
  async deleteCoverLetter(coverLetterId: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse>(
        `/api/cover-letters/${coverLetterId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete cover letter');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get cover letter statistics
   */
  async getCoverLetterStats(): Promise<{
    totalCoverLetters: number;
    averageQualityScore: number;
    mostUsedTone: CoverLetterTone;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<{
        totalCoverLetters: number;
        averageQualityScore: number;
        mostUsedTone: CoverLetterTone;
      }>>('/api/cover-letters/stats');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get cover letter stats');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const coverLetterService = new CoverLetterService();
export default coverLetterService;
