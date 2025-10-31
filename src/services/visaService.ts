// src/services/visaService.ts
// Visa Service - handles all visa-related API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Visa Type Definitions
 */
export interface VisaDetails {
  currentType: string;
  startDate?: Date;
  endDate?: Date;
  gracePeriodDays?: number;
  i20Number?: string;
  eadNumber?: string;
  sevisId?: string;
}

export interface ImportantDate {
  _id?: string;
  type: string;
  title: string;
  date: Date;
  reminder: boolean;
  reminderDays?: number;
  notes?: string;
  daysUntil?: number;
}

export interface VisaTimelineItem {
  type: string;
  startDate?: Date;
  endDate?: Date;
  status: string;
  isCurrent: boolean;
}

export interface VisaRecommendation {
  type: 'urgent' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  action: string;
}

export interface VisaStatus {
  visaDetails: VisaDetails | null;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  gracePeriodEnd: Date | null;
  visaType?: string;
  visaExpiryDate?: Date;
}

/**
 * Visa Service
 */
class VisaService {
  /**
   * Get current visa status
   */
  async getVisaStatus(): Promise<VisaStatus> {
    try {
      const response = await apiClient.get<ApiResponse<VisaStatus>>('/api/visa/status');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get visa status');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update visa information
   */
  async updateVisaInfo(visaData: Partial<VisaDetails>): Promise<VisaDetails> {
    try {
      const response = await apiClient.put<ApiResponse<VisaDetails>>(
        '/api/visa/update',
        visaData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to update visa information');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get all important dates
   */
  async getImportantDates(): Promise<ImportantDate[]> {
    try {
      const response = await apiClient.get<ApiResponse<ImportantDate[]>>(
        '/api/visa/important-dates'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get important dates');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add a new important date
   */
  async addImportantDate(dateData: Omit<ImportantDate, '_id' | 'daysUntil'>): Promise<ImportantDate> {
    try {
      const response = await apiClient.post<ApiResponse<ImportantDate>>(
        '/api/visa/important-dates',
        dateData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to add important date');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update an important date
   */
  async updateImportantDate(id: string, dateData: Partial<ImportantDate>): Promise<ImportantDate> {
    try {
      const response = await apiClient.put<ApiResponse<ImportantDate>>(
        `/api/visa/important-dates/${id}`,
        dateData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to update important date');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete an important date
   */
  async deleteImportantDate(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        `/api/visa/important-dates/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete important date');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get visa timeline
   */
  async getVisaTimeline(): Promise<VisaTimelineItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<VisaTimelineItem[]>>(
        '/api/visa/timeline'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get visa timeline');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get visa recommendations
   */
  async getRecommendations(): Promise<VisaRecommendation[]> {
    try {
      const response = await apiClient.get<ApiResponse<VisaRecommendation[]>>(
        '/api/visa/recommendations'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get recommendations');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
const visaService = new VisaService();
export default visaService;
