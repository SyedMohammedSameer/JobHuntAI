// src/services/paymentService.ts
// Payment Service - handles Stripe payment-related API calls

import apiClient, { ApiResponse, handleApiError } from '../lib/api';

/**
 * Payment Type Definitions
 */
export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface SessionStatus {
  status: string;
  customer_email?: string;
  payment_status?: string;
}

export interface PortalSession {
  url: string;
}

/**
 * Payment Service
 */
class PaymentService {
  /**
   * Create Stripe checkout session for premium subscription
   */
  async createCheckoutSession(priceId?: string): Promise<CheckoutSession> {
    try {
      const response = await apiClient.post<ApiResponse<CheckoutSession>>(
        '/api/payment/create-checkout-session',
        { priceId }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to create checkout session');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get checkout session status
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    try {
      const response = await apiClient.get<ApiResponse<SessionStatus>>(
        `/api/payment/session/${sessionId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get session status');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create Stripe customer portal session
   */
  async createPortalSession(): Promise<PortalSession> {
    try {
      const response = await apiClient.post<ApiResponse<PortalSession>>(
        '/api/payment/create-portal-session'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to create portal session');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(priceId?: string): Promise<void> {
    try {
      const session = await this.createCheckoutSession(priceId);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to redirect to checkout');
    }
  }

  /**
   * Redirect to Stripe customer portal
   */
  async redirectToPortal(): Promise<void> {
    try {
      const portal = await this.createPortalSession();
      if (portal.url) {
        window.location.href = portal.url;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to redirect to portal');
    }
  }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;
