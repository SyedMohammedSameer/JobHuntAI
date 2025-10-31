// src/services/dashboardService.ts
// Dashboard Service - fetch dashboard statistics and data

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Dashboard Stats Type - matches backend response
 */
export interface DashboardStats {
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
    expiryDate: string | null;
    visaType: string;
  } | null;
  recentActivity: Array<{
    type: string;
    action: string;
    jobTitle?: string;
    companyName?: string;
    timestamp: string;
    metadata?: any;
  }>;
  trends: {
    weeklyApplications: number;
    monthlyApplications: number;
    interviewConversionRate: number;
    averageResponseTime: number;
  };
  aiUsage?: {
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
    resetsAt: string;
  };
}

/**
 * Dashboard Service
 */
class DashboardService {
  /**
   * Get complete dashboard statistics and data
   */
  async getDashboardData(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        '/api/dashboard/stats'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to fetch dashboard data');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get weekly activity chart data from trends endpoint
   */
  async getWeeklyActivity(): Promise<Array<{ date: string; applications: number }>> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          period: string;
          applications: Array<{ date: string; count: number }>;
        }>
      >('/api/dashboard/trends?range=week');

      if (response.data.success && response.data.data) {
        // Map the backend response to frontend format
        return response.data.data.applications.map(item => ({
          date: item.date,
          applications: item.count
        }));
      }

      // Return empty array if no data
      return [];
    } catch (error) {
      console.error('Failed to fetch weekly activity:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 20): Promise<Array<{
    type: string;
    action: string;
    jobTitle?: string;
    companyName?: string;
    timestamp: string;
  }>> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          activity: Array<{
            type: string;
            action: string;
            jobTitle?: string;
            companyName?: string;
            timestamp: string;
          }>;
        }>
      >(`/api/dashboard/activity?limit=${limit}`);

      if (response.data.success && response.data.data) {
        return response.data.data.activity;
      }

      throw new Error(response.data.message || 'Failed to fetch recent activity');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get visa countdown information
   */
  async getVisaCountdown(): Promise<{
    daysRemaining: number;
    urgency: 'critical' | 'warning' | 'safe';
    expiryDate: string;
    visaType: string;
  } | null> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          daysRemaining: number;
          urgency: 'critical' | 'warning' | 'safe';
          expiryDate: string;
          visaType: string;
        } | null>
      >('/api/dashboard/visa-countdown');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch visa countdown:', error);
      return null;
    }
  }

  /**
   * Get application trends
   */
  async getApplicationTrends(range: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    period: string;
    applications: Array<{ date: string; count: number }>;
    interviews: Array<{ date: string; count: number }>;
    offers: Array<{ date: string; count: number }>;
    successRate: number;
    interviewRate: number;
    offerRate: number;
  }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          period: string;
          applications: Array<{ date: string; count: number }>;
          interviews: Array<{ date: string; count: number }>;
          offers: Array<{ date: string; count: number }>;
          successRate: number;
          interviewRate: number;
          offerRate: number;
        }>
      >(`/api/dashboard/trends?range=${range}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to fetch application trends');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get applications by status
   */
  async getApplicationsByStatus(): Promise<{
    applied: number;
    inReview: number;
    interview: number;
    offer: number;
    rejected: number;
    total: number;
    breakdown: Array<{ status: string; count: number; percentage: number }>;
  }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          applied: number;
          inReview: number;
          interview: number;
          offer: number;
          rejected: number;
          total: number;
          breakdown: Array<{ status: string; count: number; percentage: number }>;
        }>
      >('/api/dashboard/applications-by-status');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to fetch applications by status');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
