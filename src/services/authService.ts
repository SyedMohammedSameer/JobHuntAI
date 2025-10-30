// src/services/authService.ts
// Authentication Service - handles all auth-related API calls

import apiClient, { ApiResponse, handleApiError, tokenManager } from '../lib/api';

/**
 * User Type Definitions
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionTier: 'FREE' | 'PREMIUM';
  visaType?: string;
  visaExpiryDate?: string;
  university?: string;
  major?: string;
  graduationDate?: string;
  profilePicture?: string;
  isActive?: boolean;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  university?: string;
  major?: string;
  graduationDate?: string;
  visaType?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth Service
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/auth/register',
        data
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        
        // Store tokens
        tokenManager.setTokens(accessToken, refreshToken);
        
        return response.data.data;
      }

      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/api/auth/login',
        credentials
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;
        
        // Store tokens
        tokenManager.setTokens(accessToken, refreshToken);
        
        return response.data.data;
      }

      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    tokenManager.clearTokens();
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>(
        '/api/auth/profile'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.user;
      }

      throw new Error(response.data.message || 'Failed to get user profile');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<{ user: User }>>(
        '/api/auth/profile',
        data
      );

      if (response.data.success && response.data.data) {
        return response.data.data.user;
      }

      throw new Error(response.data.message || 'Failed to update profile');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse>(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.getAccessToken() !== null;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<
        ApiResponse<{ accessToken: string; refreshToken: string }>
      >('/api/auth/refresh-token', {
        refreshToken,
      });

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        tokenManager.setTokens(accessToken, newRefreshToken);
        
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to refresh token');
    } catch (error) {
      // If refresh fails, clear tokens and throw
      tokenManager.clearTokens();
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;