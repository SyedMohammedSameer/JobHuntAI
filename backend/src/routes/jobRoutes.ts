// backend/src/routes/jobRoutes.ts
// Complete Job Routes - Phase 2

import express from 'express';
import {
  // Phase 1 & 2 (Chunks 1-2) - Existing methods
  searchJobs,
  getJobStats,
  getJobById,
  bookmarkJob,
  getBookmarkedJobs,
  triggerJobAggregation,
  // Phase 2 (Chunk 3) - New methods
  getRefreshStats,
  triggerManualRefresh,
  triggerCleanup,
  getCleanupStats,
  analyzeJobVisa,
  batchAnalyzeVisa,
  getJobSystemHealth
} from '../controllers/jobController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Job search and info
router.get('/', searchJobs);                              // Search jobs with filters
router.get('/stats', getJobStats);                        // Get job statistics by source
router.get('/:id', getJobById);                          // Get single job details

// System monitoring (public)
router.get('/system/health', getJobSystemHealth);         // System health status
router.get('/system/refresh-stats', getRefreshStats);     // Last refresh statistics
router.get('/system/cleanup-stats', getCleanupStats);     // Cleanup statistics

// Visa analysis (public)
router.post('/:id/analyze-visa', analyzeJobVisa);         // Analyze single job visa sponsorship

// ==================== PROTECTED ROUTES (Authentication Required) ====================

// User actions
router.post('/:id/bookmark', authenticateToken, bookmarkJob);              // Bookmark/unbookmark job
router.get('/bookmarked/list', authenticateToken, getBookmarkedJobs);      // Get user's bookmarked jobs

// Job aggregation
router.post('/aggregate', authenticateToken, triggerJobAggregation);       // Trigger manual job aggregation

// System operations (admin/authenticated)
router.post('/system/refresh', authenticateToken, triggerManualRefresh);   // Trigger manual refresh
router.post('/system/cleanup', authenticateToken, triggerCleanup);         // Trigger cleanup
router.post('/batch/analyze-visa', authenticateToken, batchAnalyzeVisa);   // Batch analyze visa sponsorship

export default router;

/**
 * COMPLETE API ENDPOINTS:
 * 
 * PUBLIC (No Authentication):
 *   GET    /api/jobs                        - Search jobs with filters
 *   GET    /api/jobs/stats                  - Job statistics by source
 *   GET    /api/jobs/:id                    - Single job details
 *   GET    /api/jobs/system/health          - System health status
 *   GET    /api/jobs/system/refresh-stats   - Last refresh statistics
 *   GET    /api/jobs/system/cleanup-stats   - Cleanup statistics
 *   POST   /api/jobs/:id/analyze-visa       - Analyze job visa sponsorship
 * 
 * PROTECTED (Authentication Required):
 *   POST   /api/jobs/:id/bookmark           - Bookmark/unbookmark job
 *   GET    /api/jobs/bookmarked/list        - Get user's bookmarked jobs
 *   POST   /api/jobs/aggregate              - Manual job aggregation
 *   POST   /api/jobs/system/refresh         - Trigger manual refresh
 *   POST   /api/jobs/system/cleanup         - Trigger cleanup
 *   POST   /api/jobs/batch/analyze-visa     - Batch analyze visa sponsorship
 * 
 * Total: 13 endpoints (7 public + 6 protected)
 */