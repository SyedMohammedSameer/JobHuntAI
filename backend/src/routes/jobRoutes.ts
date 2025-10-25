import express from 'express';
import * as jobController from '../controllers/jobController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// ==================== ROUTE ORDER: SPECIFIC BEFORE PARAMETERIZED ====================

// ==================== SPECIFIC ROUTES FIRST ====================

/**
 * @route   GET /api/jobs/search
 * @desc    Search jobs with filters
 * @access  Public
 */
router.get('/search', jobController.searchJobs);

/**
 * @route   GET /api/jobs/bookmarked/list
 * @desc    Get user's bookmarked jobs
 * @access  Private
 */
router.get('/bookmarked/list', authenticateToken, jobController.getBookmarkedJobs);

/**
 * @route   GET /api/jobs/system/refresh-stats
 * @desc    Get job refresh statistics
 * @access  Public
 */
router.get('/system/refresh-stats', jobController.getRefreshStats);

/**
 * @route   GET /api/jobs/system/cleanup-stats
 * @desc    Get cleanup statistics
 * @access  Public
 */
router.get('/system/cleanup-stats', jobController.getCleanupStats);

/**
 * @route   GET /api/jobs/stats
 * @desc    Get job statistics
 * @access  Public
 */
router.get('/stats', jobController.getJobStats);

/**
 * @route   POST /api/jobs/system/refresh
 * @desc    Manually trigger job refresh
 * @access  Private
 */
router.post('/system/refresh', authenticateToken, jobController.triggerManualRefresh);

/**
 * @route   POST /api/jobs/system/cleanup
 * @desc    Manually trigger cleanup
 * @access  Private
 */
router.post('/system/cleanup', authenticateToken, jobController.triggerCleanup);

/**
 * @route   POST /api/jobs/aggregate
 * @desc    Manually trigger job aggregation
 * @access  Private
 */
router.post('/aggregate', authenticateToken, jobController.triggerJobAggregation);

// ==================== PARAMETERIZED ROUTES (MUST COME LAST) ====================

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Public
 */
router.get('/:id', jobController.getJobById);

/**
 * @route   POST /api/jobs/:id/bookmark
 * @desc    Bookmark or unbookmark a job (toggle)
 * @access  Private
 */
router.post('/:id/bookmark', authenticateToken, jobController.bookmarkJob);

/**
 * @route   POST /api/jobs/:id/analyze-visa
 * @desc    Analyze visa sponsorship for a specific job
 * @access  Public
 */
router.post('/:id/analyze-visa', jobController.analyzeJobVisa);

export default router;