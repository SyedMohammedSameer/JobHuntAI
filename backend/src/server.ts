// backend/src/server.ts
// Complete Server Setup - Phase 3C (Resume + Cover Letter)

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import connectDB from './config/database';
import logger from './utils/logger';

// Import Routes
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import resumeRoutes from './routes/resumeRoutes';
import coverLetterRoutes from './routes/coverLetterRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

// Import Cron Jobs
import dailyJobRefreshService from './jobs/dailyJobRefresh';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (only in development)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// ==================== ROUTES ====================

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ==================== ERROR HANDLERS ====================

// Multer Error Handler (Phase 3C)
// This must come BEFORE the 404 handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file allowed per upload.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "resume" as the field name.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // Handle custom file filter errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Pass to next error handler if not a Multer error
  next(err);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== CRON JOB INITIALIZATION ====================

/**
 * Initialize automated job refresh cron
 */
const initializeJobCron = (): void => {
  try {
    // Start the daily job refresh cron
    dailyJobRefreshService.start();
    
    logger.info('✅ Job refresh cron initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize job refresh cron:', error);
    // Don't exit - server can still run without cron
  }
};

// ==================== SERVER STARTUP ====================

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Step 1: Connect to MongoDB
    logger.info('🔄 Connecting to MongoDB...');
    await connectDB();
    logger.info('✅ MongoDB connected successfully');

    // Step 2: Initialize cron jobs
    logger.info('🔄 Initializing cron jobs...');
    initializeJobCron();

    // Step 3: Start Express server
    const server = app.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════');
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${FRONTEND_URL}`);
      logger.info(`⏰ Cron Jobs: ${process.env.ENABLE_DAILY_JOB_REFRESH === 'true' ? 'ENABLED' : 'DISABLED'}`);
      if (process.env.ENABLE_DAILY_JOB_REFRESH === 'true') {
        logger.info(`📅 Cron Schedule: ${process.env.JOB_REFRESH_CRON || '0 2 * * *'}`);
      }
      logger.info(`📄 Resume API: ENABLED (Phase 3C)`);
      logger.info(`✉️  Cover Letter API: ENABLED (Phase 3C)`); // NEW
      logger.info('═══════════════════════════════════════════════════');
    });

    // ==================== GRACEFUL SHUTDOWN ====================

    /**
     * Graceful shutdown handler
     */
    const gracefulShutdown = (signal: string): void => {
      logger.info(`\n${signal} signal received. Starting graceful shutdown...`);

      // Step 1: Stop accepting new requests
      server.close(() => {
        logger.info('✅ HTTP server closed');

        // Step 2: Stop cron jobs
        try {
          dailyJobRefreshService.stop();
          logger.info('✅ Cron jobs stopped');
        } catch (error) {
          logger.error('❌ Error stopping cron jobs:', error);
        }

        // Step 3: Close database connection
        // MongoDB will close automatically, but you can add explicit cleanup if needed
        logger.info('✅ Database connections closed');

        logger.info('👋 Graceful shutdown complete. Goodbye!');
        process.exit(0);
      });

      // Force shutdown after 30 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
      logger.error(error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('🔥 UNHANDLED REJECTION! Shutting down...');
      logger.error('Reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ==================== START APPLICATION ====================

// Only start server if this file is run directly (not imported)
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;