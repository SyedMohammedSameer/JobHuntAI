import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express } from 'express';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * @param app Express application instance
 */
export const initializeSentry = (app: Express): void => {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!sentryDsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Enable profiling
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
      // Profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Additional options
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        return event;
      },
    });

    console.log('✅ Sentry initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
};

/**
 * Capture an exception with additional context
 * @param error The error to capture
 * @param context Additional context information
 */
export const captureException = (error: Error, context?: Record<string, any>): void => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message with severity level
 * @param message The message to capture
 * @param level Severity level (info, warning, error)
 * @param context Additional context information
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void => {
  Sentry.captureMessage(message, {
    level: level as any,
    extra: context,
  });
};

/**
 * Set user context for error tracking
 * @param user User information
 */
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
}): void => {
  Sentry.setUser(user);
};

/**
 * Clear user context
 */
export const clearUserContext = (): void => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for better error context
 * @param message Breadcrumb message
 * @param category Category of the breadcrumb
 * @param data Additional data
 */
export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  data?: Record<string, any>
): void => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info' as any,
  });
};

// Export Sentry handlers for Express middleware
export const Handlers = Sentry.Handlers;

export default {
  initializeSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  Handlers,
};
