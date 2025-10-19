// Simple in-memory rate limiter for API calls

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
  }
  
  class ApiRateLimiter {
    private requests: Map<string, number[]> = new Map();
    private config: RateLimitConfig;
  
    constructor(config: RateLimitConfig) {
      this.config = config;
    }
  
    async checkLimit(apiName: string): Promise<boolean> {
      const now = Date.now();
      const windowStart = now - this.config.windowMs;
      
      // Get existing requests for this API
      let apiRequests = this.requests.get(apiName) || [];
      
      // Filter out old requests outside the window
      apiRequests = apiRequests.filter(timestamp => timestamp > windowStart);
      
      // Check if we're at the limit
      if (apiRequests.length >= this.config.maxRequests) {
        return false;
      }
      
      // Add current request
      apiRequests.push(now);
      this.requests.set(apiName, apiRequests);
      
      return true;
    }
  
    async waitForSlot(apiName: string): Promise<void> {
      while (!(await this.checkLimit(apiName))) {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  
    reset(apiName: string): void {
      this.requests.delete(apiName);
    }
  
    resetAll(): void {
      this.requests.clear();
    }
  }
  
  // Export a singleton instance
  export const rateLimiter = new ApiRateLimiter({
    maxRequests: 10, // 10 requests
    windowMs: 60000  // per minute
  });