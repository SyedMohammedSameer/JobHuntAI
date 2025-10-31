// src/services/subscriptionService.ts
// Subscription Service - handles all subscription-related API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Subscription Type Definitions
 */
export interface Subscription {
  plan: 'FREE' | 'PREMIUM';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  startDate?: Date;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  features: {
    maxResumeTailoring: number;
    maxCoverLetters: number;
    aiPriority: boolean;
    unlimitedBookmarks: boolean;
    advancedAnalytics?: boolean;
    emailAlerts?: boolean;
  };
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  invoice_url?: string;
}

export interface BillingInfo {
  customer: {
    email: string;
    name?: string;
  };
  paymentMethod?: {
    type: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  };
}

/**
 * Subscription Service
 */
class SubscriptionService {
  /**
   * Get current subscription
   */
  async getCurrentSubscription(): Promise<Subscription> {
    try {
      const response = await apiClient.get<ApiResponse<{ subscription: Subscription }>>(
        '/api/subscription/current'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.subscription;
      }

      throw new Error(response.data.message || 'Failed to get subscription');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Check if user has premium access
   */
  async checkPremiumAccess(): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ hasPremiumAccess: boolean }>>(
        '/api/subscription/premium-access'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.hasPremiumAccess;
      }

      return false;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        '/api/subscription/cancel'
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(
        '/api/subscription/reactivate'
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reactivate subscription');
      }
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ payments: PaymentHistory[] }>>(
        '/api/subscription/payment-history'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.payments;
      }

      throw new Error(response.data.message || 'Failed to get payment history');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get billing info
   */
  async getBillingInfo(): Promise<BillingInfo> {
    try {
      const response = await apiClient.get<ApiResponse<BillingInfo>>(
        '/api/subscription/billing-info'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get billing info');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Export singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;
