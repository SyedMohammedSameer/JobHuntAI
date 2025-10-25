import express from 'express';
import * as jobController from '../controllers/jobController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// ==================== IMPORTANT: ROUTE ORDER MATTERS ====================
// Specific routes (like /search, /filters, /stats) MUST come BEFORE parameterized routes (like /:id)
// Otherwise Express will match /search to /:id and treat "search" as an ID parameter

// ==================== PUBLIC ROUTES (No Authentication) ====================

/**
 * @route   GET /api/jobs/search
 * @desc    Search jobs with filters
 * @query   keyword, location, jobType, experienceLevel, visaSponsorship, page, limit, sort
 * @access  Public
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/search', jobController.searchJobs);

/**
 * @route   GET /api/jobs/filters
 * @desc    Get available filter options
 * @access  Public
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/filters', jobController.getFilterOptions);

/**
 * @route   GET /api/jobs/stats
 * @desc    Get job statistics
 * @access  Public
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/stats', jobController.getJobStats);

/**
 * @route   GET /api/jobs/featured
 * @desc    Get featured jobs
 * @access  Public
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/featured', jobController.getFeaturedJobs);

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with pagination
 * @query   page, limit
 * @access  Public
 */
router.get('/', jobController.getAllJobs);

/**
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Public
 * 
 * MUST COME AFTER ALL SPECIFIC ROUTES!
 */
router.get('/:id', jobController.getJobById);

// ==================== PROTECTED ROUTES (Authentication Required) ====================

/**
 * @route   GET /api/jobs/:id/similar
 * @desc    Get similar jobs
 * @access  Public
 * 
 * MUST BE BEFORE OTHER /:id/action ROUTES IF THEY REQUIRE AUTH!
 */
router.get('/:id/similar', jobController.getSimilarJobs);

/**
 * @route   POST /api/jobs/:id/save
 * @desc    Save/bookmark a job
 * @access  Private
 */
router.post('/:id/save', authenticateToken, jobController.saveJob);

/**
 * @route   DELETE /api/jobs/:id/save
 * @desc    Unsave/remove bookmark from a job
 * @access  Private
 */
router.delete('/:id/save', authenticateToken, jobController.unsaveJob);

/**
 * @route   GET /api/jobs/saved/list
 * @desc    Get user's saved jobs
 * @access  Private
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/saved/list', authenticateToken, jobController.getSavedJobs);

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Track job application
 * @access  Private
 */
router.post('/:id/apply', authenticateToken, jobController.applyToJob);

/**
 * @route   GET /api/jobs/applications/list
 * @desc    Get user's job applications
 * @access  Private
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/applications/list', authenticateToken, jobController.getApplications);

/**
 * @route   PUT /api/jobs/applications/:applicationId
 * @desc    Update application status
 * @access  Private
 */
router.put('/applications/:applicationId', authenticateToken, jobController.updateApplicationStatus);

/**
 * @route   DELETE /api/jobs/applications/:applicationId
 * @desc    Delete application record
 * @access  Private
 */
router.delete('/applications/:applicationId', authenticateToken, jobController.deleteApplication);

/**
 * @route   POST /api/jobs/refresh
 * @desc    Manually trigger job refresh (admin only, but not enforced yet)
 * @access  Public (should be admin-only in production)
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.post('/refresh', jobController.manualRefresh);

/**
 * @route   GET /api/jobs/user/recommendations
 * @desc    Get personalized job recommendations
 * @access  Private
 * 
 * MUST BE BEFORE /:id ROUTE!
 */
router.get('/user/recommendations', authenticateToken, jobController.getRecommendations);

export default router;