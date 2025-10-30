// src/services/dashboardService.ts
// Dashboard Service - fetch dashboard statistics and data

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Dashboard Stats Type
 */
export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  savedJobs: number;
  resumesGenerated: number;
  coverLettersGenerated: number;
}

/**
 * Recent Application Type
 */
export interface RecentApplication {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedDate: string;
  salary?: string;
}

/**
 * Dashboard Data Type
 */
export interface DashboardData {
  stats: DashboardStats;
  recentApplications: RecentApplication[];
  weeklyActivity: Array<{
    date: string;
    applications: number;
  }>;
}

/**
 * Dashboard Service
 */
class DashboardService {
  /**
   * Get dashboard statistics and data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardData>>(
        '/api/dashboard'
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
   * Get quick stats
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<{ stats: DashboardStats }>>(
        '/api/dashboard/stats'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.stats;
      }

      throw new Error(response.data.message || 'Failed to fetch stats');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recent applications
   */
  async getRecentApplications(limit: number = 5): Promise<RecentApplication[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ applications: RecentApplication[] }>
      >(`/api/dashboard/recent-applications?limit=${limit}`);

      if (response.data.success && response.data.data) {
        return response.data.data.applications;
      }

      throw new Error(response.data.message || 'Failed to fetch recent applications');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get weekly activity chart data
   */
  async getWeeklyActivity(): Promise<Array<{ date: string; applications: number }>> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ activity: Array<{ date: string; applications: number }> }>
      >('/api/dashboard/weekly-activity');

      if (response.data.success && response.data.data) {
        return response.data.data.activity;
      }

      throw new Error(response.data.message || 'Failed to fetch weekly activity');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;